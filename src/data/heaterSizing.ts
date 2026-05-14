/**
 * Heater Sizing — calculation helpers and local climate defaults.
 *
 * First pass uses editable local defaults by city/state. A future weather API
 * can replace `getDefaultHeaterClimate` without touching the rest of the module.
 */

// ── Types ──

export type HeaterScenario = 'coldest-month' | 'shoulder-season';

export interface ClimateDefaults {
  ambientTempF: number;
  windMph: number;
  fillWaterTempF: number;
}

export interface HeaterSizingInputs {
  volumeGallons: number;
  surfaceAreaSf: number;
  startTempF: number;
  targetTempF: number;
  ambientTempF: number;
  windMph: number;
  heatUpDays: number;
  efficiencyPct: number;
  environment: 'indoor' | 'outdoor';
}

export interface HeaterSizingResult {
  /** Gross heat-up load in BTU/hr (before efficiency). */
  grossBtuHr: number;
  /** Required heater output in BTU/hr (larger of heat-up load vs surface loss). */
  requiredBtuHr: number;
  /** Estimated surface heat loss in BTU/hr (ASHRAE-simplified). */
  surfaceLossBtuHr: number;
  /** Total BTU/hr the heater must deliver (max of heat-up vs surface loss, before efficiency). */
  totalBtuHr: number;
}

export interface HeaterComparison {
  sizeBtu: number;
  label: string;
  heatUpDays: number;
  meetsTarget: boolean;
  verdict: string;
  relativeCost: 'Low' | 'Medium' | 'High' | 'Very High';
}

// ── Standard heater sizes ──

export const STANDARD_HEATER_SIZES = [
  { sizeBtu: 200_000, label: '200k BTU', relativeCost: 'Low' as const },
  { sizeBtu: 400_000, label: '400k BTU', relativeCost: 'Medium' as const },
  { sizeBtu: 800_000, label: '800k BTU', relativeCost: 'High' as const },
  { sizeBtu: 1_000_000, label: '1M BTU', relativeCost: 'Very High' as const },
];

// ── Climate defaults by location ──

interface CityClimate {
  coldest: ClimateDefaults;
  shoulder: ClimateDefaults;
}

const CLIMATE_TABLE: Record<string, CityClimate> = {
  'dallas-tx': {
    coldest: { ambientTempF: 36, windMph: 10, fillWaterTempF: 55 },
    shoulder: { ambientTempF: 55, windMph: 6, fillWaterTempF: 62 },
  },
  'houston-tx': {
    coldest: { ambientTempF: 42, windMph: 9, fillWaterTempF: 60 },
    shoulder: { ambientTempF: 60, windMph: 5, fillWaterTempF: 66 },
  },
  'phoenix-az': {
    coldest: { ambientTempF: 46, windMph: 5, fillWaterTempF: 62 },
    shoulder: { ambientTempF: 65, windMph: 4, fillWaterTempF: 70 },
  },
  'miami-fl': {
    coldest: { ambientTempF: 60, windMph: 8, fillWaterTempF: 72 },
    shoulder: { ambientTempF: 72, windMph: 6, fillWaterTempF: 76 },
  },
};

const FALLBACK_CLIMATE: CityClimate = {
  coldest: { ambientTempF: 40, windMph: 8, fillWaterTempF: 55 },
  shoulder: { ambientTempF: 58, windMph: 5, fillWaterTempF: 62 },
};

function cityKey(city: string, state: string): string {
  return `${city.toLowerCase().trim()}-${state.toLowerCase().trim()}`;
}

export function getDefaultHeaterClimate(
  projectCity: string,
  projectState: string,
  scenario: HeaterScenario,
): ClimateDefaults {
  const key = cityKey(projectCity, projectState);
  const entry = CLIMATE_TABLE[key] ?? FALLBACK_CLIMATE;
  return scenario === 'coldest-month' ? entry.coldest : entry.shoulder;
}

// ── Core calculations ──

const LBS_PER_GALLON = 8.34;

/**
 * ASHRAE-simplified surface evaporation/convection loss for an outdoor pool.
 * Q = A * (95 + 0.425 * V) * (pw - pa)  where V = wind in ft/min.
 *
 * Uses a simplified vapor-pressure delta based on water vs air temp.
 * For indoor pools, wind is near-zero and the loss is much smaller.
 */
