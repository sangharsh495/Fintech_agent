// ─── Scanned statements: OCR to positioned text ─────────────
// A scanned statement has page images and no text layer, so neither tier can
// read it directly. This module turns each page image into positioned words
// (the same shape pdf.js-extract produces), so the table parser and the
// balance continuity check run on scans unchanged; OCR digit errors then show
// up as continuity breaks instead of passing silently.
//
// Uses two system binaries, like pdf.decrypt.ts: qpdf to export page images
// and tesseract to read them. Without them, scans are reported as unsupported.

import { execFile } from "child_process"
import { promisify } from "util"
import { randomUUID } from "crypto"
import fs from "fs/promises"
import os from "os"
import path from "path"
import type { PositionedPage, PositionedTextItem } from "./pdf.types"

const execFileAsync = promisify(execFile)

/** Words below this Tesseract confidence are scan noise (specks, watermark fragments). */
const MIN_WORD_CONFIDENCE = 30

/** Pages read in parallel. Tesseract is CPU-bound and single-threaded per page here. */
const OCR_CONCURRENCY = Math.max(1, Math.min(4, os.cpus().length))

/** A4 width in points, used when a scan's page box is not in real points. */
const A4_WIDTH_PT = 595

/** Per-page OCR time limit. */
const OCR_PAGE_TIMEOUT_MS = 30_000

let availability: Promise<boolean> | null = null

/** True when qpdf and tesseract are both installed. Checked once per process. */
export function isOcrAvailable(): Promise<boolean> {
  availability ??= Promise.all([
    execFileAsync("qpdf", ["--version"], { timeout: 5000 }),
    execFileAsync("tesseract", ["--version"], { timeout: 5000 }),
  ]).then(() => true, () => false)
  return availability
}

/**
 * A document with (almost) no extractable text is a scan. Statement pages
 * carry hundreds of characters each, so a few stray characters (a page
 * number, an invisible OCR layer fragment) do not count.
 */
export function lacksTextLayer(pages: PositionedPage[]): boolean {
  const chars = pages.reduce((n, p) => n + p.content.reduce((m, item) => m + item.str.trim().length, 0), 0)
  return pages.length > 0 && chars < 40 * pages.length
}

interface QpdfPageImage {
  object: string
  width: number
  height: number
  filter: string[]
}

/**
 * OCRs every page image. `pageSizes` are the pages' sizes in points (from
 * pdf.js), used to scale pixel boxes into the coordinate space the table
 * parser's tolerances are written for.
 */
