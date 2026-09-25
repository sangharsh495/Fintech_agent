#!/usr/bin/env python3
"""
Comprehensive E2/E3/E4 Evaluation Harness for FinFlow Bank Statement Parsing

Evaluates:
  1. E2: Deterministic Profile-Based Parser Accuracy across all 120 statements (8 Indian Banks)
  2. E3: Balance Continuity Invariant Verification
  3. E4: Controlled Perturbation Robustness & Sensitivity Invariant Testing
        (Omission, Phantom Insertion, Character/Amount Tampering)
"""

import os
import json
import csv
import re
import copy
from datetime import datetime
from collections import defaultdict
import perturbation

CORPUS_DIR = os.path.dirname(os.path.abspath(__file__))
MANIFEST_PATH = os.path.join(CORPUS_DIR, "manifest.csv")
EXTRACTED_LINES_PATH = os.path.join(CORPUS_DIR, "extracted_pdf_lines.json")
RESULTS_PATH = os.path.join(CORPUS_DIR, "results_evaluation.json")

AMOUNT_EPSILON = 0.05
BALANCE_EPSILON = 0.05

DATE_PATTERNS = [
    (r"^\d{2}/\d{2}/\d{2,4}", "%d/%m/%Y", "%d/%m/%y"),
    (r"^\d{2}-\d{2}-\d{4}", "%d-%m-%Y"),
    (r"^\d{2}\s+[A-Za-z]{3}\s+\d{4}", "%d %b %Y"),
    (r"^\d{4}-\d{2}-\d{2}", "%Y-%m-%d"),
]

def parse_date(date_str):
    date_str = date_str.strip()
    for pat, *fmts in DATE_PATTERNS:
        m = re.match(pat, date_str)
        if m:
            matched_txt = m.group(0)
            for fmt in fmts:
                try:
                    return datetime.strptime(matched_txt, fmt).strftime("%Y-%m-%d"), matched_txt
                except ValueError:
                    pass
    return None, None

def detect_bank_from_text(lines):
    full_text = " ".join(lines[:10]).lower()
    if "hdfc" in full_text:
        return "HDFC"
    if "state bank of india" in full_text or "sbi" in full_text:
        return "SBI"
    if "icici" in full_text:
        return "ICICI"
    if "axis" in full_text:
        return "AXIS"
    if "kotak" in full_text:
        return "KOTAK"
    if "punjab national" in full_text or "pnb" in full_text:
        return "PNB"
    if "bank of baroda" in full_text or "bob" in full_text:
        return "BOB"
    if "yes bank" in full_text:
        return "YES"
    return None

def parse_line_transaction(line, bank_id):
    """
    Deterministic rule-based line parser matching FinFlow's production parser.
    """
    iso_date, date_match_txt = parse_date(line)
    if not iso_date:
        return None

    rest = line[len(date_match_txt):].strip()

    # Suffix style (SBI, KOTAK, BOB): e.g. "Amount Dr/Cr Balance"
    # Find all numeric patterns with possible Dr/Cr
    # e.g. "349.00 Dr 106,282.81"
    suffix_match = re.search(r"([\d,]+\.\d{2})\s+(Dr|Cr)\s+([\d,]+\.\d{2})", rest, re.IGNORECASE)
    if suffix_match:
        amt_str, dr_cr, bal_str = suffix_match.groups()
        amt = float(amt_str.replace(",", ""))
        bal = float(bal_str.replace(",", ""))
        is_debit = dr_cr.lower() == "dr"
        desc = rest[:suffix_match.start()].strip()
        return {
            "date": iso_date,
            "narration": desc,
            "debit": amt if is_debit else 0.0,
            "credit": 0.0 if is_debit else amt,
            "balance": bal,
            "type": "debit" if is_debit else "credit"
        }

    # Two columns of amounts + balance or debit/credit separated
    # Look for numbers at the tail:
    # Pattern: [Amt1] [Amt2 optional] [Balance]
    numbers = re.findall(r"[\d,]+\.\d{2}", rest)
    if len(numbers) >= 2:
        bal = float(numbers[-1].replace(",", ""))
        amt = float(numbers[-2].replace(",", ""))

        # Check if there is another number before (e.g. both debit and credit present)
        # Or determine debit vs credit based on column context / keywords
        desc_part = rest
        for n in numbers:
            desc_part = desc_part.replace(n, "")
        desc = desc_part.strip()

        # Let's inspect value date if present
        is_credit = bool(re.search(r"\b(credit|deposit|salary|received|cr|refund)\b", desc, re.IGNORECASE))
        is_debit = bool(re.search(r"\b(debit|withdrawal|payment|upi|pos|atm|imps|neft|dr)\b", desc, re.IGNORECASE))

        # Default heuristic based on bank profile:
        # In separate_dr_cr columns, if single amount is before balance:
        # Check if the number position aligns with debit vs credit
        debit = amt if not is_credit else 0.0
        credit = amt if is_credit else 0.0

        return {
            "date": iso_date,
            "narration": desc,
            "debit": debit,
            "credit": credit,
            "balance": bal,
            "type": "credit" if is_credit else "debit"
        }

    return None

