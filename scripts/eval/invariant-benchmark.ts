/**
 * scripts/eval/invariant-benchmark.ts
 *
 * Fault-injection test of the balance continuity check
 * (lib/parser/validateContinuity.ts) and of overlap deduplication
 * (server/services/parser/deduplicator.ts).
 *
 * Faults are injected into the ground-truth ledgers, so this measures the
 * checks themselves, not the parser. Each mode corrupts one row per statement,
 * with a per-statement seed:
 *   omission   — a row is dropped; later balances are left as printed
 *   insertion  — a fabricated debit is inserted; balances are not adjusted
 *   tamper     — one debit/credit amount is changed by Rs. 50–500
 *   balance    — one printed balance is changed by Rs. 50–500 (OCR drift)
 *   polarity   — one row's debit/credit direction is flipped
 * A detection is "localized" when a reported row is within one of the fault.
 * Every mode is run twice: unanchored, and anchored to the statement's opening
 * balance (what the app does when the statement prints one).
 *
 * Deduplication: each statement is uploaded as two overlapping halves; every
 * row of the overlap must be recognised as a duplicate and every other row
 * kept, including genuinely repeated identical payments.
 *
 *   pnpm eval:invariant -- --corpus eval/corpus/e1 [--seed 42]
 */

import { validateBalanceContinuity } from "@/lib/parser/validateContinuity"
import type { Transaction } from "@/lib/parser/schema"
import { deduplicateTransactions } from "@/server/services/parser/deduplicator"
import type { ParsedTransaction } from "@/server/services/parser/deduplicator"
import { argValue, loadCorpus, pct, seededRandom, type GroundTruthTransaction } from "./lib"

type Mode = "omission" | "insertion" | "tamper" | "balance" | "polarity"
const MODES: Mode[] = ["omission", "insertion", "tamper", "balance", "polarity"]

const toRow = (t: GroundTruthTransaction): Transaction => ({
  date: t.date,
  description: t.narration,
  refNo: t.ref,
  debit: t.debit || null,
  credit: t.credit || null,
  balance: t.balance,
})

const round2 = (n: number) => Math.round(n * 100) / 100

function perturb(rows: Transaction[], mode: Mode, rand: () => number): { rows: Transaction[]; index: number } {
  const out = rows.map((r) => ({ ...r }))
  const pick = (max: number) => Math.floor(rand() * (max + 1))
  const delta = round2(50 + rand() * 450)

  switch (mode) {
    case "omission": {
      const index = pick(out.length - 2)
      out.splice(index, 1)
      return { rows: out, index }
    }
    case "insertion": {
      const index = pick(out.length - 1)
      out.splice(index, 0, { ...out[index]!, description: "UPI/999999999999/unknown.payee/Payment", debit: round2(100 + rand() * 1900), credit: null })
      return { rows: out, index }
    }
    case "tamper": {
      const index = pick(out.length - 1)
      const row = out[index]!
      if (row.debit) row.debit = round2(row.debit + delta)
      else row.credit = round2((row.credit ?? 0) + delta)
      return { rows: out, index }
    }
    case "balance": {
      const index = pick(out.length - 1)
      out[index]!.balance = round2((out[index]!.balance ?? 0) + delta)
      return { rows: out, index }
    }
    case "polarity": {
      const index = pick(out.length - 1)
      const row = out[index]!
      ;[row.debit, row.credit] = [row.credit, row.debit]
      return { rows: out, index }
    }
  }
}

