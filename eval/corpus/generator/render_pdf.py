"""
Renders one statement's transactions as a PDF whose text items sit at
real x/y coordinates — the same thing a position-aware extractor
(pdf.js-extract / pdfplumber) reads. This is what makes the corpus a
fair test of a coordinate-based parser, not just a wall of text.
"""

from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from bank_profiles import BankProfile, MARGIN_TOP, PAGE_HEIGHT

ROWS_PER_PAGE = 32


def _fmt_amount(value: float, decimal_sep: str) -> str:
    s = f"{value:,.2f}"
    if decimal_sep != ".":
        s = s.replace(",", "§").replace(".", decimal_sep).replace("§", ",")
    return s


def render_statement_pdf(path: str, profile: BankProfile, account_holder: str,
                          account_number: str, ifsc: str, statement_period: str,
                          opening_balance: float, txns: list, closing_balance: float):
    c = canvas.Canvas(path, pagesize=A4)

    def draw_header(page_num):
        c.setFont("Helvetica-Bold", 13)
        c.drawString(40, 810, profile.display_name)
        c.setFont("Helvetica", 8)
        c.drawString(40, 796, f"Account Statement  |  Page {page_num}")
        c.drawString(40, 784, f"Account Holder: {account_holder}    A/C No: {account_number}    IFSC: {ifsc}")
        c.drawString(40, 772, f"Statement Period: {statement_period}    Opening Balance: {_fmt_amount(opening_balance, profile.decimal_sep)}")
        c.line(40, 765, 560, 765)

        c.setFont("Helvetica-Bold", profile.header_font_size)
        y = 754
        for col in profile.columns:
            c.drawString(col.x, y, col.label)
        c.line(40, y - 4, 560, y - 4)
        return y - 18

    page_num = 1
    y = draw_header(page_num)
    c.setFont("Helvetica", profile.row_font_size)

    for i, t in enumerate(txns):
        if y < 60:
            c.showPage()
            page_num += 1
            y = draw_header(page_num)
            c.setFont("Helvetica", profile.row_font_size)

        date_str = datetime.strptime(t["date"], "%Y-%m-%d").strftime(profile.date_format)

        for col in profile.columns:
            if col.key == "date":
                val = date_str
            elif col.key == "value_date":
                val = date_str
            elif col.key == "narration":
                val = t["narration"][:38]
            elif col.key == "ref":
                val = t["ref"][-9:]
            elif col.key == "debit":
                val = _fmt_amount(t["debit"], profile.decimal_sep) if t["debit"] else ""
            elif col.key == "credit":
                val = _fmt_amount(t["credit"], profile.decimal_sep) if t["credit"] else ""
            elif col.key == "amount":
                suffix = "Dr" if t["type"] == "debit" else "Cr"
                amt = t["debit"] if t["type"] == "debit" else t["credit"]
                val = f"{_fmt_amount(amt, profile.decimal_sep)} {suffix}"
            elif col.key == "balance":
                val = _fmt_amount(t["balance"], profile.decimal_sep)
            else:
                val = ""
            c.drawString(col.x, y, val)

        y -= profile.row_height

    c.setFont("Helvetica-Bold", 8)
    if y < 70:
        c.showPage()
        y = draw_header(page_num + 1)
    c.line(40, y + 6, 560, y + 6)
    c.drawString(40, y - 6, f"Closing Balance: {_fmt_amount(closing_balance, profile.decimal_sep)}")

    c.save()