def validate_balance_continuity(txns):
    """
    Checks FinFlow's balance continuity invariant:
    B_i = B_{i-1} + C_i - D_i
    """
    errors = []
    if len(txns) < 2:
        return {"valid": True, "errors": []}

    for i in range(1, len(txns)):
        prev = txns[i - 1]
        curr = txns[i]
        if prev.get("balance") is not None and curr.get("balance") is not None:
            delta = (curr.get("credit") or 0.0) - (curr.get("debit") or 0.0)
            expected = round(prev["balance"] + delta, 2)
            actual = round(curr["balance"], 2)
            if abs(expected - actual) > BALANCE_EPSILON:
                errors.append({
                    "index": i,
                    "expected": expected,
                    "actual": actual,
                    "delta": delta,
                    "discrepancy": round(actual - expected, 2)
                })

    return {"valid": len(errors) == 0, "errors": errors}

def match_transactions(gt_txns, ext_txns):
    gt_used = set()
    tp = 0

    for ei, e in enumerate(ext_txns):
        e_debit = e.get("debit") or 0.0
        e_credit = e.get("credit") or 0.0
        best_gt_idx = -1
        best_diff = float("inf")

        for gi, g in enumerate(gt_txns):
            if gi in gt_used:
                continue
            if e["date"] != g["date"]:
                continue

            # Amount matching
            d_diff = abs(e_debit - g["debit"])
            c_diff = abs(e_credit - g["credit"])

            if d_diff <= AMOUNT_EPSILON and c_diff <= AMOUNT_EPSILON:
                bal_diff = abs(e["balance"] - g["balance"]) if e.get("balance") is not None else 0.0
                if bal_diff < best_diff:
                    best_diff = bal_diff
                    best_gt_idx = gi

        if best_gt_idx >= 0:
            gt_used.add(best_gt_idx)
            tp += 1

    fp = len(ext_txns) - tp
    fn = len(gt_txns) - tp
    return tp, fp, fn

def compute_f1(p, r):
    if p + r == 0:
        return 0.0
    return round((2 * p * r) / (p + r), 4)

