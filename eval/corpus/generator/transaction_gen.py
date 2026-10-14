"""
Generates a synthetic but realistic sequence of Indian retail bank
transactions with a running balance that is, by construction, always
internally consistent:

    balance[i] == balance[i-1] + credit[i] - debit[i]

This gives you ground truth you can trust for measuring extraction
accuracy (E2/E3) and, later, for injecting controlled perturbations
to validate the balance-continuity invariant's detection rate (E4).
"""

import random
from datetime import datetime, timedelta

MERCHANTS = ["Swiggy", "Zomato", "Amazon Retail", "Flipkart", "BigBasket",
             "Blinkit", "IRCTC", "Uber", "Ola", "Netflix", "Spotify",
             "Reliance Digital", "DMart", "Apollo Pharmacy", "Airtel Postpaid"]
UPI_HANDLES = ["rahul.k", "priya.s", "vendor.shop", "tenant.rent", "freelance.client"]
SALARY_EMPLOYERS = ["INFOSYS LTD", "TCS LTD", "WIPRO LTD", "ACCENTURE SOL",
                     "SELF EMPLOYED CR"]

NARRATION_TEMPLATES = {
    "UPI_DEBIT": "UPI/{ref}/{handle}/Payment",
    "UPI_CREDIT": "UPI/{ref}/{handle}/Received",
    "POS_DEBIT": "POS/{ref}/{merchant}",
    "ATM_WITHDRAWAL": "ATM WDL/{ref}/NAGPUR",
    "NEFT_CREDIT": "NEFT/{ref}/{employer}/SALARY",
    "IMPS_DEBIT": "IMPS/{ref}/{handle}",
    "EMI_DEBIT": "ACH DR/{ref}/EMI LOAN {loan}",
    "INTEREST_CREDIT": "INT.PD:{ref}",
    "MOBILE_RECHARGE": "UPI/{ref}/{handle}/Recharge",
}


def _ref():
    return str(random.randint(100000000000, 999999999999))


def generate_statement_transactions(opening_balance: float, n_txns: int,
                                     start_date: datetime, seed: int = None):
    """Returns (transactions, closing_balance).

    Each transaction dict: {date, narration, debit, credit, balance, type}
    type in {"debit", "credit"} — this is the ground-truth label your
    parser's output should be scored against.
    """
    if seed is not None:
        random.seed(seed)

    txns = []
    balance = round(opening_balance, 2)
    date = start_date

    # Guarantee at least one salary-style credit for realism
    salary_index = random.randint(0, max(0, n_txns - 1))

    for i in range(n_txns):
        date = date + timedelta(days=random.choice([0, 0, 1, 1, 1, 2, 3]))
        ref = _ref()

        if i == salary_index:
            kind, amount = "NEFT_CREDIT", round(random.uniform(35000, 95000), 2)
            narration = NARRATION_TEMPLATES[kind].format(
                ref=ref, employer=random.choice(SALARY_EMPLOYERS))
            debit, credit = 0.0, amount
        else:
            kind = random.choices(
                ["UPI_DEBIT", "POS_DEBIT", "ATM_WITHDRAWAL", "UPI_CREDIT",
                 "IMPS_DEBIT", "EMI_DEBIT", "INTEREST_CREDIT", "MOBILE_RECHARGE"],
                weights=[28, 18, 10, 12, 10, 8, 6, 8])[0]

            if kind == "UPI_DEBIT":
                amount = round(random.uniform(50, 3500), 2)
                narration = NARRATION_TEMPLATES[kind].format(ref=ref, handle=random.choice(UPI_HANDLES))
                debit, credit = amount, 0.0
            elif kind == "POS_DEBIT":
                amount = round(random.uniform(150, 6000), 2)
                narration = NARRATION_TEMPLATES[kind].format(ref=ref, merchant=random.choice(MERCHANTS))
                debit, credit = amount, 0.0
            elif kind == "ATM_WITHDRAWAL":
                amount = round(random.choice([2000, 5000, 10000]), 2)
                narration = NARRATION_TEMPLATES[kind].format(ref=ref)
                debit, credit = amount, 0.0
            elif kind == "UPI_CREDIT":
                amount = round(random.uniform(200, 8000), 2)
                narration = NARRATION_TEMPLATES[kind].format(ref=ref, handle=random.choice(UPI_HANDLES))
                debit, credit = 0.0, amount
            elif kind == "IMPS_DEBIT":
                amount = round(random.uniform(500, 15000), 2)
                narration = NARRATION_TEMPLATES[kind].format(ref=ref, handle=random.choice(UPI_HANDLES))
                debit, credit = amount, 0.0
            elif kind == "EMI_DEBIT":
                amount = round(random.choice([4500, 6800, 9200, 12500]), 2)
                narration = NARRATION_TEMPLATES[kind].format(ref=ref, loan=random.randint(1000, 9999))
                debit, credit = amount, 0.0
            elif kind == "INTEREST_CREDIT":
                amount = round(random.uniform(5, 150), 2)
                narration = NARRATION_TEMPLATES[kind].format(ref=ref)
                debit, credit = 0.0, amount
            else:  # MOBILE_RECHARGE
                amount = round(random.choice([199, 299, 349, 499, 719]), 2)
                narration = NARRATION_TEMPLATES[kind].format(ref=ref, handle="airtel.prepaid")
                debit, credit = amount, 0.0

        balance = round(balance + credit - debit, 2)
        txns.append({
            "date": date.strftime("%Y-%m-%d"),
            "narration": narration,
            "ref": ref,
            "debit": debit,
            "credit": credit,
            "balance": balance,
            "type": "credit" if credit > 0 else "debit",
        })

    return txns, balance
