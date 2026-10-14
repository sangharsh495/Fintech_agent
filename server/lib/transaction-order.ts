/**
 * Statement order for stored transactions.
 *
 * Several transactions often share a date, and the table has no column that
 * says which came last, so "the latest balance" was ambiguous: a day with a
 * credit then a debit could report the balance before the debit. Rows are
 * therefore stored oldest-first with created_at stepped 1 ms apart, and every
 * latest-balance lookup orders by (date, created_at).
 */

/**
 * Returns the rows oldest-first. Banks print statements either way round, so
 * a statement whose first date is later than its last is reversed as a
 * whole. That keeps the printed order of same-day rows, which a plain sort
 * by date would scramble.
 */
export function chronological<T extends { date: Date }>(rows: T[]): T[] {
  if (rows.length < 2) return [...rows]
  const first = rows[0].date.getTime()
  const last = rows[rows.length - 1].date.getTime()
  const ordered = first > last ? [...rows].reverse() : [...rows]
  // Stable sort: only fixes rows that are out of date order, ties keep position.
  return ordered
    .map((row, index) => ({ row, index }))
    .sort((a, b) => a.row.date.getTime() - b.row.date.getTime() || a.index - b.index)
    .map(({ row }) => row)
}

/** created_at for the i-th row of a batch, so insertion order survives ties. */
export function sequencedTimestamp(base: Date, index: number): Date {
  return new Date(base.getTime() + index)
}
