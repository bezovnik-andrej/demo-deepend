/**
 * Demo lookup: nominal sanitary drain / lateral vs conservative max sustained gpm.
 * For pairing UI only — confirm with plumbing engineer for real projects.
 */

const NOMINAL_TO_GPM: Record<number, number> = {
  2: 45,
  3: 120,
  4: 220,
  6: 550,
};

export const SEWER_NOMINAL_OPTIONS = [2, 3, 4, 6] as const;

export function capacityForNominalIn(inches: number): number {
  return NOMINAL_TO_GPM[inches] ?? NOMINAL_TO_GPM[2]!;
}

/** Pick the smallest standard pipe whose demo capacity still clears the target gpm. */
export function nominalInForCapacityGpm(gpm: number): number {
  const sorted = [...SEWER_NOMINAL_OPTIONS].sort((a, b) => a - b);
  for (const n of sorted) {
    if (capacityForNominalIn(n) >= gpm) return n;
  }
  return sorted[sorted.length - 1]!;
}