function estimateSurfaceLoss(
  surfaceAreaSf: number,
  waterTempF: number,
  ambientTempF: number,
  windMph: number,
  environment: 'indoor' | 'outdoor',
): number {
  if (surfaceAreaSf <= 0) return 0;
  const windFpm = environment === 'indoor' ? 10 : windMph * 88;

  // Simplified saturated vapor pressure approximation (in Hg).
  const vpWater = Math.exp((17.27 * ((waterTempF - 32) / 1.8)) / (((waterTempF - 32) / 1.8) + 237.3)) * 0.4912 / 25.4;
  const vpAir = Math.exp((17.27 * ((ambientTempF - 32) / 1.8)) / (((ambientTempF - 32) / 1.8) + 237.3)) * 0.4912 / 25.4;
  const vpDelta = Math.max(0, vpWater - vpAir);

  return surfaceAreaSf * (95 + 0.425 * windFpm) * vpDelta;
}

export function calculateHeaterSizing(inputs: HeaterSizingInputs): HeaterSizingResult {
  const {
    volumeGallons,
    surfaceAreaSf,
    startTempF,
    targetTempF,
    ambientTempF,
    windMph,
    heatUpDays,
    environment,
  } = inputs;

  const deltaT = Math.max(0, targetTempF - startTempF);
  const heatUpHours = Math.max(1, heatUpDays * 24);

  // Gross heat-up load: raise the entire volume by deltaT over heatUpHours.
  const grossBtuHr = (volumeGallons * LBS_PER_GALLON * deltaT) / heatUpHours;

  // Surface heat loss at the midpoint temperature during heat-up.
  const midTemp = startTempF + deltaT / 2;
  const surfaceLossBtuHr = estimateSurfaceLoss(surfaceAreaSf, midTemp, ambientTempF, windMph, environment);

  // Required output: greater of heat-up load vs surface loss (not sum of both loads).
  const requiredBtuHr = Math.ceil(Math.max(grossBtuHr, surfaceLossBtuHr));

  return {
    grossBtuHr: Math.round(grossBtuHr),
    surfaceLossBtuHr: Math.round(surfaceLossBtuHr),
    requiredBtuHr,
  /** Total BTU/hr before efficiency — max of heat-up vs surface loss (not additive). */
  totalBtuHr: Math.round(Math.max(grossBtuHr, surfaceLossBtuHr)),
  };
}

// ── Heater comparison ──

export function estimateHeatUpDays(
  heaterBtu: number,
  inputs: HeaterSizingInputs,
): number {
  if (heaterBtu <= 0) return Infinity;
  const deltaT = Math.max(0, inputs.targetTempF - inputs.startTempF);
  const efficiency = Math.max(0.1, inputs.efficiencyPct / 100);

  const midTemp = inputs.startTempF + deltaT / 2;
  const surfaceLoss = estimateSurfaceLoss(
    inputs.surfaceAreaSf,
    midTemp,
    inputs.ambientTempF,
    inputs.windMph,
    inputs.environment,
  );

  const netHeating = heaterBtu * efficiency - surfaceLoss;
  if (netHeating <= 0) return Infinity;

  const totalBtu = inputs.volumeGallons * LBS_PER_GALLON * deltaT;
  const hours = totalBtu / netHeating;
  return hours / 24;
}

export function compareHeaterSizes(
  inputs: HeaterSizingInputs,
): HeaterComparison[] {
  return STANDARD_HEATER_SIZES.map((size) => {
    const days = estimateHeatUpDays(size.sizeBtu, inputs);
    const meetsTarget = Number.isFinite(days) && days <= inputs.heatUpDays;
    let verdict: string;
    if (!Number.isFinite(days)) {
      verdict = 'Cannot overcome heat loss';
    } else if (days <= inputs.heatUpDays * 0.5) {
      verdict = 'Exceeds target';
    } else if (meetsTarget) {
      verdict = `Meets ${inputs.heatUpDays}-day target`;
    } else {
      verdict = `${days.toFixed(1)} days — too slow`;
    }
    return {
      sizeBtu: size.sizeBtu,
      label: size.label,
      heatUpDays: Number.isFinite(days) ? Math.round(days * 10) / 10 : Infinity,
      meetsTarget,
      verdict,
      relativeCost: size.relativeCost,
    };
  });
}

/**
 * Pick the smallest standard heater that meets the heat-up target.
 * Falls back to the largest if none meets it.
 */
export function recommendHeaterSize(inputs: HeaterSizingInputs): HeaterComparison {
  const comparisons = compareHeaterSizes(inputs);
  return comparisons.find((c) => c.meetsTarget) ?? comparisons[comparisons.length - 1];
}
