#!/usr/bin/env npx tsx
/**
 * E2/E3 Evaluation Harness — Deterministic Parser
 *
 * Runs FinFlow's deterministic bank-profile parser (pdf.table.ts) on
 * every synthetic PDF in the E1 corpus, compares the extracted
 * transactions against the ground-truth JSON, and reports:
 *
 *   1. Per-bank extraction accuracy (precision, recall, F1)
 *   2. Balance-continuity invariant pass rate
 *   3. Aggregate statistics across all banks
 *   4. Per-statement error details (for failure analysis)
 *
 * Usage:
 *   npx tsx finflow_e1_corpus/evaluate_deterministic.ts \
 *       --corpus ./finflow_e1_corpus \
 *       --out ./finflow_e1_corpus/results_deterministic.json
 *
 * The script reads PDFs using pdf.js-extract (same lib FinFlow uses
 * in production), pipes the raw text through the deterministic parser,
 * and scores each statement against ground truth.
 */

import * as fs from "fs";
import * as path from "path";
import { parse as csvParse } from "csv-parse/sync";

// ── FinFlow production imports ──────────────────────────────────
import { detectBank, getBankProfile, GENERIC_PROFILE } from "../server/services/parser/bank-profiles";
import { parseLinesAsTransactions } from "../server/services/parser/pdf.table";
import { validateBalanceContinuity } from "../lib/parser/validateContinuity";

// For PDF text extraction we use pdf.js-extract (same as production)
import { PDFExtract } from "pdf.js-extract";
const pdfExtract = new PDFExtract();

// ── Types ───────────────────────────────────────────────────────

interface GroundTruthTx {
  date: string;
  narration: string;
  ref: string;
  debit: number;
  credit: number;
  balance: number;
  type: "debit" | "credit";
}

interface GroundTruth {
  statement_id: string;
  bank: string;
  bank_display_name: string;
  account_holder: string;
  account_number: string;
  ifsc: string;
  opening_balance: number;
  closing_balance: number;
  transaction_count: number;
  transactions: GroundTruthTx[];
}

interface ManifestRow {
  statement_id: string;
  bank: string;
  pdf_path: string;
  ground_truth_path: string;
  transaction_count: string;
  opening_balance: string;
  closing_balance: string;
  amount_style: string;
}

interface TxMatch {
  matched: boolean;
  dateMatch: boolean;
  amountMatch: boolean;
  balanceMatch: boolean;
  gtIndex: number;
  extractedIndex: number;
}

interface StatementResult {
  statement_id: string;
  bank: string;
  gt_count: number;
  extracted_count: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  f1: number;
  continuity_valid: boolean;
  continuity_errors: number;
  bank_detected: string | null;
  errors: string[];
}

interface BankAggregate {
  bank: string;
  statements: number;
  total_gt_txns: number;
  total_extracted_txns: number;
  total_tp: number;
  total_fp: number;
  total_fn: number;
  precision: number;
  recall: number;
  f1: number;
  continuity_pass_rate: number;
  mean_extraction_ratio: number;
}

// ── Matching Logic ──────────────────────────────────────────────

const AMOUNT_EPSILON = 0.02;  // allow 2 paisa rounding tolerance
const BALANCE_EPSILON = 0.02;

/**
 * Match extracted transactions to ground truth using a greedy
 * date+amount matching strategy. A match requires:
 *   1. Same date (or ±1 day for date format parsing edge cases)
 *   2. Debit/credit amounts within AMOUNT_EPSILON
 *   3. (Optionally) balance within BALANCE_EPSILON
 */
function matchTransactions(
  gt: GroundTruthTx[],
  extracted: Array<{ date: string; debit: number | null; credit: number | null; balance: number | null; description?: string }>
): { tp: number; fp: number; fn: number; matches: TxMatch[] } {
  const gtUsed = new Set<number>();
  const matches: TxMatch[] = [];
  let tp = 0;

  for (let ei = 0; ei < extracted.length; ei++) {
    const e = extracted[ei];
    const eDebit = e.debit ?? 0;
    const eCredit = e.credit ?? 0;
    let bestGtIdx = -1;
    let bestScore = Infinity;

    for (let gi = 0; gi < gt.length; gi++) {
      if (gtUsed.has(gi)) continue;
      const g = gt[gi];

      // Date matching: normalize both to YYYY-MM-DD and compare
      const dateMatch = normDate(e.date) === normDate(g.date);
      if (!dateMatch) continue;

      // Amount matching
      const debitDiff = Math.abs(eDebit - g.debit);
      const creditDiff = Math.abs(eCredit - g.credit);
      if (debitDiff > AMOUNT_EPSILON || creditDiff > AMOUNT_EPSILON) continue;

      // Score by balance closeness (prefer exact balance matches)
      const balDiff = e.balance != null ? Math.abs(e.balance - g.balance) : 999;
      if (balDiff < bestScore) {
        bestScore = balDiff;
        bestGtIdx = gi;
      }
    }

    if (bestGtIdx >= 0) {
      gtUsed.add(bestGtIdx);
      tp++;
      matches.push({
        matched: true,
        dateMatch: true,
        amountMatch: true,
        balanceMatch: bestScore <= BALANCE_EPSILON,
        gtIndex: bestGtIdx,
        extractedIndex: ei,
      });
    }
  }

  const fp = extracted.length - tp;
  const fn = gt.length - tp;
  return { tp, fp, fn, matches };
}

