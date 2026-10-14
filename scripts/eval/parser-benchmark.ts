/**
 * scripts/eval/parser-benchmark.ts
 *
 * Scores the deterministic tier (pdf.table.ts) against a ground-truth corpus.
 * No network calls are made, so this measures Tier 1 alone.
 *
 * A predicted row is a true positive when an unmatched ground-truth row has
 * the same date, amount and direction (multiset matching, so repeated
 * identical rows must each be found). Balance agreement and the share of
 * statements Tier 1 can verify by balance continuity (anchored to the printed
 * opening balance, as the app does) — the ones that would never reach the
 * LLM — are reported separately, as is narration accuracy: the share of rows
 * whose narration matches ground truth (whitespace and case ignored), counting
 * a row as exact when the PDF itself prints a truncated narration that the
 * extracted one reproduces in full (E1's generator clips narrations at 38
 * characters).
 *
 * Scanned statements (no text layer) are OCR'd first when --ocr is given
 * (needs qpdf and tesseract); --limit N scores only the first N statements
 * per bank.
 *
 *   pnpm eval:parser -- --corpus eval/corpus/e1 [--json results.json] [--ocr] [--limit N]
 */

import fs from "fs"
import { detectBank, GENERIC_PROFILE } from "@/server/services/parser/bank-profiles"
import { extractTransactions } from "@/server/services/parser/pdf.table"
import { statementHeaderText } from "@/server/services/parser/pdf.header"
import { lacksTextLayer, ocrPages } from "@/server/services/parser/pdf.ocr"
import { findOpeningBalance, validateBalanceContinuity } from "@/lib/parser/validateContinuity"
import { argValue, extractPages, loadCorpus, localYmd, pct } from "./lib"

/** Bank codes used by the corpus mapped to app profile ids. */
const PROFILE_ID: Record<string, string> = {
  HDFC: "hdfc", ICICI: "icici", SBI: "sbi", AXIS: "axis",
  KOTAK: "kotak", PNB: "pnb", BOB: "bob", YES: "yesbank",
}

interface BankStats {
  statements: number
  fingerprinted: number
  verified: number
  groundTruth: number
  predicted: number
  truePositives: number
  balanceMatches: number
  narrationExact: number
  ms: number
  ocrMs?: number
}

