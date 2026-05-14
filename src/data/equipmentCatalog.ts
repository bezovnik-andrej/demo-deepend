/**
 * Local equipment catalogue — representative products for each brand
 * in the brands.ts catalogue. Used by the Engineering Equipment Options
 * panel to show manufacturers/models that meet project requirements.
 */

// ── Types ──

export type EquipmentKind = 'pump' | 'filter' | 'heater';

export interface PumpProduct {
  kind: 'pump';
  id: string;
  brand: string;
  model: string;
  partNo: string;
  maxFlowGpm: number;
  hp: number;
  voltage: string;
  variableSpeed: boolean;
  price: number;
}

export type FilterMediaType = 'Sand' | 'Cartridge' | 'DE' | 'Glass Media';

export interface FilterProduct {
  kind: 'filter';
  id: string;
  brand: string;
  model: string;
  partNo: string;
  mediaType: FilterMediaType;
  filterAreaSqFt: number;
  maxFlowGpm: number;
  backwashGpm: number;
  price: number;
}

export type HeaterSystemType = 'Gas Heater' | 'Heat Pump' | 'Electric' | 'Solar';

export interface HeaterProduct {
  kind: 'heater';
  id: string;
  brand: string;
  model: string;
  partNo: string;
  systemType: HeaterSystemType;
  outputBtuHr: number;
  efficiencyPct: number;
  fuelType: string;
  price: number;
}

export type CatalogProduct = PumpProduct | FilterProduct | HeaterProduct;

// ── Catalogue Data ──

export const PUMP_CATALOG: PumpProduct[] = [
  { kind: 'pump', id: 'pump-pen-vsf3', brand: 'Pentair', model: 'IntelliFlo VSF 3HP', partNo: 'PMP-VS3', maxFlowGpm: 160, hp: 3, voltage: '230V/1ph', variableSpeed: true, price: 2800 },
  { kind: 'pump', id: 'pump-pen-vsf5', brand: 'Pentair', model: 'IntelliFlo VSF 5HP', partNo: 'PMP-VS5', maxFlowGpm: 230, hp: 5, voltage: '230V/1ph', variableSpeed: true, price: 3400 },
  { kind: 'pump', id: 'pump-pen-comm10', brand: 'Pentair', model: 'EQ Series 10HP', partNo: 'PMP-EQ10', maxFlowGpm: 450, hp: 10, voltage: '208-230V/3ph', variableSpeed: false, price: 5200 },
  { kind: 'pump', id: 'pump-hay-vs3', brand: 'Hayward', model: 'TriStar VS 950', partNo: 'SP3206VSP', maxFlowGpm: 155, hp: 2.7, voltage: '230V/1ph', variableSpeed: true, price: 2600 },
  { kind: 'pump', id: 'pump-hay-super2', brand: 'Hayward', model: 'Super II 3HP', partNo: 'SP3025X30', maxFlowGpm: 190, hp: 3, voltage: '208-230V/1ph', variableSpeed: false, price: 1400 },
  { kind: 'pump', id: 'pump-hay-hcp4', brand: 'Hayward', model: 'HCP 4000 5HP', partNo: 'HCP40503', maxFlowGpm: 280, hp: 5, voltage: '208-230V/3ph', variableSpeed: false, price: 3200 },
  { kind: 'pump', id: 'pump-jan-fhpm25', brand: 'Jandy', model: 'FloPro 2.5HP', partNo: 'FHPM25', maxFlowGpm: 140, hp: 2.5, voltage: '230V/1ph', variableSpeed: false, price: 1200 },
  { kind: 'pump', id: 'pump-jan-epump', brand: 'Jandy', model: 'ePump 3.8HP VS', partNo: 'VSSHP270AUT', maxFlowGpm: 200, hp: 3.8, voltage: '230V/1ph', variableSpeed: true, price: 3100 },
  { kind: 'pump', id: 'pump-ww-svl56', brand: 'Waterway', model: 'SVL56 2.5HP', partNo: 'SVL56E-125', maxFlowGpm: 130, hp: 2.5, voltage: '230V/1ph', variableSpeed: false, price: 900 },
  { kind: 'pump', id: 'pump-ww-champ3', brand: 'Waterway', model: 'Champion 3HP', partNo: 'DERA-233', maxFlowGpm: 175, hp: 3, voltage: '230V/1ph', variableSpeed: false, price: 1100 },
  { kind: 'pump', id: 'pump-sr-max5', brand: 'Sta-Rite', model: 'Max-E-Pro 5HP', partNo: 'P6E6H-209L', maxFlowGpm: 240, hp: 5, voltage: '208-230V/3ph', variableSpeed: false, price: 2900 },
  { kind: 'pump', id: 'pump-sr-intelli', brand: 'Sta-Rite', model: 'IntelliPro VS 3HP', partNo: 'P6E6XS4H-209L', maxFlowGpm: 160, hp: 3, voltage: '230V/1ph', variableSpeed: true, price: 2700 },
];

