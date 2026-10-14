/**
 * scripts/eval/lib.ts
 *
 * Shared helpers for the evaluation scripts: corpus loading, positioned-text
 * extraction (the same pdf.js-extract path the app uses), and a seeded PRNG so
 * every perturbation run is reproducible.
 */

import fs from "fs"
import path from "path"
import type { PositionedPage } from "@/server/services/parser/pdf.types"

export interface GroundTruthTransaction {
  date: string // YYYY-MM-DD
  narration: string
  ref: string
  debit: number
  credit: number
  balance: number
  type: "debit" | "credit"
}

export interface GroundTruthStatement {
  statement_id: string
  bank: string
  opening_balance: number
  closing_balance: number
  transactions: GroundTruthTransaction[]
}

export interface CorpusEntry {
  id: string
  bank: string
  pdfPath: string
  groundTruth: GroundTruthStatement
}

/** Reads manifest.csv from a corpus built by eval/corpus/generator/build_corpus.py. */
export function loadCorpus(dir: string): CorpusEntry[] {
  const manifest = path.join(dir, "manifest.csv")
  if (!fs.existsSync(manifest)) {
    throw new Error(`No manifest.csv in ${dir}. See scripts/eval/README.md for building or locating a corpus.`)
  }
  const [header, ...rows] = fs.readFileSync(manifest, "utf8").trim().split("\n")
  const cols = header!.split(",")
  const at = (name: string) => cols.indexOf(name)
  return rows.map((line) => {
    const cells = line.split(",")
    return {
      id: cells[at("statement_id")]!,
      bank: cells[at("bank")]!,
      pdfPath: path.join(dir, cells[at("pdf_path")]!),
      groundTruth: JSON.parse(fs.readFileSync(path.join(dir, cells[at("ground_truth_path")]!), "utf8")),
    }
  })
}

export async function extractPages(pdfPath: string): Promise<PositionedPage[]> {
  const { PDFExtract } = await import("pdf.js-extract")
  const data = await new PDFExtract().extractBuffer(fs.readFileSync(pdfPath), {})
  return data.pages.map((page, i) => ({
    pageNumber: i + 1,
    width: page.info?.width ?? 0,
    height: page.info?.height ?? 0,
    content: page.content.map(({ str, x, y, width, height }) => ({ str, x, y, width, height })),
  }))
}

/** Local calendar date, matching how the parser constructs Date objects. */
export function localYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** mulberry32: small, fast, seedable. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function argValue(flag: string, fallback: string): string {
  const i = process.argv.indexOf(flag)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : fallback
}

export function pct(n: number, d: number): string {
  return d === 0 ? "n/a" : `${((n / d) * 100).toFixed(2)}%`
}