async function dedupOverlap(txns: GroundTruthTransaction[], bankAccountId: string) {
  const parsed: ParsedTransaction[] = txns.map((t) => ({
    date: new Date(`${t.date}T00:00:00`),
    description: t.narration,
    rawDescription: t.narration,
    amount: t.debit || t.credit,
    type: t.type,
    balance: t.balance,
    category: "Uncategorized",
    isRecurring: false,
    hash: "",
  }))

  // First upload: rows [0, b). Second upload: rows [a, n), so [a, b) overlaps.
  const a = Math.floor(parsed.length / 3)
  const b = Math.floor((2 * parsed.length) / 3)
  const stored: string[] = []
  const db = {
    select: () => db, from: () => db, where: () => db, orderBy: () => db,
    limit: async () => [],
    then: (resolve: (rows: { hash: string }[]) => void) => resolve(stored.map((hash) => ({ hash }))),
  }

  const first = await deduplicateTransactions(db, "eval-user", bankAccountId, parsed.slice(0, b))
  stored.push(...first.newTransactions.map((t) => t.hash))
  const second = await deduplicateTransactions(db, "eval-user", bankAccountId, parsed.slice(a))

  return {
    firstKept: first.newCount === b,
    overlapRows: b - a,
    duplicatesFound: second.duplicateCount,
    newRows: parsed.length - b,
    newKept: second.newCount,
  }
}

async function main() {
  const corpusDir = argValue("--corpus", "eval/corpus/e1")
  const seed = Number(argValue("--seed", "42"))
  const corpus = loadCorpus(corpusDir)

  console.log(`Balance continuity check on ${corpus.length} ground-truth ledgers (seed ${seed})`)

  for (const anchored of [false, true]) {
    const results = Object.fromEntries(MODES.map((m) => [m, { trials: 0, detected: 0, localized: 0, missedFirstRow: 0 }]))
    let cleanFalsePositives = 0

    corpus.forEach((entry, i) => {
      const rows = entry.groundTruth.transactions.map(toRow)
      const opening = anchored ? entry.groundTruth.opening_balance : undefined
      if (!validateBalanceContinuity(rows, opening).valid) cleanFalsePositives++

      MODES.forEach((mode, m) => {
        const { rows: bad, index } = perturb(rows, mode, seededRandom(seed + i * MODES.length + m))
        const check = validateBalanceContinuity(bad, opening)
        const r = results[mode]!
        r.trials++
        if (!check.valid) {
          r.detected++
          if (check.errors.some((e) => Math.abs(e.index - index) <= 1)) r.localized++
        } else if (index === 0) {
          r.missedFirstRow++
        }
      })
    })

    console.log(`\n${anchored ? "Anchored to opening balance" : "Unanchored"} — clean ledgers flagged (false positives): ${cleanFalsePositives}/${corpus.length}`)
    console.log("Fault       Trials  Detected            Localized (±1)      Misses on row 0")
    let trials = 0, detected = 0, localized = 0
    for (const mode of MODES) {
      const r = results[mode]!
      trials += r.trials; detected += r.detected; localized += r.localized
      console.log(`${mode.padEnd(10)}  ${String(r.trials).padStart(6)}  ${`${pct(r.detected, r.trials)} (${r.detected})`.padEnd(18)}  ${`${pct(r.localized, r.trials)} (${r.localized})`.padEnd(18)}  ${r.missedFirstRow}`)
    }
    console.log(`${"overall".padEnd(10)}  ${String(trials).padStart(6)}  ${`${pct(detected, trials)} (${detected})`.padEnd(18)}  ${pct(localized, trials)} (${localized})`)
  }

  let overlap = 0, found = 0, fresh = 0, kept = 0, firstOk = 0
  for (const entry of corpus) {
    const d = await dedupOverlap(entry.groundTruth.transactions, `acct-${entry.id}`)
    overlap += d.overlapRows; found += d.duplicatesFound; fresh += d.newRows; kept += d.newKept
    if (d.firstKept) firstOk++
  }
  console.log(`\nOverlapping re-upload deduplication (${corpus.length} statements)`)
  console.log(`  First upload kept every row:     ${firstOk}/${corpus.length}`)
  console.log(`  Overlap rows flagged duplicate:  ${found}/${overlap} (${pct(found, overlap)})`)
  console.log(`  Non-overlap rows kept as new:    ${kept}/${fresh} (${pct(kept, fresh)})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
