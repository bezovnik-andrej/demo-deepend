/**
 * Estimated total dynamic head (TDH) from configurator / engineering inputs.
 * Uses Hazen–Williams friction for PVC (C=150), heuristic pipe run lengths scaled
 * from surface area, static lift from average depth, and typical clean-filter
 * + heater allowances. Use for sizing displays — not a substitute for full hydraulic calcs.
 */

export const GPM_TO_CFS = 1 / 448.831;

/** Schedule 40 PVC IDs (in) for nominal sizes used in pipe sizing UI. */
export const SCHEDULE40_IDS: { nominal: string; idIn: number }[] = [
  { nominal: '1.5"', idIn: 1.61 },
  { nominal: '2"', idIn: 2.067 },
  { nominal: '2.5"', idIn: 2.469 },
  { nominal: '3"', idIn: 3.068 },
  { nominal: '4"', idIn: 4.026 },
];

/** Defaults for Engineering / pipe-sizing panel when project overrides are null. */
export const DEFAULT_DESIGN_SUCTION_FPS = 5;
export const DEFAULT_DESIGN_RETURN_FPS = 8;

export function requiredInnerDiameterInches(gpm: number, velocityFps: number): number {
  const q = gpm * GPM_TO_CFS;
  const areaFt2 = q / velocityFps;
  return 2 * Math.sqrt(areaFt2 / Math.PI) * 12;
}

export function pickNominalPipe(requiredDiameterIn: number): { nominal: string; idIn: number } {
  const found = SCHEDULE40_IDS.find((p) => p.idIn >= requiredDiameterIn);
  return found ?? SCHEDULE40_IDS[SCHEDULE40_IDS.length - 1];
}

export function velocityFromGpmAndIdIn(gpm: number, idIn: number): number {
  const q = gpm * GPM_TO_CFS;
  const rFt = idIn / 24 / 2;
  const areaFt2 = Math.PI * rFt * rFt;
  return q / areaFt2;
}

/** Head loss (ft) for one pipe run — Hazen–Williams, full circular pipe, US customary units. */
export function hazenWilliamsHeadLossFt(
  gpm: number,
  idInches: number,
  lengthFt: number,
  hazenRoughness = 150,
): number {
  if (lengthFt <= 0 || idInches <= 0 || gpm <= 0) return 0;
  const dFt = idInches / 12;
  const v = velocityFromGpmAndIdIn(gpm, idInches);
  const r = dFt / 4;
  const denom = 1.318 * hazenRoughness * Math.pow(r, 0.63);
  if (denom <= 0) return 0;
  const sRaw = v / denom;
  const S = Math.pow(sRaw, 1 / 0.54);
  return S * lengthFt;
}

/** Typical clean-bed pressure for filter class (ft of water), when no vendor curve exists. */
export function filterCleanBedHeadFt(filtrationType: string | null): number {
  if (!filtrationType) return 20;
  const t = filtrationType.toLowerCase();
  if (t.includes('cartridge')) return 12;
  if (t.includes('de') || t.includes('d.e')) return 24;
  if (t.includes('sand')) return 18;
  return 18;
}

export interface TdhEstimateInputs {
  designGpm: number;
  suctionIdIn: number;
  returnIdIn: number;
  /** Average pool depth (ft) from volume calculator. */
  averageDepthFt: number;
  surfaceAreaSqFt: number;
  filtrationType: string | null;
  hasHeater: boolean;
}

/**
 * Representative developed length (ft) for suction / return main from pool to pad,
 * scaled from footprint when no as-built lengths are stored.
 */
function representativePipeLengthFt(surfaceAreaSqFt: number): number {
  if (surfaceAreaSqFt <= 0) return 80;
  const span = Math.sqrt(surfaceAreaSqFt);
  return Math.min(220, Math.max(55, Math.round(28 + span * 1.35)));
}

/** Static lift (ft): water surface to pump — heuristic from average depth + pad elevation. */
function staticLiftFt(averageDepthFt: number): number {
  if (!Number.isFinite(averageDepthFt) || averageDepthFt <= 0) return 12;
  return Math.round((6 + averageDepthFt * 0.45) * 10) / 10;
}

/** Fittings allowance as equivalent feet added to friction legs. */
const FITTING_ALLOWANCE_FT = 8;

export function estimateTotalDynamicHeadFt(inputs: TdhEstimateInputs): number {
  const {
    designGpm,
    suctionIdIn,
    returnIdIn,
    averageDepthFt,
    surfaceAreaSqFt,
    filtrationType,
    hasHeater,
  } = inputs;

  if (designGpm <= 0 || suctionIdIn <= 0 || returnIdIn <= 0) return 0;

  const runLen = representativePipeLengthFt(surfaceAreaSqFt);
  const suctionFriction = hazenWilliamsHeadLossFt(designGpm, suctionIdIn, runLen + FITTING_ALLOWANCE_FT);
  const returnFriction = hazenWilliamsHeadLossFt(designGpm, returnIdIn, runLen + FITTING_ALLOWANCE_FT);

  const staticH = staticLiftFt(averageDepthFt);
  const filterH = filterCleanBedHeadFt(filtrationType);
  const heaterH = hasHeater ? 3.5 : 0;
  const miscH = 4;

  const total = staticH + filterH + heaterH + miscH + suctionFriction + returnFriction;
  return Math.round(total * 10) / 10;
}

/**
 * Pipe rows that match the Engineering pipe-sizing panel (for TDH + display).
 */
export function pipesForDesignFlow(
  designGpm: number,
  designSuctionFps?: number | null,
  designReturnFps?: number | null,
): { suction: { nominal: string; idIn: number }; return: { nominal: string; idIn: number } } {
  const sFps = designSuctionFps ?? DEFAULT_DESIGN_SUCTION_FPS;
  const rFps = designReturnFps ?? DEFAULT_DESIGN_RETURN_FPS;
  const suction = pickNominalPipe(requiredInnerDiameterInches(designGpm, sFps));
  const ret = pickNominalPipe(requiredInnerDiameterInches(designGpm, rFps));
  return { suction, return: ret };
}
