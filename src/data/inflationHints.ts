/**
 * Flat UI-only material drift hint (% per month). Does not modify line totals.
 */
export const INFLATION_PCT_PER_MONTH = {
  default: 0.4,
} as const;

export function monthlyInflationPct(): number {
  return INFLATION_PCT_PER_MONTH.default;
}

/** Whole months from today to `isoDate` (YYYY-MM-DD), clamped at 0. */
export function monthsFromToday(isoDate: string): number {
  const target = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  const now = new Date();
  let months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  if (target.getDate() < now.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Approximate cumulative hint % for display (linear: months × rate). */
export function inflationHintPctTotal(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const m = monthsFromToday(isoDate);
  if (m <= 0) return 0;
  return Math.round(m * monthlyInflationPct() * 10) / 10;
}
