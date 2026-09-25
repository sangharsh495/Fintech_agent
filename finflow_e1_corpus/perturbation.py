"""
Controlled perturbations for E4 (invariant violation detection).

Each function takes a clean, balance-consistent transaction list and
returns a perturbed copy where the balance-continuity invariant is
violated starting at a known index — plus metadata describing exactly
what was done, so you can measure whether the parser+invariant
combination catches it (and at the right row).

Not wired into the main corpus build yet — E1 is the clean corpus.
Import and call these when you get to E4.
"""

import copy
import random


def omit_transaction(txns: list, seed=None):
    """Drops one transaction but leaves downstream balances untouched,
    creating a detectable discontinuity at the following row."""
    if seed is not None:
        random.seed(seed)
    idx = random.randint(0, len(txns) - 2)
    out = copy.deepcopy(txns)
    removed = out.pop(idx)
    return out, {"perturbation": "omission", "index": idx, "removed": removed}


def insert_fake_transaction(txns: list, seed=None):
    """Inserts a plausible-looking transaction without adjusting
    subsequent balances, creating a discontinuity at the inserted row."""
    if seed is not None:
        random.seed(seed)
    idx = random.randint(0, len(txns) - 1)
    out = copy.deepcopy(txns)
    fake = copy.deepcopy(out[idx])
    fake["narration"] = "UPI/999999999999/unknown.payee/Payment"
    fake["debit"], fake["credit"] = round(random.uniform(100, 2000), 2), 0.0
    out.insert(idx, fake)
    return out, {"perturbation": "insertion", "index": idx, "inserted": fake}


def tamper_amount(txns: list, seed=None):
    """Modifies one transaction's debit/credit amount without updating
    its own or downstream balances."""
    if seed is not None:
        random.seed(seed)
    idx = random.randint(0, len(txns) - 1)
    out = copy.deepcopy(txns)
    t = out[idx]
    delta = round(random.uniform(50, 500), 2)
    if t["debit"] > 0:
        t["debit"] = round(t["debit"] + delta, 2)
    else:
        t["credit"] = round(t["credit"] + delta, 2)
    return out, {"perturbation": "amount_tamper", "index": idx, "delta": delta}
