"""
Bank format profiles for the E1 synthetic evaluation corpus.

Each profile describes how ONE bank's statement lays out its transaction
table: column order, header labels, x-position/width (in points, on an
A4 canvas), date format, and whether amounts are in separate Debit/Credit
columns or a single Amount column with a Dr/Cr suffix.

This ships with 8 representative profiles covering the two dominant
layout families (separate Dr/Cr columns vs single amount+suffix column).
To reach all 21 banks, copy a profile block closest to the real bank's
layout and adjust header labels / column widths to match your actual
bank-profiles.ts definitions — that's the only thing that needs to match
for your deterministic parser to have a fair shot at each format.
"""

from dataclasses import dataclass, field
from typing import List, Literal

PAGE_WIDTH = 595  # A4 in points (reportlab default 'A4')
PAGE_HEIGHT = 842
MARGIN_LEFT = 40
MARGIN_TOP = 780


@dataclass
class Column:
    key: str          # internal field name: date | narration | ref | debit | credit | amount | dr_cr | balance
    label: str         # header text as printed on the real statement
    x: int              # x position (points from left)
    width: int


@dataclass
class BankProfile:
    bank_id: str
    display_name: str
    date_format: str  # strftime pattern
    amount_style: Literal["separate_dr_cr", "single_amount_suffix"]
    decimal_sep: str
    columns: List[Column]
    balance_label: str = "Balance"
    header_font_size: int = 6
    row_font_size: int = 8
    row_height: int = 14


PROFILES = {
    "HDFC": BankProfile(
        bank_id="HDFC", display_name="HDFC Bank",
        date_format="%d/%m/%y",
        amount_style="separate_dr_cr",
        decimal_sep=".",
        columns=[
            Column("date", "Date", 40, 55),
            Column("narration", "Narration", 100, 190),
            Column("ref", "Chq/Ref No.", 295, 75),
            Column("value_date", "Value Dt", 375, 55),
            Column("debit", "Withdrawal Amt.", 435, 60),
            Column("credit", "Deposit Amt.", 495, 60),
            Column("balance", "Closing Balance", 555, 0),
        ],
    ),
    "ICICI": BankProfile(
        bank_id="ICICI", display_name="ICICI Bank",
        date_format="%d-%m-%Y",
        amount_style="separate_dr_cr",
        decimal_sep=".",
        columns=[
            Column("date", "Value Date", 40, 65),
            Column("narration", "Transaction Remarks", 110, 200),
            Column("ref", "Cheque Number", 310, 65),
            Column("debit", "Withdrawal Amount (INR)", 380, 65),
            Column("credit", "Deposit Amount (INR)", 450, 60),
            Column("balance", "Balance (INR)", 515, 0),
        ],
    ),
    "SBI": BankProfile(
        bank_id="SBI", display_name="State Bank of India",
        date_format="%d %b %Y",
        amount_style="single_amount_suffix",
        decimal_sep=".",
        columns=[
            Column("date", "Txn Date", 40, 60),
            Column("narration", "Description", 105, 220),
            Column("ref", "Ref No./Cheque No.", 330, 75),
            Column("amount", "Amount", 410, 65),
            Column("balance", "Balance", 480, 0),
        ],
    ),
    "AXIS": BankProfile(
        bank_id="AXIS", display_name="Axis Bank",
        date_format="%d-%m-%Y",
        amount_style="separate_dr_cr",
        decimal_sep=".",
        columns=[
            Column("date", "Tran Date", 40, 60),
            Column("narration", "Particulars", 105, 210),
            Column("ref", "Chq No", 320, 55),
            Column("debit", "Debit", 380, 55),
            Column("credit", "Credit", 440, 55),
            Column("balance", "Balance", 500, 0),
        ],
    ),
    "KOTAK": BankProfile(
        bank_id="KOTAK", display_name="Kotak Mahindra Bank",
        date_format="%d-%m-%Y",
        amount_style="single_amount_suffix",
        decimal_sep=".",
        columns=[
            Column("date", "Date", 40, 55),
            Column("narration", "Description", 100, 230),
            Column("ref", "Chq/Ref No", 335, 70),
            Column("amount", "Amount", 410, 70),
            Column("balance", "Balance", 485, 0),
        ],
    ),
    "PNB": BankProfile(
        bank_id="PNB", display_name="Punjab National Bank",
        date_format="%d/%m/%Y",
        amount_style="separate_dr_cr",
        decimal_sep=".",
        columns=[
            Column("date", "Date", 40, 60),
            Column("narration", "Particulars", 105, 200),
            Column("ref", "Instr. Id", 310, 65),
            Column("debit", "Withdrawal", 380, 60),
            Column("credit", "Deposit", 445, 60),
            Column("balance", "Balance", 510, 0),
        ],
    ),
    "BOB": BankProfile(
        bank_id="BOB", display_name="Bank of Baroda",
        date_format="%d-%m-%Y",
        amount_style="single_amount_suffix",
        decimal_sep=".",
        columns=[
            Column("date", "Txn Date", 40, 60),
            Column("narration", "Remarks", 105, 220),
            Column("ref", "Ref No", 330, 65),
            Column("amount", "Amount", 400, 70),
            Column("balance", "Balance", 475, 0),
        ],
    ),
    "YES": BankProfile(
        bank_id="YES", display_name="Yes Bank",
        date_format="%d/%m/%Y",
        amount_style="separate_dr_cr",
        decimal_sep=".",
        columns=[
            Column("date", "Date", 40, 60),
            Column("narration", "Description", 105, 200),
            Column("ref", "Cheque No", 310, 60),
            Column("debit", "Debit", 375, 55),
            Column("credit", "Credit", 435, 55),
            Column("balance", "Balance", 495, 0),
        ],
    ),
}

ALL_BANK_IDS = list(PROFILES.keys())