export const FILTER_CATALOG: FilterProduct[] = [
  // Sand
  { kind: 'filter', id: 'flt-pen-tr60', brand: 'Pentair', model: 'Triton II TR60', partNo: 'FLT-TR60', mediaType: 'Sand', filterAreaSqFt: 4.9, maxFlowGpm: 120, backwashGpm: 85, price: 1200 },
  { kind: 'filter', id: 'flt-pen-tr100', brand: 'Pentair', model: 'Triton II TR100', partNo: 'FLT-TR100', mediaType: 'Sand', filterAreaSqFt: 7.1, maxFlowGpm: 180, backwashGpm: 130, price: 1800 },
  { kind: 'filter', id: 'flt-pen-tr140', brand: 'Pentair', model: 'Triton II TR140', partNo: 'FLT-TR140', mediaType: 'Sand', filterAreaSqFt: 9.8, maxFlowGpm: 250, backwashGpm: 180, price: 2600 },
  { kind: 'filter', id: 'flt-hay-s310t', brand: 'Hayward', model: 'Pro-Series S310T', partNo: 'S310T2', mediaType: 'Sand', filterAreaSqFt: 5.1, maxFlowGpm: 125, backwashGpm: 90, price: 1100 },
  { kind: 'filter', id: 'flt-hay-s360sl', brand: 'Hayward', model: 'Pro-Series S360SL', partNo: 'S360SL', mediaType: 'Sand', filterAreaSqFt: 7.9, maxFlowGpm: 200, backwashGpm: 140, price: 1700 },
  { kind: 'filter', id: 'flt-hay-hcf434', brand: 'Hayward', model: 'HCF Series 34"', partNo: 'HCF434C', mediaType: 'Sand', filterAreaSqFt: 12.6, maxFlowGpm: 315, backwashGpm: 225, price: 4200 },
  { kind: 'filter', id: 'flt-jan-js100', brand: 'Jandy', model: 'JS100-SM', partNo: 'JS100-SM', mediaType: 'Sand', filterAreaSqFt: 5.3, maxFlowGpm: 130, backwashGpm: 95, price: 1150 },
  { kind: 'filter', id: 'flt-ww-czar', brand: 'Waterway', model: 'ClearWater II 26"', partNo: 'FS02619-4', mediaType: 'Sand', filterAreaSqFt: 3.1, maxFlowGpm: 90, backwashGpm: 60, price: 750 },
  { kind: 'filter', id: 'flt-sr-s8s70', brand: 'Sta-Rite', model: 'System 3 S8S70', partNo: 'S8S70', mediaType: 'Sand', filterAreaSqFt: 4.8, maxFlowGpm: 110, backwashGpm: 80, price: 1050 },
  // Cartridge
  { kind: 'filter', id: 'flt-pen-cc420', brand: 'Pentair', model: 'Clean & Clear Plus 420', partNo: 'FLT-CC420', mediaType: 'Cartridge', filterAreaSqFt: 420 / 45, maxFlowGpm: 150, backwashGpm: 0, price: 680 },
  { kind: 'filter', id: 'flt-pen-cc520', brand: 'Pentair', model: 'Clean & Clear Plus 520', partNo: 'FLT-CC520', mediaType: 'Cartridge', filterAreaSqFt: 520 / 45, maxFlowGpm: 200, backwashGpm: 0, price: 820 },
  { kind: 'filter', id: 'flt-hay-cx1750', brand: 'Hayward', model: 'SwimClear C5030', partNo: 'C5030', mediaType: 'Cartridge', filterAreaSqFt: 525 / 45, maxFlowGpm: 210, backwashGpm: 0, price: 850 },
  { kind: 'filter', id: 'flt-jan-cv460', brand: 'Jandy', model: 'CV460', partNo: 'CV460', mediaType: 'Cartridge', filterAreaSqFt: 460 / 45, maxFlowGpm: 170, backwashGpm: 0, price: 740 },
  // DE
  { kind: 'filter', id: 'flt-pen-de60', brand: 'Pentair', model: 'FNS Plus 60', partNo: 'FLT-DE60', mediaType: 'DE', filterAreaSqFt: 60 / 9, maxFlowGpm: 120, backwashGpm: 90, price: 1900 },
  { kind: 'filter', id: 'flt-pen-de72', brand: 'Pentair', model: 'FNS Plus 72', partNo: 'FLT-DE72', mediaType: 'DE', filterAreaSqFt: 72 / 9, maxFlowGpm: 150, backwashGpm: 110, price: 2400 },
  { kind: 'filter', id: 'flt-hay-de4820', brand: 'Hayward', model: 'ProGrid DE4820', partNo: 'DE4820', mediaType: 'DE', filterAreaSqFt: 48 / 9, maxFlowGpm: 96, backwashGpm: 70, price: 1600 },
  { kind: 'filter', id: 'flt-hay-de7220', brand: 'Hayward', model: 'ProGrid DE7220', partNo: 'DE7220', mediaType: 'DE', filterAreaSqFt: 72 / 9, maxFlowGpm: 145, backwashGpm: 105, price: 2300 },
  // Glass Media (uses same housings as sand, higher capacity per sq ft)
  { kind: 'filter', id: 'flt-pen-tr100g', brand: 'Pentair', model: 'Triton II TR100 Glass', partNo: 'FLT-TR100G', mediaType: 'Glass Media', filterAreaSqFt: 7.1, maxFlowGpm: 200, backwashGpm: 120, price: 3200 },
  { kind: 'filter', id: 'flt-hay-s360g', brand: 'Hayward', model: 'Pro-Series S360SL Glass', partNo: 'S360SLG', mediaType: 'Glass Media', filterAreaSqFt: 7.9, maxFlowGpm: 220, backwashGpm: 130, price: 3400 },
];

