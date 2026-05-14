/**
 * Pool Types — replaces the old 4-type list (Residential / Commercial / Competition / Therapy).
 *
 * Per Brett 4.13.2026 — 19 ISPSC-aligned classifications. Each carries metadata
 * that downstream calculations use (turnover, chemistry, etc.).
 *
 * Source: All Changes for Brett.docx, §1 "Pool Types Overhaul".
 */

export interface PoolType {
  /** Stable id stored in ProjectData.poolUseType. */
  id: string;
  /** Display label. */
  label: string;
  /** ISPSC class designation (or '—' when not classified). */
  ispscClass: string;
  /** Optional one-liner shown beneath the label. */
  description?: string;
  /** Recirculation standard (turnover hours). Class A/B/C are depth-based; others fixed. */
  turnoverHours: number | 'depth-based';
}

export const POOL_TYPES: PoolType[] = [
  // Class A — Competition
  {
    id: 'Competition Pool',
    label: 'Competition Pool',
    ispscClass: 'Class A',
    description: 'Sanctioned racing / training facility',
    turnoverHours: 'depth-based',
  },
  // Class B — Public
  {
    id: 'Public Pool',
    label: 'Public Pool',
    ispscClass: 'Class B',
    description: 'Municipal, hotel, apartment complex',
    turnoverHours: 'depth-based',
  },
  // Class C — Semi-Public
  {
    id: 'Semi-Public Pool',
    label: 'Semi-Public Pool',
    ispscClass: 'Class C',
    description: 'HOA, school, club — limited access',
    turnoverHours: 'depth-based',
  },
  // Class D — Aquatic Recreation
  {
    id: 'Wave Pool',
    label: 'Wave Pool',
    ispscClass: 'Class D-1 (≥20k SF)',
    description: 'Large wave basin (≥20k SF surface) — high bather loads and aggressive turnover.',
    turnoverHours: 2,
  },
  {
    id: 'Surf/Wave Small',
    label: 'Surf / Wave (Small)',
    ispscClass: 'Class D-1 (<20k SF)',
    description: 'Smaller wave or surf venue — still treated as Class D-1 for turnover in this tool.',
    turnoverHours: 2,
  },
  {
    id: 'Activity Pool Shallow',
    label: 'Activity Pool — Shallow',
    ispscClass: 'Class D-2 (≤24 in.)',
    description: 'Shallow play pool (≤24 in. water) — very fast turnover for splash and wading depth.',
    turnoverHours: 1,
  },
  {
    id: 'Activity Pool',
    label: 'Activity Pool',
    ispscClass: 'Class D-2 (>24 in.)',
    description: 'Deeper activity / play pool — Class D-2 turnover for interactive water.',
    turnoverHours: 2,
  },
  {
    id: 'Slide Pool',
    label: 'Slide Pool',
    ispscClass: 'Class D-3',
    description: 'Pool whose primary use is slide run-outs and plunge areas — Class D-3 sizing.',
    turnoverHours: 1,
  },
  {
    id: 'Leisure River',
    label: 'Leisure River',
    ispscClass: 'Class D-4',
    description: 'Lazy river / current channel',
    turnoverHours: 2,
  },
  {
    id: 'Vortex Pool',
    label: 'Vortex Pool',
    ispscClass: 'Class D-5',
    description: 'Circular current / vortex feature — short turnover, specialized hydraulics.',
    turnoverHours: 1,
  },
  {
    id: 'Interactive Play',
    label: 'Interactive Play',
    ispscClass: 'Class D-6',
    description: 'Splash pad / spray ground',
    turnoverHours: 1,
  },
  // Class E — Spa
  {
    id: 'Spa / Hot Tub',
    label: 'Spa / Hot Tub',
    ispscClass: 'Class E',
    description: 'Elevated-temp vessel — high turnover per gallon, different chemistry than main pool.',
    turnoverHours: 0.5,
  },
  // Class F — Wading
  {
    id: 'Wading Pool',
    label: 'Wading Pool',
    ispscClass: 'Class F',
    description: 'Toddler / kiddie pool',
    turnoverHours: 1,
  },
  // Class H — Therapeutic
  {
    id: 'Therapeutic Small',
    label: 'Therapeutic — Small',
    ispscClass: 'Class H (≤1k gal)',
    description: 'Rehab / hydrotherapy',
    turnoverHours: 0.5,
  },
  // Unclassified
  {
    id: 'Instructional Pool',
    label: 'Instructional Pool',
    ispscClass: '—',
    description: 'Swim lessons / training',
    turnoverHours: 4,
  },
  {
    id: 'Residential',
    label: 'Residential',
    ispscClass: '—',
    description: 'Single-family backyard pool',
    turnoverHours: 12,
  },
  {
    id: 'Residential Spa',
    label: 'Residential Spa',
    ispscClass: '—',
    description: 'Private home spa',
    turnoverHours: 1,
  },
  {
    id: 'Fountain',
    label: 'Fountain',
    ispscClass: '—',
    description: 'Decorative water feature',
    turnoverHours: 1,
  },
  {
    id: 'Other',
    label: 'Other',
    ispscClass: 'Other',
    description: 'Custom — specify in notes',
    turnoverHours: 6,
  },
];