function normDate(d: string): string {
  if (!d) return "";
  // Try various formats and normalize to YYYY-MM-DD
  // Handle: DD/MM/YY, DD/MM/YYYY, DD-MM-YYYY, DD Mon YYYY, YYYY-MM-DD
  const s = d.trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YY or DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    let year = slashMatch[3];
    if (year.length === 2) year = (parseInt(year) > 50 ? "19" : "20") + year;
    return `${year}-${month}-${day}`;
  }

  // DD Mon YYYY (e.g., "02 Jan 2025")
  const monMatch = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (monMatch) {
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const day = monMatch[1].padStart(2, "0");
    const month = months[monMatch[2].toLowerCase()] || "01";
    return `${monMatch[3]}-${month}-${day}`;
  }

  return s; // fallback
}

function f1Score(p: number, r: number): number {
  if (p + r === 0) return 0;
  return (2 * p * r) / (p + r);
}

// ── PDF Text Extraction ─────────────────────────────────────────

async function extractTextFromPdf(pdfPath: string): Promise<string> {
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfExtract.extractBuffer(buffer);
  const lines: string[] = [];
  for (const page of data.pages) {
    // Sort items by y position (descending since PDF y=0 is bottom)
    // then by x position
    const sorted = [...page.content].sort((a, b) => {
      const yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 2) return yDiff;
      return a.x - b.x;
    });

    let currentLine = "";
    let lastY = -999;
    for (const item of sorted) {
      if (Math.abs(item.y - lastY) > 3) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = "";
      }
      currentLine += item.str + " ";
      lastY = item.y;
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
  }
  return lines.join("\n");
}

// ── Main Evaluation Loop ────────────────────────────────────────