export const HEATER_CATALOG: HeaterProduct[] = [
  // Gas Heaters
  { kind: 'heater', id: 'htr-pen-mm200', brand: 'Pentair', model: 'MasterTemp 200', partNo: 'HTR-MT200', systemType: 'Gas Heater', outputBtuHr: 200_000, efficiencyPct: 84, fuelType: 'Natural Gas', price: 2400 },
  { kind: 'heater', id: 'htr-pen-mm400', brand: 'Pentair', model: 'MasterTemp 400', partNo: 'HTR-MT400', systemType: 'Gas Heater', outputBtuHr: 400_000, efficiencyPct: 84, fuelType: 'Natural Gas', price: 3800 },
  { kind: 'heater', id: 'htr-pen-max1m', brand: 'Pentair', model: 'Max-E-Therm 1000', partNo: 'HTR-MX1000', systemType: 'Gas Heater', outputBtuHr: 1_000_000, efficiencyPct: 89, fuelType: 'Natural Gas', price: 8500 },
  { kind: 'heater', id: 'htr-hay-h250', brand: 'Hayward', model: 'Universal H-Series H250', partNo: 'H250FDN', systemType: 'Gas Heater', outputBtuHr: 250_000, efficiencyPct: 83, fuelType: 'Natural Gas', price: 2800 },
  { kind: 'heater', id: 'htr-hay-h400', brand: 'Hayward', model: 'Universal H-Series H400', partNo: 'H400FDN', systemType: 'Gas Heater', outputBtuHr: 400_000, efficiencyPct: 83, fuelType: 'Natural Gas', price: 4000 },
  { kind: 'heater', id: 'htr-jan-lt400', brand: 'Jandy', model: 'LXi 400', partNo: 'LXI400N', systemType: 'Gas Heater', outputBtuHr: 400_000, efficiencyPct: 87, fuelType: 'Natural Gas', price: 4200 },
  { kind: 'heater', id: 'htr-ray-406a', brand: 'Raypak', model: '406A', partNo: 'RAY-406A', systemType: 'Gas Heater', outputBtuHr: 399_000, efficiencyPct: 83, fuelType: 'Natural Gas', price: 3600 },
  { kind: 'heater', id: 'htr-ray-r406a', brand: 'Raypak', model: 'R406A Digital', partNo: 'RAY-R406A', systemType: 'Gas Heater', outputBtuHr: 399_000, efficiencyPct: 84, fuelType: 'Natural Gas', price: 3900 },
  { kind: 'heater', id: 'htr-ray-2100', brand: 'Raypak', model: 'XTherm 2100', partNo: 'RAY-2100', systemType: 'Gas Heater', outputBtuHr: 2_100_000, efficiencyPct: 85, fuelType: 'Natural Gas', price: 18000 },
  { kind: 'heater', id: 'htr-ray-1050', brand: 'Raypak', model: 'XTherm 1050', partNo: 'RAY-1050', systemType: 'Gas Heater', outputBtuHr: 1_050_000, efficiencyPct: 85, fuelType: 'Natural Gas', price: 11000 },
  // Heat Pumps
  { kind: 'heater', id: 'htr-pen-uc125', brand: 'Pentair', model: 'UltraTemp 125', partNo: 'HTR-UT125', systemType: 'Heat Pump', outputBtuHr: 125_000, efficiencyPct: 500, fuelType: 'Electric (COP 5.0)', price: 5200 },
  { kind: 'heater', id: 'htr-hay-hp50', brand: 'Hayward', model: 'HeatPro HP50HA', partNo: 'HP50HA2', systemType: 'Heat Pump', outputBtuHr: 110_000, efficiencyPct: 480, fuelType: 'Electric (COP 4.8)', price: 4800 },
  { kind: 'heater', id: 'htr-jan-aep', brand: 'Jandy', model: 'AE-Ti Heat Pump', partNo: 'AE-TI-HP', systemType: 'Heat Pump', outputBtuHr: 130_000, efficiencyPct: 510, fuelType: 'Electric (COP 5.1)', price: 5500 },
  { kind: 'heater', id: 'htr-zod-zs500', brand: 'Zodiac', model: 'Z500 Heat Pump', partNo: 'ZOD-Z500', systemType: 'Heat Pump', outputBtuHr: 140_000, efficiencyPct: 520, fuelType: 'Electric (COP 5.2)', price: 5800 },
  // Electric
  { kind: 'heater', id: 'htr-pen-elec11', brand: 'Pentair', model: 'Electric 11kW', partNo: 'HTR-E11', systemType: 'Electric', outputBtuHr: 37_500, efficiencyPct: 99, fuelType: 'Electric', price: 1800 },
  { kind: 'heater', id: 'htr-hay-elec18', brand: 'Hayward', model: 'CSPAXI Electric 18kW', partNo: 'CSPAXI18', systemType: 'Electric', outputBtuHr: 61_000, efficiencyPct: 99, fuelType: 'Electric', price: 2200 },
];