def run_evaluation():
    print("=" * 75)
    print("  FINFLOW COMPREHENSIVE EXPERIMENT SUITE (E2, E3, E4)")
    print("=" * 75)

    with open(MANIFEST_PATH, "r") as f:
        rows = list(csv.DictReader(f))

    with open(EXTRACTED_LINES_PATH, "r") as f:
        extracted_data = json.load(f)

    # ─────────────────────────────────────────────────────────────
    # EXPERIMENT E2 & E3: Deterministic Parsing & Invariant Pass Rate
    # ─────────────────────────────────────────────────────────────
    bank_stats = defaultdict(lambda: {
        "stmts": 0, "gt_txns": 0, "ext_txns": 0, "tp": 0, "fp": 0, "fn": 0,
        "continuity_passes": 0, "detected_correct": 0
    })

    per_statement_results = []

    for row in rows:
        stmt_id = row["statement_id"]
        bank = row["bank"]
        gt_path = os.path.join(CORPUS_DIR, row["ground_truth_path"])

        with open(gt_path, "r") as f:
            gt = json.load(f)

        stmt_lines = extracted_data[stmt_id]["lines"]
        detected_bank = detect_bank_from_text(stmt_lines)
        if detected_bank == bank:
            bank_stats[bank]["detected_correct"] += 1

        # Extract transactions using deterministic parser
        ext_txns = []
        for line in stmt_lines:
            t = parse_line_transaction(line, bank)
            if t:
                ext_txns.append(t)

        tp, fp, fn = match_transactions(gt["transactions"], ext_txns)

        # Invariant verification
        cont_res = validate_balance_continuity(ext_txns)
        if cont_res["valid"]:
            bank_stats[bank]["continuity_passes"] += 1

        bank_stats[bank]["stmts"] += 1
        bank_stats[bank]["gt_txns"] += len(gt["transactions"])
        bank_stats[bank]["ext_txns"] += len(ext_txns)
        bank_stats[bank]["tp"] += tp
        bank_stats[bank]["fp"] += fp
        bank_stats[bank]["fn"] += fn

        prec = round(tp / len(ext_txns), 4) if ext_txns else 0.0
        rec = round(tp / len(gt["transactions"]), 4) if gt["transactions"] else 0.0
        f1 = compute_f1(prec, rec)

        per_statement_results.append({
            "statement_id": stmt_id,
            "bank": bank,
            "gt_count": len(gt["transactions"]),
            "extracted_count": len(ext_txns),
            "tp": tp, "fp": fp, "fn": fn,
            "precision": prec,
            "recall": rec,
            "f1": f1,
            "continuity_valid": cont_res["valid"],
            "continuity_errors": len(cont_res["errors"]),
        })

    # Aggregate E2 metrics
    total_stmts = len(rows)
    total_gt = sum(b["gt_txns"] for b in bank_stats.values())
    total_ext = sum(b["ext_txns"] for b in bank_stats.values())
    total_tp = sum(b["tp"] for b in bank_stats.values())
    total_fp = sum(b["fp"] for b in bank_stats.values())
    total_fn = sum(b["fn"] for b in bank_stats.values())
    total_cont_pass = sum(b["continuity_passes"] for b in bank_stats.values())
    total_det_correct = sum(b["detected_correct"] for b in bank_stats.values())

    micro_prec = round(total_tp / total_ext, 4) if total_ext else 0.0
    micro_rec = round(total_tp / total_gt, 4) if total_gt else 0.0
    micro_f1 = compute_f1(micro_prec, micro_rec)
    cont_pass_rate = round(total_cont_pass / total_stmts, 4)
    bank_det_acc = round(total_det_correct / total_stmts, 4)

    print("\n--- EXPERIMENT E2: DETERMINISTIC REGEX PARSER BENCHMARK ---")
    print(f"Total Statements: {total_stmts} (across {len(bank_stats)} banks)")
    print(f"Total Ground-Truth Transactions: {total_gt}")
    print(f"Total Extracted Transactions:    {total_ext}")
    print(f"Micro Precision:                 {micro_prec:.4f}")
    print(f"Micro Recall:                    {micro_rec:.4f}")
    print(f"Micro F1-Score:                  {micro_f1:.4f}")
    print(f"Bank Fingerprint Accuracy:       {bank_det_acc:.4f} ({total_det_correct}/{total_stmts})")
    print(f"Clean Continuity Pass Rate:      {cont_pass_rate:.4f} ({total_cont_pass}/{total_stmts})")

    print("\nPer-Bank Breakdown:")
    print("-" * 72)
    print("  Bank   | Stmts | Prec   | Recall | F1     | Cont%  | TP    | FP  | FN")
    print("-" * 72)
    bank_summary_list = []
    for bank in sorted(bank_stats.keys()):
        b = bank_stats[bank]
        p = round(b["tp"] / b["ext_txns"], 4) if b["ext_txns"] else 0.0
        r = round(b["tp"] / b["gt_txns"], 4) if b["gt_txns"] else 0.0
        f = compute_f1(p, r)
        cp = round(b["continuity_passes"] / b["stmts"], 4)
        print(f"  {bank:<6} | {b['stmts']:<5} | {p:.4f} | {r:.4f} | {f:.4f} | {cp:.4f} | {b['tp']:<5} | {b['fp']:<3} | {b['fn']:<3}")
        bank_summary_list.append({
            "bank": bank,
            "statements": b["stmts"],
            "precision": p,
            "recall": r,
            "f1": f,
            "continuity_pass_rate": cp,
            "tp": b["tp"], "fp": b["fp"], "fn": b["fn"]
        })
    print("-" * 72)

    # ─────────────────────────────────────────────────────────────
    # EXPERIMENT E4: Invariant Violation Detection under Controlled Perturbations
    # ─────────────────────────────────────────────────────────────
    print("\n--- EXPERIMENT E4: BALANCE CONTINUITY INVARIANT PERTURBATION ANALYSIS ---")
    print("Testing invariant sensitivity and localization across 3 canonical error modes:")
    print("  1. Transaction Omission (parser dropped line)")
    print("  2. Phantom Insertion (hallucinated / duplicate line)")
    print("  3. Character/Amount Tampering (OCR/transposition error)")

    modes = ["omission", "insertion", "amount_tamper"]
    perturbation_results = {}

    for mode in modes:
        detected_count = 0
        localized_exact_count = 0
        total_trials = 0

        for row in rows:
            gt_path = os.path.join(CORPUS_DIR, row["ground_truth_path"])
            with open(gt_path, "r") as f:
                gt = json.load(f)

            txns = gt["transactions"]
            if len(txns) < 5:
                continue

            total_trials += 1
            seed = 42 + total_trials

            if mode == "omission":
                perturbed_txns, meta = perturbation.omit_transaction(txns, seed=seed)
                target_idx = meta["index"]
            elif mode == "insertion":
                perturbed_txns, meta = perturbation.insert_fake_transaction(txns, seed=seed)
                target_idx = meta["index"]
            elif mode == "amount_tamper":
                perturbed_txns, meta = perturbation.tamper_amount(txns, seed=seed)
                target_idx = meta["index"]

            res = validate_balance_continuity(perturbed_txns)
            if not res["valid"]:
                detected_count += 1
                # Check if detected at or adjacent to the perturbed index
                error_indices = [e["index"] for e in res["errors"]]
                if any(abs(idx - target_idx) <= 1 for idx in error_indices):
                    localized_exact_count += 1

        det_rate = round(detected_count / total_trials, 4)
        loc_rate = round(localized_exact_count / total_trials, 4)

        perturbation_results[mode] = {
            "trials": total_trials,
            "detected": detected_count,
            "detection_sensitivity": det_rate,
            "exact_localized": localized_exact_count,
            "localization_accuracy": loc_rate,
        }

        print(f"  [{mode.upper():<14}] Trials: {total_trials} | Detection Sensitivity: {det_rate*100:.2f}% | Localization Acc: {loc_rate*100:.2f}%")

    # Clean False Positive Rate (Specificity)
    clean_fp = total_stmts - total_cont_pass
    clean_fpr = round(clean_fp / total_stmts, 4)
    specificity = round(1.0 - clean_fpr, 4)
    print(f"  [CLEAN SPECIFICITY] Invariant Specificity: {specificity*100:.2f}% (FPR: {clean_fpr*100:.2f}%)")

    # Write output
    output_data = {
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "corpus": "finflow_e1_corpus",
            "total_statements": total_stmts,
            "banks_evaluated": len(bank_stats),
        },
        "e2_deterministic_parser": {
            "micro_precision": micro_prec,
            "micro_recall": micro_rec,
            "micro_f1": micro_f1,
            "bank_detection_accuracy": bank_det_acc,
            "per_bank": bank_summary_list,
        },
        "e3_continuity_verification": {
            "clean_continuity_pass_rate": cont_pass_rate,
            "clean_fpr": clean_fpr,
            "clean_specificity": specificity,
        },
        "e4_perturbation_analysis": perturbation_results,
    }

    with open(RESULTS_PATH, "w") as f:
        json.dump(output_data, f, indent=2)

    print(f"\nSaved empirical results to: {RESULTS_PATH}\n")
    print("=" * 75)

if __name__ == "__main__":
    run_evaluation()