async function main() {
  const corpusDir = argValue("--corpus", "eval/corpus/e1")
  const jsonOut = argValue("--json", "")
  const useOcr = process.argv.includes("--ocr")
  const limit = Number(argValue("--limit", "0"))
  const seen = new Map<string, number>()
  const corpus = loadCorpus(corpusDir).filter((e) => {
    const n = (seen.get(e.bank) ?? 0) + 1
    seen.set(e.bank, n)
    return !limit || n <= limit
  })

  // The parser warns on every fallback; keep the report readable.
  const warn = console.warn
  console.warn = () => {}

  const stats = new Map<string, BankStats>()
  for (const entry of corpus) {
    const s = stats.get(entry.bank) ?? { statements: 0, fingerprinted: 0, verified: 0, groundTruth: 0, predicted: 0, truePositives: 0, balanceMatches: 0, narrationExact: 0, ms: 0 }
    stats.set(entry.bank, s)

    let pages = await extractPages(entry.pdfPath)
    let ocrMs = 0
    if (useOcr && lacksTextLayer(pages)) {
      const t = performance.now()
      pages = await ocrPages(fs.readFileSync(entry.pdfPath), pages.map((p) => ({ width: p.width, height: p.height })))
      ocrMs = performance.now() - t
    }
    s.ocrMs = (s.ocrMs ?? 0) + ocrMs
    const text = pages.map((p) => p.content.map((c) => c.str).join(" ")).join("\n")

    const t0 = performance.now()
    const detected = detectBank(statementHeaderText(pages))
    const predicted = extractTransactions(pages, detected ?? GENERIC_PROFILE)
    s.ms += performance.now() - t0

    s.statements++
    // Banks without a profile (e.g. fictional ones in external corpora) are
    // correctly fingerprinted when nothing is detected.
    if ((detected?.id ?? null) === (PROFILE_ID[entry.bank] ?? null)) s.fingerprinted++

    const continuity = validateBalanceContinuity(predicted.map((t) => ({
      date: "", description: t.description, refNo: null,
      debit: t.type === "debit" ? t.amount : null,
      credit: t.type === "credit" ? t.amount : null,
      balance: t.balance ?? null,
    })), findOpeningBalance(text))
    if (predicted.length > 0 && continuity.valid && predicted.every((t) => t.balance != null)) s.verified++

    // Multiset match on (date, amount, direction); balance checked on matches.
    const pool = new Map<string, number[]>()
    for (const t of entry.groundTruth.transactions) {
      const key = `${t.date}|${(t.debit || t.credit).toFixed(2)}|${t.type}`
      pool.set(key, [...(pool.get(key) ?? []), t.balance])
    }
    for (const t of predicted) {
      const balances = pool.get(`${localYmd(t.date)}|${t.amount.toFixed(2)}|${t.type}`)
      if (!balances?.length) continue
      s.truePositives++
      const at = balances.findIndex((b) => t.balance != null && Math.abs(b - t.balance) <= 0.01)
      if (at !== -1) s.balanceMatches++
      balances.splice(at === -1 ? 0 : at, 1)
    }
    // Narrations, row by row in statement order.
    const norm = (t: string) => t.replace(/\s+/g, "").toLowerCase()
    predicted.forEach((t, i) => {
      const g = entry.groundTruth.transactions[i]
      if (!g) return
      const got = norm(t.rawDescription)
      const want = norm(g.narration)
      if (got === want || (got.length >= 30 && want.startsWith(got) && t.rawDescription.length >= 38)) s.narrationExact++
    })

    s.groundTruth += entry.groundTruth.transactions.length
    s.predicted += predicted.length
  }
  console.warn = warn

  const f1 = (s: { truePositives: number; predicted: number; groundTruth: number }) => {
    const p = s.predicted ? s.truePositives / s.predicted : 0
    const r = s.groundTruth ? s.truePositives / s.groundTruth : 0
    return { p, r, f1: p + r ? (2 * p * r) / (p + r) : 0 }
  }

  console.log(`Deterministic tier on ${corpus.length} statements from ${corpusDir}\n`)
  console.log("Bank    Stmts  Txns   Precision  Recall  F1      Balance  Fingerprint  Verified  ms/stmt  Narration")
  const total: BankStats = { statements: 0, fingerprinted: 0, verified: 0, groundTruth: 0, predicted: 0, truePositives: 0, balanceMatches: 0, narrationExact: 0, ms: 0 }
  const rows: Record<string, unknown>[] = []
  for (const [bank, s] of [...stats.entries()].sort()) {
    const m = f1(s)
    console.log(
      `${bank.padEnd(7)} ${String(s.statements).padStart(5)}  ${String(s.groundTruth).padStart(5)}  ${m.p.toFixed(4)}     ${m.r.toFixed(4)}  ${m.f1.toFixed(4)}  ${pct(s.balanceMatches, s.truePositives).padStart(7)}  ${`${s.fingerprinted}/${s.statements}`.padStart(11)}  ${`${s.verified}/${s.statements}`.padStart(8)}  ${(s.ms / s.statements).toFixed(2).padStart(7)}  ${pct(s.narrationExact, s.groundTruth).padStart(8)}`
    )
    rows.push({ bank, ...s, precision: m.p, recall: m.r, f1: m.f1 })
    for (const k of Object.keys(total) as (keyof BankStats)[]) total[k] = (total[k] ?? 0) + (s[k] ?? 0)
  }
  const m = f1(total)
  console.log(
    `${"MICRO".padEnd(7)} ${String(total.statements).padStart(5)}  ${String(total.groundTruth).padStart(5)}  ${m.p.toFixed(4)}     ${m.r.toFixed(4)}  ${m.f1.toFixed(4)}  ${pct(total.balanceMatches, total.truePositives).padStart(7)}  ${`${total.fingerprinted}/${total.statements}`.padStart(11)}  ${`${total.verified}/${total.statements}`.padStart(8)}  ${(total.ms / total.statements).toFixed(2).padStart(7)}  ${pct(total.narrationExact, total.groundTruth).padStart(8)}`
  )

  if ([...stats.values()].some((s) => s.ocrMs)) {
    const ocr = [...stats.values()].reduce((n, s) => n + (s.ocrMs ?? 0), 0)
    console.log(`\nOCR time: ${(ocr / corpus.length / 1000).toFixed(1)} s per statement (not included in ms/stmt)`)
  }

  if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify({ corpus: corpusDir, perBank: rows, micro: { ...total, precision: m.p, recall: m.r, f1: m.f1 } }, null, 2))
    console.log(`\nWrote ${jsonOut}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
