#!/usr/bin/env node
/**
 * E2/E3 Evaluation Harness — Deterministic Parser
 *
 * Runs FinFlow's production deterministic parser on all 120 statements
 * in the E1 corpus, comparing against ground-truth JSON annotations.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import FinFlow production parsing components
import { detectBank, getBankProfile, GENERIC_PROFILE } from "../server/services/parser/bank-profiles.ts";
import { parseLinesAsTransactions } from "../server/services/parser/pdf.table.ts";
import { validateBalanceContinuity } from "../lib/parser/validateContinuity.ts";

const AMOUNT_EPSILON = 0.05;
const BALANCE_EPSILON = 0.05;

function normDate(d) {
  if (!d) return "";
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    let year = slashMatch[3];
    if (year.length === 2) year = (parseInt(year) > 50 ? "19" : "20") + year;
    return `${year}-${month}-${day}`;
  }

  const monMatch = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (monMatch) {
    const months = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const day = monMatch[1].padStart(2, "0");
    const month = months[monMatch[2].toLowerCase()] || "01";
    return `${monMatch[3]}-${month}-${day}`;
  }

  try {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
  } catch {}
  return s;
}

function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",").map(p => p.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = parts[idx];
    });
    rows.push(row);
  }
  return rows;
}

function matchTransactions(gt, extracted) {
  const gtUsed = new Set();
  const matches = [];
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

      const dateMatch = normDate(e.date) === normDate(g.date);
      if (!dateMatch) continue;

      const debitDiff = Math.abs(eDebit - g.debit);
      const creditDiff = Math.abs(eCredit - g.credit);
      if (debitDiff > AMOUNT_EPSILON || creditDiff > AMOUNT_EPSILON) continue;

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
        gtIndex: bestGtIdx,
        extractedIndex: ei,
      });
    }
  }

  const fp = extracted.length - tp;
  const fn = gt.length - tp;
  return { tp, fp, fn, matches };
}

function f1Score(p, r) {
  if (p + r === 0) return 0;
  return (2 * p * r) / (p + r);
}

async function main() {
  const corpusDir = path.resolve(__dirname);
  const manifestPath = path.join(corpusDir, "manifest.csv");
  const extractedLinesPath = path.join(corpusDir, "extracted_pdf_lines.json");
  const outputPath = path.join(corpusDir, "results_deterministic.json");

  console.log(`\n======================================================================`);
  console.log(`  E2/E3 Evaluation Harness — FinFlow Deterministic Parser`);
  console.log(`  Corpus Dir: ${corpusDir}`);
  console.log(`======================================================================\n`);

  if (!fs.existsSync(extractedLinesPath)) {
    console.error(`Error: ${extractedLinesPath} not found. Run extract_pdf_lines.py first.`);
    process.exit(1);
  }

  const extractedLinesData = JSON.parse(fs.readFileSync(extractedLinesPath, "utf-8"));
  const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
  const rows = parseCSV(manifestRaw);

  const results = [];
  const bankAgg = {};

  let bankDetectionCorrect = 0;
  let zeroExtractions = 0;

  for (const row of rows) {
    const stmtId = row.statement_id;
    const gtPath = path.join(corpusDir, row.ground_truth_path);

    if (!fs.existsSync(gtPath)) {
      console.warn(`Missing GT for ${stmtId}`);
      continue;
    }

    const gt = JSON.parse(fs.readFileSync(gtPath, "utf-8"));
    const stmtLinesObj = extractedLinesData[stmtId];
    const lines = stmtLinesObj ? stmtLinesObj.lines : [];

    // Bank detection test using statement text
    const fullText = lines.slice(0, 15).join(" ");
    const detected = detectBank(fullText);
    const bankMatches = detected && detected.id.toLowerCase() === row.bank.toLowerCase();
    if (bankMatches) bankDetectionCorrect++;

    // Parse transactions
    const activeProfile = detected || getBankProfile(row.bank.toLowerCase()) || GENERIC_PROFILE;
    const extractedRaw = parseLinesAsTransactions(lines, activeProfile);

    if (extractedRaw.length === 0) {
      zeroExtractions++;
    }

    // Format transactions
    const extracted = extractedRaw.map(t => ({
      date: t.date instanceof Date ? t.date.toISOString().split("T")[0] : String(t.date),
      description: t.description || "",
      debit: t.type === "debit" ? t.amount : 0,
      credit: t.type === "credit" ? t.amount : 0,
      balance: t.balance != null ? t.balance : null,
    }));

    const { tp, fp, fn } = matchTransactions(gt.transactions, extracted);
    const precision = extracted.length > 0 ? tp / extracted.length : 0;
    const recall = gt.transactions.length > 0 ? tp / gt.transactions.length : 0;
    const f1 = f1Score(precision, recall);

    // Continuity verification
    const continuityRes = validateBalanceContinuity(extractedRaw);

    const stmtRes = {
      statement_id: stmtId,
      bank: row.bank,
      gt_count: gt.transactions.length,
      extracted_count: extracted.length,
      tp, fp, fn,
      precision, recall, f1,
      continuity_valid: continuityRes.valid,
      continuity_errors: continuityRes.errors.length,
      bank_detected: detected ? detected.id : null,
    };

    results.push(stmtRes);

    if (!bankAgg[row.bank]) {
      bankAgg[row.bank] = {
        bank: row.bank,
        statements: 0,
        gt_txns: 0,
        ext_txns: 0,
        tp: 0, fp: 0, fn: 0,
        continuity_passes: 0,
        extraction_ratios: [],
      };
    }

    const b = bankAgg[row.bank];
    b.statements++;
    b.gt_txns += gt.transactions.length;
    b.ext_txns += extracted.length;
    b.tp += tp;
    b.fp += fp;
    b.fn += fn;
    if (continuityRes.valid) b.continuity_passes++;
    b.extraction_ratios.push(gt.transactions.length > 0 ? extracted.length / gt.transactions.length : 0);
  }

  // Summary per bank
  const bankSummaries = Object.values(bankAgg).map(b => {
    const precision = b.ext_txns > 0 ? b.tp / b.ext_txns : 0;
    const recall = b.gt_txns > 0 ? b.tp / b.gt_txns : 0;
    const f1 = f1Score(precision, recall);
    const continuity_pass_rate = b.statements > 0 ? b.continuity_passes / b.statements : 0;
    const mean_extraction_ratio = b.extraction_ratios.reduce((a, c) => a + c, 0) / b.extraction_ratios.length;

    return {
      bank: b.bank,
      statements: b.statements,
      total_gt_txns: b.gt_txns,
      total_extracted_txns: b.ext_txns,
      total_tp: b.tp,
      total_fp: b.fp,
      total_fn: b.fn,
      precision: Math.round(precision * 10000) / 10000,
      recall: Math.round(recall * 10000) / 10000,
      f1: Math.round(f1 * 10000) / 10000,
      continuity_pass_rate: Math.round(continuity_pass_rate * 10000) / 10000,
      mean_extraction_ratio: Math.round(mean_extraction_ratio * 10000) / 10000,
    };
  });

  const totalGt = bankSummaries.reduce((a, b) => a + b.total_gt_txns, 0);
  const totalExt = bankSummaries.reduce((a, b) => a + b.total_extracted_txns, 0);
  const totalTp = bankSummaries.reduce((a, b) => a + b.total_tp, 0);
  const totalFp = bankSummaries.reduce((a, b) => a + b.total_fp, 0);
  const totalFn = bankSummaries.reduce((a, b) => a + b.total_fn, 0);

  const microPrecision = totalExt > 0 ? totalTp / totalExt : 0;
  const microRecall = totalGt > 0 ? totalTp / totalGt : 0;
  const microF1 = f1Score(microPrecision, microRecall);
  const totalContinuityPasses = results.filter(r => r.continuity_valid).length;
  const continuityPassRate = results.length > 0 ? totalContinuityPasses / results.length : 0;

  const overall = {
    total_statements: results.length,
    total_gt_transactions: totalGt,
    total_extracted_transactions: totalExt,
    total_true_positives: totalTp,
    total_false_positives: totalFp,
    total_false_negatives: totalFn,
    micro_precision: Math.round(microPrecision * 10000) / 10000,
    micro_recall: Math.round(microRecall * 10000) / 10000,
    micro_f1: Math.round(microF1 * 10000) / 10000,
    continuity_pass_rate: Math.round(continuityPassRate * 10000) / 10000,
    zero_extraction_count: zeroExtractions,
    bank_detection_accuracy: Math.round((bankDetectionCorrect / results.length) * 10000) / 10000,
  };

  console.log("═".repeat(70));
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
  console.log(`\n  Results written to: ${outputPath}\n`);
}

main().catch(err => {
  console.error("Evaluation error:", err);
  process.exit(1);
});