async function evaluate(corpusDir: string, outputPath: string) {
  const manifestPath = path.join(corpusDir, "manifest.csv");
  const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
  const rows: ManifestRow[] = csvParse(manifestRaw, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`\n📊 E2/E3 Evaluation Harness — Deterministic Parser`);
  console.log(`   Corpus: ${corpusDir}`);
  console.log(`   Statements: ${rows.length}\n`);

  const results: StatementResult[] = [];
  const bankAgg: Record<string, {
    stmts: number; gtTxns: number; extTxns: number;
    tp: number; fp: number; fn: number;
    contPass: number; extRatios: number[];
  }> = {};

  for (const row of rows) {
    const pdfPath = path.join(corpusDir, row.pdf_path);
    const gtPath = path.join(corpusDir, row.ground_truth_path);

    if (!fs.existsSync(pdfPath)) {
      console.error(`  ⚠️  Missing PDF: ${pdfPath}`);
      continue;
    }
    if (!fs.existsSync(gtPath)) {
      console.error(`  ⚠️  Missing ground truth: ${gtPath}`);
      continue;
    }

    const gt: GroundTruth = JSON.parse(fs.readFileSync(gtPath, "utf-8"));
    const errors: string[] = [];

    try {
      // Step 1: Extract raw text from PDF
      const rawText = await extractTextFromPdf(pdfPath);
      const lines = rawText.split(/\r?\n/);

      // Step 2: Detect bank from text (tests bank fingerprinting)
      const detectedProfile = detectBank(rawText);

      // Step 3: Run deterministic parser
      const activeProfile = detectedProfile || GENERIC_PROFILE;
      const extractedRaw = parseLinesAsTransactions(lines, activeProfile);

      // Step 4: Normalize extracted transactions
      const extracted = extractedRaw.map((t: any) => ({
        date: t.date instanceof Date ? t.date.toISOString().split("T")[0] : String(t.date),
        description: t.description || t.narration || "",
        debit: t.type === "debit" ? t.amount : (t.debit ?? 0),
        credit: t.type === "credit" ? t.amount : (t.credit ?? 0),
        balance: t.balance ?? null,
      }));

      // Step 5: Match against ground truth
      const { tp, fp, fn } = matchTransactions(gt.transactions, extracted);
      const precision = extracted.length > 0 ? tp / extracted.length : 0;
      const recall = gt.transactions.length > 0 ? tp / gt.transactions.length : 0;
      const f1 = f1Score(precision, recall);

      // Step 6: Check balance continuity on extracted transactions
      const continuityInput = extracted.map((e: any) => ({
        date: e.date,
        description: e.description,
        debit: e.debit || null,
        credit: e.credit || null,
        balance: e.balance,
      }));
      const continuity = validateBalanceContinuity(continuityInput);

      if (!detectedProfile) {
        errors.push(`Bank not detected (expected: ${gt.bank})`);
      } else if (detectedProfile.bankName?.toUpperCase() !== gt.bank &&
                 detectedProfile.bankId?.toUpperCase() !== gt.bank) {
        errors.push(`Bank mismatch: detected ${detectedProfile.bankName || detectedProfile.bankId}, expected ${gt.bank}`);
      }

      if (extracted.length === 0) {
        errors.push("Zero transactions extracted");
      }

      const result: StatementResult = {
        statement_id: row.statement_id,
        bank: row.bank,
        gt_count: gt.transaction_count,
        extracted_count: extracted.length,
        true_positives: tp,
        false_positives: fp,
        false_negatives: fn,
        precision: Math.round(precision * 10000) / 10000,
        recall: Math.round(recall * 10000) / 10000,
        f1: Math.round(f1 * 10000) / 10000,
        continuity_valid: continuity.valid,
        continuity_errors: continuity.errors.length,
        bank_detected: detectedProfile?.bankName || detectedProfile?.bankId || null,
        errors,
      };

      results.push(result);

      // Aggregate per bank
      if (!bankAgg[row.bank]) {
        bankAgg[row.bank] = { stmts: 0, gtTxns: 0, extTxns: 0, tp: 0, fp: 0, fn: 0, contPass: 0, extRatios: [] };
      }
      const agg = bankAgg[row.bank];
      agg.stmts++;
      agg.gtTxns += gt.transaction_count;
      agg.extTxns += extracted.length;
      agg.tp += tp;
      agg.fp += fp;
      agg.fn += fn;
      if (continuity.valid) agg.contPass++;
      if (gt.transaction_count > 0) agg.extRatios.push(extracted.length / gt.transaction_count);

      // Progress indicator
      const statusEmoji = f1 >= 0.9 ? "✅" : f1 >= 0.5 ? "⚠️" : "❌";
      console.log(`  ${statusEmoji} ${row.statement_id}: P=${result.precision} R=${result.recall} F1=${result.f1} | ext=${extracted.length}/${gt.transaction_count} | cont=${continuity.valid ? "PASS" : "FAIL"}`);

    } catch (err: any) {
      errors.push(`Runtime error: ${err.message}`);
      results.push({
        statement_id: row.statement_id,
        bank: row.bank,
        gt_count: gt.transaction_count,
        extracted_count: 0,
        true_positives: 0,
        false_positives: 0,
        false_negatives: gt.transaction_count,
        precision: 0,
        recall: 0,
        f1: 0,
        continuity_valid: false,
        continuity_errors: -1,
        bank_detected: null,
        errors,
      });
      console.log(`  ❌ ${row.statement_id}: ERROR - ${err.message}`);

      if (!bankAgg[row.bank]) {
        bankAgg[row.bank] = { stmts: 0, gtTxns: 0, extTxns: 0, tp: 0, fp: 0, fn: 0, contPass: 0, extRatios: [] };
      }
      bankAgg[row.bank].stmts++;
      bankAgg[row.bank].fn += gt.transaction_count;
      bankAgg[row.bank].gtTxns += gt.transaction_count;
    }
  }

  // ── Build Bank Summaries ────────────────────────────────────

  const bankSummaries: BankAggregate[] = Object.entries(bankAgg).map(([bank, a]) => {
    const precision = a.extTxns > 0 ? a.tp / (a.tp + a.fp) : 0;
    const recall = a.gtTxns > 0 ? a.tp / (a.tp + a.fn) : 0;
    return {
      bank,
      statements: a.stmts,
      total_gt_txns: a.gtTxns,
      total_extracted_txns: a.extTxns,
      total_tp: a.tp,
      total_fp: a.fp,
      total_fn: a.fn,
      precision: Math.round(precision * 10000) / 10000,
      recall: Math.round(recall * 10000) / 10000,
      f1: Math.round(f1Score(precision, recall) * 10000) / 10000,
      continuity_pass_rate: a.stmts > 0 ? Math.round((a.contPass / a.stmts) * 10000) / 10000 : 0,
      mean_extraction_ratio: a.extRatios.length > 0
        ? Math.round((a.extRatios.reduce((s, v) => s + v, 0) / a.extRatios.length) * 10000) / 10000
        : 0,
    };
  });

  // ── Overall Aggregates ──────────────────────────────────────

  const totalTP = results.reduce((s, r) => s + r.true_positives, 0);
  const totalFP = results.reduce((s, r) => s + r.false_positives, 0);
  const totalFN = results.reduce((s, r) => s + r.false_negatives, 0);
  const totalPrecision = (totalTP + totalFP) > 0 ? totalTP / (totalTP + totalFP) : 0;
  const totalRecall = (totalTP + totalFN) > 0 ? totalTP / (totalTP + totalFN) : 0;
  const totalF1 = f1Score(totalPrecision, totalRecall);
  const contPassCount = results.filter(r => r.continuity_valid).length;

  const overall = {
    total_statements: results.length,
    total_gt_transactions: results.reduce((s, r) => s + r.gt_count, 0),
    total_extracted_transactions: results.reduce((s, r) => s + r.extracted_count, 0),
    total_true_positives: totalTP,
    total_false_positives: totalFP,
    total_false_negatives: totalFN,
    micro_precision: Math.round(totalPrecision * 10000) / 10000,
    micro_recall: Math.round(totalRecall * 10000) / 10000,
    micro_f1: Math.round(totalF1 * 10000) / 10000,
    continuity_pass_rate: Math.round((contPassCount / results.length) * 10000) / 10000,
    zero_extraction_count: results.filter(r => r.extracted_count === 0).length,
    bank_detection_accuracy: Math.round(
      (results.filter(r => r.bank_detected !== null).length / results.length) * 10000
    ) / 10000,
  };

  // ── Report ──────────────────────────────────────────────────

  console.log("\n" + "═".repeat(70));
  console.log("  OVERALL RESULTS — Deterministic Parser");
  console.log("═".repeat(70));
  console.log(`  Statements evaluated:   ${overall.total_statements}`);
  console.log(`  Ground truth txns:      ${overall.total_gt_transactions}`);
  console.log(`  Extracted txns:         ${overall.total_extracted_transactions}`);
  console.log(`  True positives:         ${overall.total_true_positives}`);
  console.log(`  False positives:        ${overall.total_false_positives}`);
  console.log(`  False negatives:        ${overall.total_false_negatives}`);
  console.log(`  Micro Precision:        ${overall.micro_precision}`);
  console.log(`  Micro Recall:           ${overall.micro_recall}`);
  console.log(`  Micro F1:               ${overall.micro_f1}`);
  console.log(`  Continuity pass rate:   ${overall.continuity_pass_rate}`);
  console.log(`  Zero-extraction stmts:  ${overall.zero_extraction_count}`);
  console.log(`  Bank detection acc:     ${overall.bank_detection_accuracy}`);
  console.log("═".repeat(70));

  console.log("\n  PER-BANK BREAKDOWN:");
  console.log("  " + "-".repeat(68));
  console.log("  Bank     | Stmts | Prec   | Recall | F1     | Cont%  | ExtRatio");
  console.log("  " + "-".repeat(68));
  for (const b of bankSummaries.sort((a, b) => a.bank.localeCompare(b.bank))) {
    console.log(
      `  ${b.bank.padEnd(8)} | ${String(b.statements).padStart(5)} | ` +
      `${b.precision.toFixed(4)} | ${b.recall.toFixed(4)} | ${b.f1.toFixed(4)} | ` +
      `${b.continuity_pass_rate.toFixed(4)} | ${b.mean_extraction_ratio.toFixed(4)}`
    );
  }
  console.log("  " + "-".repeat(68));

  // ── Write JSON results ──────────────────────────────────────

  const output = {
    metadata: {
      timestamp: new Date().toISOString(),
      engine: "deterministic-regex",
      corpus_dir: corpusDir,
      total_statements: results.length,
    },
    overall,
    per_bank: bankSummaries,
    per_statement: results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n  📄 Full results written to: ${outputPath}\n`);
}

// ── CLI ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let corpusDir = "./finflow_e1_corpus";
let outputPath = "./finflow_e1_corpus/results_deterministic.json";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--corpus" && args[i + 1]) corpusDir = args[i + 1];
  if (args[i] === "--out" && args[i + 1]) outputPath = args[i + 1];
}

evaluate(corpusDir, outputPath).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