export function getPoolType(id: string | null): PoolType | undefined {
  if (!id) return undefined;
  return POOL_TYPES.find((p) => p.id === id);
}

/** Short explanatory copy for the pool-type picker (popover). */
export function getPoolTypeHelpBlurb(p: PoolType): string {
  const classLine =
    p.ispscClass !== '—' && p.ispscClass !== 'Other'
      ? `International Swimming Pool and Spa Code (${p.ispscClass}). `
      : '';
  const desc = p.description ? `${p.description} ` : '';
  const turn =
    p.turnoverHours === 'depth-based'
      ? 'This class uses the depth-based turnover rule in this tool: min(1.5 × average depth in hours, 6 h). '
      : `Typical turnover target used for hydraulic sizing: ${p.turnoverHours} hour(s) per pool volume.`;
  return `${classLine}${desc}${turn}`.trim();
}

/** Group pool types by ISPSC class for the picker. */
export interface PoolTypeGroup {
  family: string;
  label: string;
  /** Shown next to the family chip (ISPSC grouping overview). */
  familyHelp?: string;
  options: PoolType[];
}

export const POOL_TYPE_GROUPS: PoolTypeGroup[] = [
  {
    family: 'class-abc',
    label: 'Class A / B / C — Standard Pools',
    familyHelp:
      'Class A (competition), B (public), and C (semi-public) are the standard depth-classified pools in ISPSC. This app applies the depth-based turnover minimum for A–C when you enter average depth.',
    options: POOL_TYPES.filter((p) => ['Class A', 'Class B', 'Class C'].includes(p.ispscClass)),
  },
  {
    family: 'class-d',
    label: 'Class D — Aquatic Recreation',
    familyHelp:
      'Class D covers aquatic recreation venues (waves, slides, activity pools, rivers, spray features, vortex). Each D sub-type has its own turnover and bather-load assumptions—pick the one that matches the water feature.',
    options: POOL_TYPES.filter((p) => p.ispscClass.startsWith('Class D')),
  },
  {
    family: 'class-efh',
    label: 'Class E / F / H — Specialty',
    familyHelp:
      'Class E spas and hot tubs, Class F wading, Class H therapeutic pools—smaller volumes, warmer water, or different chemistry and turnover expectations than main pools.',
    options: POOL_TYPES.filter((p) =>
      p.ispscClass.startsWith('Class E') ||
      p.ispscClass.startsWith('Class F') ||
      p.ispscClass.startsWith('Class H'),
    ),
  },
  {
    family: 'unclassified',
    label: 'Other',
    familyHelp:
      'Types without an ISPSC letter class here, or custom “Other.” Turnover values are sensible defaults for sizing—confirm classification and local amendments with the AHJ.',
    options: POOL_TYPES.filter((p) => p.ispscClass === '—' || p.ispscClass === 'Other'),
  },
];
