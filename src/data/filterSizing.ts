/**
 * Filter Sizing — design flow rate, required filter area, backwash & sewer,
 * and retention pit calculations.
 *
 * Mirrors the flow of HeaterSizing: pure functions over an input bundle so
 * the form can re-derive everything reactively.
 */

import { CF_TO_GALLONS } from './poolSections';
import { getPoolType } from './poolTypes';
import type { FilterMediaType } from './equipmentCatalog';

export interface FilterSizingInputs {
  /** Recirculation flow rate (gpm) — derived from pool gallons / turnover hours. */
  recirculationGpm: number;
  /** Design surface flow rate (gpm/ft²). Override; falls back to media+pool default. */
  flowRateDesignGpmPerSf: number | null;
  /** Selected filter media (sand / cartridge / DE / glass). Drives default rate. */
  mediaType: FilterMediaType | null;
  /** Pool use type id — used to pick a Light/Heavy commercial design rate. */
  poolUseType: string | null;
  /** Per-filter rated area (ft²) for the selected catalogue product. */
  perFilterAreaSf: number;
  /** Number of identical filter tanks in the proposed install. */
  filterCount: number;
  /** Backwash surface velocity (gpm/ft²). Override; null = media default. */
  backwashRateGpmPerSf: number | null;
  /** Sewer / discharge line capacity (gpm). */
  sewerCapacityGpm: number;
  /** Retention time (minutes) used to size the retention pit volume. */
  retentionTimeMin: number;
  /** Retention pit dimensions (ft). */
  retentionPitLengthFt: number;
  retentionPitWidthFt: number;
  retentionPitDepthFt: number;
}

export interface FilterSizingResult {
  /** Effective design flow rate (gpm/ft²) — input override or default. */
  flowRateDesignGpmPerSf: number;
  /** Required total filter area (ft²) = recirculationGpm / flowRateDesignGpmPerSf. */
  filterAreaRequiredSf: number;
  /** Total actual area (ft²) = perFilterAreaSf × filterCount. */
  filterAreaActualSf: number;
  /** Actual surface flow (gpm/ft²) = recirculationGpm / filterAreaActualSf. */
  filterRateActualGpmPerSf: number;
  /** True when actual flow rate ≤ design rate (filter is adequately sized). */
  meetsDesignRate: boolean;
  /** Effective backwash surface velocity (gpm/ft²). */
  backwashRateGpmPerSf: number;
  /** Backwash flow per single filter tank (gpm). */
  backwashFlowPerFilterGpm: number;
  /** Worst-case retention required in gallons = backwashFlowPerFilterGpm × retentionTimeMin. */
  retentionRequiredGallons: number;
  /** Pit volume in gallons from L × W × D × 7.4805. */
  retentionActualGallons: number;
  /** True when actual ≥ required (and required > 0). */
  retentionMeetsRequirement: boolean;
}

// ── Design rate defaults (gpm/ft²) ──
//
// Industry-typical filter loading rates per ANSI/APSP-7 and 10 State Standards.
// Cartridge filters are rated lower (~0.375 gpm/ft²) because their effective
// area is huge; that's already baked into our catalogue's `filterAreaSqFt`
// (computed cartridge area / 45). For UI clarity we keep one number per media.

const DESIGN_RATE_BY_MEDIA: Record<FilterMediaType, { residential: number; lightCommercial: number; commercial: number }> = {
  Sand:           { residential: 15, lightCommercial: 20, commercial: 25 },
  'Glass Media':  { residential: 18, lightCommercial: 22, commercial: 27 },
  DE:             { residential: 1.5, lightCommercial: 2,  commercial: 2.25 }, // sf based on actual DE grid area, ~2 gpm/ft² typical
  Cartridge:      { residential: 0.375, lightCommercial: 0.5, commercial: 0.5 },
};

// ── Backwash defaults (gpm/ft²) ──
//
// Sand: 12-15 gpm/ft² to fluidize bed. Glass: similar to sand.
// DE: backwash via bumping/recharge (~2 gpm/ft²). Cartridge: not backwashed.

const BACKWASH_RATE_BY_MEDIA: Record<FilterMediaType, number> = {
  Sand:          15,
  'Glass Media': 14,
  DE:            2,
  Cartridge:     0,
};

/**
 * Pick a default design rate for the given media + pool type. We classify
 * pools into three buckets matching ANSI/APSP recommendations:
 *
 *   - Residential / private spas       → residential
 *   - Class A/B (public/competition)   → commercial
 *   - everything else (Class C/D/F/H,
 *     instructional, semi-public)      → light commercial
 */
export function defaultDesignRate(media: FilterMediaType | null, poolUseType: string | null): number {
  if (!media) return 15;
  const rates = DESIGN_RATE_BY_MEDIA[media];
  const pt = getPoolType(poolUseType);
  if (!pt) return rates.lightCommercial;
  if (pt.id === 'Residential' || pt.id === 'Residential Spa') return rates.residential;
  if (pt.ispscClass === 'Class A' || pt.ispscClass === 'Class B') return rates.commercial;
  return rates.lightCommercial;
}

export function defaultBackwashRate(media: FilterMediaType | null): number {
  if (!media) return 15;
  return BACKWASH_RATE_BY_MEDIA[media];
}

export function calculateFilterSizing(inputs: FilterSizingInputs): FilterSizingResult {
  const flowRateDesign =
    inputs.flowRateDesignGpmPerSf ?? defaultDesignRate(inputs.mediaType, inputs.poolUseType);
  const safeDesign = flowRateDesign > 0 ? flowRateDesign : 1;
  const filterAreaRequiredSf = Math.max(0, inputs.recirculationGpm) / safeDesign;

  const perFilter = Math.max(0, inputs.perFilterAreaSf);
  const count = Math.max(0, Math.floor(inputs.filterCount));
  const filterAreaActualSf = perFilter * count;
  const filterRateActualGpmPerSf =
    filterAreaActualSf > 0 ? inputs.recirculationGpm / filterAreaActualSf : 0;
  const meetsDesignRate =
    filterAreaActualSf > 0 && filterRateActualGpmPerSf <= flowRateDesign;

  const backwashRate =
    inputs.backwashRateGpmPerSf ?? defaultBackwashRate(inputs.mediaType);
  const backwashFlowPerFilterGpm = backwashRate * perFilter;

  const retentionTime = Math.max(0, inputs.retentionTimeMin);
  const retentionRequiredGallons = backwashFlowPerFilterGpm * retentionTime;

  const L = Math.max(0, inputs.retentionPitLengthFt);
  const W = Math.max(0, inputs.retentionPitWidthFt);
  const D = Math.max(0, inputs.retentionPitDepthFt);
  const retentionActualGallons = L * W * D * CF_TO_GALLONS;
  const retentionMeetsRequirement =
    retentionRequiredGallons === 0 || retentionActualGallons >= retentionRequiredGallons;

  return {
    flowRateDesignGpmPerSf: flowRateDesign,
    filterAreaRequiredSf,
    filterAreaActualSf,
    filterRateActualGpmPerSf,
    meetsDesignRate,
    backwashRateGpmPerSf: backwashRate,
    backwashFlowPerFilterGpm,
    retentionRequiredGallons,
    retentionActualGallons,
    retentionMeetsRequirement,
  };
}