// ── Matching helpers ──

export interface EquipmentRequirements {
  designGpm: number;
  requiredBtuHr: number;
  filtrationType: string | null;
  heatingSystemTypes: string[];
}

export function matchingPumps(
  requirements: EquipmentRequirements,
  brandFilter?: string | null,
): PumpProduct[] {
  let results = PUMP_CATALOG.filter((p) => p.maxFlowGpm >= requirements.designGpm);
  if (brandFilter) {
    results = results.filter((p) => p.brand === brandFilter);
  }
  return results.sort((a, b) => a.maxFlowGpm - b.maxFlowGpm);
}

export function matchingFilters(
  requirements: EquipmentRequirements,
  brandFilter?: string | null,
  mediaFilter?: FilterMediaType | null,
): FilterProduct[] {
  let results = FILTER_CATALOG.filter((f) => f.maxFlowGpm >= requirements.designGpm);
  const media = mediaFilter ?? requirements.filtrationType;
  if (media) {
    results = results.filter((f) => f.mediaType === media);
  }
  if (brandFilter) {
    results = results.filter((f) => f.brand === brandFilter);
  }
  return results.sort((a, b) => a.filterAreaSqFt - b.filterAreaSqFt);
}

export function matchingHeaters(
  requirements: EquipmentRequirements,
  brandFilter?: string | null,
  systemFilter?: HeaterSystemType | null,
): HeaterProduct[] {
  let results = HEATER_CATALOG.filter((h) => h.outputBtuHr >= requirements.requiredBtuHr);
  const systems = systemFilter
    ? [systemFilter]
    : requirements.heatingSystemTypes.filter((s) => s !== 'None' && s !== 'Solar');
  if (systems.length > 0) {
    results = results.filter((h) => systems.includes(h.systemType));
  }
  if (brandFilter) {
    results = results.filter((h) => h.brand === brandFilter);
  }
  return results.sort((a, b) => a.outputBtuHr - b.outputBtuHr);
}

/** Return all products that do NOT meet the requirement (for "show all" mode). */
export function allPumps(brandFilter?: string | null): PumpProduct[] {
  if (!brandFilter) return [...PUMP_CATALOG].sort((a, b) => a.maxFlowGpm - b.maxFlowGpm);
  return PUMP_CATALOG.filter((p) => p.brand === brandFilter).sort((a, b) => a.maxFlowGpm - b.maxFlowGpm);
}

export function allFilters(brandFilter?: string | null, mediaFilter?: FilterMediaType | null): FilterProduct[] {
  let results = [...FILTER_CATALOG];
  if (mediaFilter) results = results.filter((f) => f.mediaType === mediaFilter);
  if (brandFilter) results = results.filter((f) => f.brand === brandFilter);
  return results.sort((a, b) => a.filterAreaSqFt - b.filterAreaSqFt);
}

export function allHeaters(brandFilter?: string | null, systemFilter?: HeaterSystemType | null): HeaterProduct[] {
  let results = [...HEATER_CATALOG];
  if (systemFilter) results = results.filter((h) => h.systemType === systemFilter);
  if (brandFilter) results = results.filter((h) => h.brand === brandFilter);
  return results.sort((a, b) => a.outputBtuHr - b.outputBtuHr);
}
