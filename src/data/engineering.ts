import { POOL_TYPES, getPoolType } from './poolTypes';

/**
 * Legacy turnover bands kept for the Engineering "Turnover Standards" panel.
 * The actual turnover hours are now derived from POOL_TYPES per Brett's spec
 * (Class A/B/C depth-based; everything else fixed hours).
 */
export const TURNOVER_STANDARDS = [
  {
    label: 'Class A / B / C',
    hours: 6,
    types: POOL_TYPES.filter((p) => p.turnoverHours === 'depth-based').map((p) => p.id) as (string | null)[],
  },
  {
    label: 'Class D — Recreation',
    hours: 2,
    types: POOL_TYPES.filter((p) => p.ispscClass.startsWith('Class D')).map((p) => p.id) as (string | null)[],
  },
  {
    label: 'Class E / F / H — Specialty',
    hours: 1,
    types: POOL_TYPES.filter((p) =>
      p.ispscClass.startsWith('Class E') ||
      p.ispscClass.startsWith('Class F') ||
      p.ispscClass.startsWith('Class H'),
    ).map((p) => p.id) as (string | null)[],
  },
  {
    label: 'Residential / Other',
    hours: 8,
    types: [
      ...POOL_TYPES.filter((p) => p.ispscClass === '—' || p.ispscClass === 'Other').map((p) => p.id),
      null,
    ] as (string | null)[],
  },
];

/**
 * Resolve turnover hours for a pool type per Brett's spec.
 *
 * Class A/B/C use the depth-based formula `min(1.5 * avg_depth, 6)`. Everything
 * else uses the fixed value baked into the POOL_TYPES table.
 */
export function getTurnoverHoursForPoolType(
  poolUseType: string | null,
  averageDepth: number,
): number {
  const pt = getPoolType(poolUseType);
  if (!pt) return 6;
  if (pt.turnoverHours === 'depth-based') {
    if (!Number.isFinite(averageDepth) || averageDepth <= 0) return 6;
    return Math.min(1.5 * averageDepth, 6);
  }
  return pt.turnoverHours;
}
