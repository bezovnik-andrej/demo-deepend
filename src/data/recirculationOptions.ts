/**
 * Pool Recirculation options (formerly "Gutter Style").
 *
 * Travis Apr 24 — 11 options grouped into 3 families.
 * See docs/nested-picker.md.
 */

import { getOptionCost } from './configCosts';

export interface RecirculationOption {
  value: string;
  label: string;
  /** Sum of material + labor per linear foot — what the chip displays. */
  cost?: number;
  /** Suffix appended to the cost chip (e.g. "/LF"). */
  costSuffix?: string;
  /** Material cost per linear foot. */
  materialCostPerLf?: number;
  /** Labor cost per linear foot. */
  laborCostPerLf?: number;
  /** Coping width when relevant (e.g. "12\""). */
  width?: string;
  /** Small inline badge next to the option label (mirrors `width`). */
  badge?: string;
  /** Auto-built breakdown copy shown via the row InfoHint. */
  helpText?: string;
}

export interface RecirculationGroup {
  family: string;
  label: string;
  options: RecirculationOption[];
}

const RAW_GROUPS: RecirculationGroup[] = [
  {
    family: 'skimmer',
    label: 'Skimmer',
    options: [
      { value: 'skimmer-12-coping', label: 'With 12" coping' },
      { value: 'skimmer-18-coping', label: 'With 18" coping' },
      { value: 'coping-no-skimmers', label: 'Coping, no skimmers' },
      { value: 'no-gutter-splash-pad', label: 'No gutter — splash pad' },
    ],
  },
  {
    family: 'gutter-ss',
    label: 'Gutter — Stainless Steel',
    options: [
      { value: 'ss-deck-level-weirs', label: 'Deck level (weirs)' },
      { value: 'ss-deck-level', label: 'Deck level' },
      { value: 'ss-rollout', label: 'Rollout' },
    ],
  },
  {
    family: 'gutter-concrete',
    label: 'Gutter — Concrete',
    options: [
      { value: 'concrete-deck-level', label: 'Deck level' },
      { value: 'concrete-rollout', label: 'Rollout' },
      { value: 'concrete-rollout-parapet', label: 'Rollout w/ parapet' },
      { value: 'concrete-fully-recessed', label: 'Fully recessed' },
    ],
  },
];

function buildBreakdown(width: string | undefined, material: number, labor: number): string {
  const parts: string[] = [];
  if (width) parts.push(`Coping width ${width}.`);
  if (material === 0 && labor === 0) {
    parts.push('No material or labor cost (splash pad / N/A).');
  } else {
    parts.push(`Material $${material}/LF + Labor $${labor}/LF = $${material + labor}/LF.`);
    parts.push('Total cost is per-LF × pool perimeter.');
  }
  return parts.join(' ');
}

export const RECIRCULATION_GROUPS: RecirculationGroup[] = RAW_GROUPS.map((g) => ({
  ...g,
  options: g.options.map((o) => {
    const c = getOptionCost('gutterStyle', o.value);
    if (!c) return o;
    const material = c.materialCostPerLf ?? 0;
    const labor = c.laborCostPerLf ?? 0;
    return {
      ...o,
      cost: c.cost,
      costSuffix: c.materialCostPerLf != null ? '/LF' : undefined,
      badge: c.width,
      materialCostPerLf: c.materialCostPerLf,
      laborCostPerLf: c.laborCostPerLf,
      width: c.width,
      helpText: c.materialCostPerLf != null ? buildBreakdown(c.width, material, labor) : undefined,
    };
  }),
}));

export function familyOfVariant(value: string): string | null {
  return RECIRCULATION_GROUPS.find((g) => g.options.some((o) => o.value === value))?.family ?? null;
}

export function setVariantForFamily(current: string[], family: string, variant: string): string[] {
  const familyValues = new Set(
    RECIRCULATION_GROUPS.find((g) => g.family === family)?.options.map((o) => o.value) ?? [],
  );
  return [...current.filter((value) => !familyValues.has(value)), variant];
}

export function toggleFamily(current: string[], family: string, defaultVariant: string): string[] {
  const familyValues = new Set(
    RECIRCULATION_GROUPS.find((g) => g.family === family)?.options.map((o) => o.value) ?? [],
  );
  const hasFamily = current.some((value) => familyValues.has(value));
  if (hasFamily) return current.filter((value) => !familyValues.has(value));
  return [...current, defaultVariant];
}

export function getRecirculationLabels(values: string | string[] | null | undefined): string[] {
  if (values == null) return [];
  const arr = Array.isArray(values) ? values : [values];
  return arr.filter(Boolean).map((value) => getRecirculationLabel(value)).filter(Boolean);
}

/** Map a stored value to a friendly display label including its family. */
export function getRecirculationLabel(value: string | null): string {
  if (!value) return '';
  for (const group of RECIRCULATION_GROUPS) {
    const opt = group.options.find((o) => o.value === value);
    if (opt) {
      return `${group.label.replace('Gutter — ', '')} · ${opt.label}`;
    }
  }
  return value;
}
