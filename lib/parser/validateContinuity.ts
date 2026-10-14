import type { Transaction } from "./schema";

export type ContinuityResult = {
  valid: boolean;
  errors: Array<{ index: number; expected: number; actual: number; row: Transaction }>;
};

const EPSILON = 0.01; // tolerate float rounding

/**
 * Checks that every row's balance follows from the previous one:
 * |B_i − (B_{i−1} + C_i − D_i)| ≤ 0.01.
 *
 * Without `openingBalance` the first row has no predecessor, so a fault in it
 * (a dropped, misread or flipped first row) cannot be seen. Passing the
 * opening balance printed on the statement anchors row 0 as well.
 */
export function validateBalanceContinuity(transactions: Transaction[], openingBalance?: number): ContinuityResult {
  const errors: ContinuityResult["errors"] = [];

  for (let i = 0; i < transactions.length; i++) {
    const prevBalance = i === 0 ? openingBalance : transactions[i - 1]?.balance;
    const curr = transactions[i];

    if (prevBalance != null && curr?.balance != null) {
      const delta = (curr.credit ?? 0) - (curr.debit ?? 0);
      const expected = round2(prevBalance + delta);
      const actual = round2(curr.balance);

      if (Math.abs(expected - actual) > EPSILON) {
        errors.push({ index: i, expected, actual, row: curr });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Finds the opening balance printed on a statement ("Opening Balance: 1,20,514.39",
 * "Opening Bal 5,000.00 Cr"). Returns undefined when absent or ambiguous, in
 * which case the check simply runs unanchored.
 */
export function findOpeningBalance(text: string): number | undefined {
  const matches = [...text.matchAll(/opening\s+bal(?:ance)?\.?\s*(?:\(\s*inr\s*\)|\(\s*rs\.?\s*\))?\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*(-?\(?[\d,]+\.\d{1,2}\)?)\s*(dr|cr)?/gi)];
  const values = new Set(
    matches.map(([, amount, suffix]) => {
      const value = parseFloat(amount!.replace(/[(),]/g, ""));
      const negative = amount!.startsWith("-") || amount!.startsWith("(") || suffix?.toLowerCase() === "dr";
      return negative ? -Math.abs(value) : value;
    })
  );
  // Repeated on every page is fine; two different figures is ambiguous.
  return values.size === 1 ? [...values][0] : undefined;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
