import type { Transaction } from "./schema";

export type ContinuityResult = {
  valid: boolean;
  errors: Array<{ index: number; expected: number; actual: number; row: Transaction }>;
};

const EPSILON = 0.01; // tolerate float rounding

export function validateBalanceContinuity(transactions: Transaction[]): ContinuityResult {
  const errors: ContinuityResult["errors"] = [];

  for (let i = 1; i < transactions.length; i++) {
    const prev = transactions[i - 1];
    const curr = transactions[i];

    const delta = (curr.credit ?? 0) - (curr.debit ?? 0);
    const expected = round2(prev.balance + delta);
    const actual = round2(curr.balance);

    if (Math.abs(expected - actual) > EPSILON) {
      errors.push({ index: i, expected, actual, row: curr });
    }
  }

  return { valid: errors.length === 0, errors };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