export async function ocrPages(buffer: Buffer, pageSizes: Array<{ width: number; height: number }>): Promise<PositionedPage[]> {
  const dir = path.join(os.tmpdir(), `finflow-ocr-${randomUUID()}`)
  await fs.mkdir(dir, { recursive: true })
  try {
    const input = path.join(dir, "in.pdf")
    await fs.writeFile(input, buffer)
    await execFileAsync("qpdf", [
      // Stream files are written only for objects in the output, hence the qpdf key.
      "--json=2", "--json-key=pages", "--json-key=qpdf", "--json-stream-data=file",
      `--json-stream-prefix=${path.join(dir, "s")}`, "--decode-level=generalized",
      input, path.join(dir, "out.json"),
    ], { timeout: 60_000, maxBuffer: 64 * 1024 * 1024 })

    const json = JSON.parse(await fs.readFile(path.join(dir, "out.json"), "utf8")) as {
      pages: Array<{ images: QpdfPageImage[] }>
      qpdf: [unknown, Record<string, { stream?: { datafile?: string } }>]
    }
    const objects = json.qpdf[1]

    const jobs = json.pages.map((page, index) => async (): Promise<PositionedPage> => {
      const size = pageSizes[index] ?? { width: 595, height: 842 }
      // The scan is the page's largest JPEG; logos and stamps are smaller.
      const image = page.images
        .filter((img) => img.filter.includes("/DCTDecode"))
        .sort((a, b) => b.width * b.height - a.width * a.height)[0]
      if (!image) return { pageNumber: index + 1, width: size.width, height: size.height, content: [] }

      const file = objects[`obj:${image.object}`]?.stream?.datafile
      if (!file) return { pageNumber: index + 1, width: size.width, height: size.height, content: [] }
      const { stdout } = await execFileAsync("tesseract", [file, "-", "--psm", "6", "tsv"], {
        timeout: OCR_PAGE_TIMEOUT_MS,
        maxBuffer: 16 * 1024 * 1024,
        env: { ...process.env, OMP_THREAD_LIMIT: "1" },
      })
      // Scale pixels to points. Some scanners write the page box in pixels
      // (2481 "points" wide); the parser's tolerances assume paper-sized
      // points, so an implausible width is replaced by A4's.
      const width = size.width >= 200 && size.width <= 1500 ? size.width : A4_WIDTH_PT
      const scale = width / image.width
      return { pageNumber: index + 1, width, height: image.height * scale, content: wordsToItems(stdout, scale) }
    })

    const pages: PositionedPage[] = new Array(jobs.length)
    let nextJob = 0
    await Promise.all(
      Array.from({ length: Math.min(OCR_CONCURRENCY, jobs.length) }, async () => {
        while (nextJob < jobs.length) {
          const i = nextJob++
          // One unreadable page must not abort the others (and delete their
          // files mid-read); it simply yields no text, which the continuity
          // check and the LLM fallback then deal with.
          pages[i] = await jobs[i]!().catch(() => ({ pageNumber: i + 1, width: pageSizes[i]?.width ?? 595, height: pageSizes[i]?.height ?? 842, content: [] }))
        }
      })
    )
    return pages
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Strips the punctuation OCR attaches to numbers and cell edges: a table rule
 * read as "|", a trailing comma or quote, an unmatched closing parenthesis
 * ("475,617.41)" when the amount has no opening one).
 */
function cleanOcrToken(text: string): string {
  let t = text.replace(/^[|¦]+|[|¦]+$/g, "")
  if (/\d/.test(t)) {
    t = t.replace(/[,;:'"`’”]+$/, "").replace(/^[,;:'"`‘“]+/, "")
    if (t.endsWith(")") && !t.includes("(")) t = t.slice(0, -1)
  }
  return t
}

interface OcrWord { line: string; left: number; top: number; width: number; height: number; text: string }

/**
 * Groups Tesseract's words into phrases — "Rs." + "6,086.63", "01 Jan 2024",
 * a narration — the way a PDF text layer stores them: consecutive words on a
 * line whose gap is under one character height. Wider gaps are column breaks.
 */
function wordsToItems(tsv: string, scale: number): PositionedTextItem[] {
  const words: OcrWord[] = []
  for (const line of tsv.split("\n").slice(1)) {
    const cols = line.split("\t")
    if (cols.length < 12 || cols[0] !== "5") continue
    const text = cols[11]!.trim()
    const conf = Number(cols[10])
    // Low confidence drops specks and watermark fragments, but not numbers:
    // a watermark over the amount column lowers their confidence too, and a
    // misread digit is caught by the balance continuity check anyway.
    const numeric = /\d[\d,.]*\d/.test(text)
    if (!text || (!numeric && conf < MIN_WORD_CONFIDENCE) || /^[|¦_—–-]+$/.test(text)) continue
    words.push({
      line: `${cols[2]}.${cols[3]}.${cols[4]}`,
      left: Number(cols[6]), top: Number(cols[7]), width: Number(cols[8]), height: Number(cols[9]),
      text: cleanOcrToken(text),
    })
  }

  // Every word on a Tesseract line gets the line's median top and height. A
  // word box merged with a table rule or a speck can be twice as tall, and
  // its top would otherwise drop it into a separate row.
  const byLine = new Map<string, OcrWord[]>()
  for (const word of words) byLine.set(word.line, [...(byLine.get(word.line) ?? []), word])
  const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!
  for (const lineWords of byLine.values()) {
    const height = median(lineWords.map((w) => w.height))
    const top = median(lineWords.map((w) => w.top + w.height)) - height // shared baseline-ish bottom
    for (const w of lineWords) {
      w.top = top
      w.height = height
    }
  }

  const items: PositionedTextItem[] = []
  let phrase: OcrWord | null = null
  const flush = () => {
    if (phrase?.text) items.push({ str: phrase.text, x: phrase.left * scale, y: phrase.top * scale, width: phrase.width * scale, height: phrase.height * scale })
    phrase = null
  }
  for (const word of words) {
    const gap: number = phrase ? word.left - (phrase.left + phrase.width) : Infinity
    if (phrase && phrase.line === word.line && gap >= 0 && gap < Math.max(phrase.height, word.height)) {
      phrase.text = `${phrase.text} ${word.text}`
      phrase.width = word.left + word.width - phrase.left
      phrase.top = Math.min(phrase.top, word.top)
      phrase.height = Math.max(phrase.height, word.height)
    } else {
      flush()
      phrase = { ...word }
    }
  }
  flush()
  return items
}
