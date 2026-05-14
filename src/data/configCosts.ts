/**
 * Estimated material cost per config option. Rough catalog numbers
 * for comparative display — not linked to actual BOM prices yet.
 */

interface OptionCost {
  cost: number;
  note?: string;
  /** Material cost per linear foot (when applicable). */
  materialCostPerLf?: number;
  /** Labor cost per linear foot (when applicable). */
  laborCostPerLf?: number;
  /** Coping / element width (e.g. "12\"") when relevant. */
  width?: string;
}

type StepCosts = Record<string, Record<string, OptionCost>>;

const COSTS: StepCosts = {
  /**
   * Pool use type — rough cost-of-build benchmarks per ISPSC classification.
   * Brett's 19-type list (Apr 13.2026). Numbers are rough order-of-magnitude.
   */
  poolUseType: {
    'Competition Pool':     { cost: 185000, note: 'Sanctioned competition facility' },
    'Public Pool':          { cost: 140000, note: 'Class B public pool' },
    'Semi-Public Pool':     { cost: 120000, note: 'HOA / club pool' },
    'Wave Pool':            { cost: 850000, note: 'Large wave pool ≥20k SF' },
    'Surf/Wave Small':      { cost: 320000, note: 'Small surf / wave pool' },
    'Activity Pool Shallow':{ cost: 95000,  note: 'Shallow activity pool' },
    'Activity Pool':        { cost: 130000, note: 'Activity pool' },
    'Slide Pool':           { cost: 105000, note: 'Plunge pool for slides' },
    'Leisure River':        { cost: 240000, note: 'Lazy river' },
    'Vortex Pool':          { cost: 95000,  note: 'Vortex / current pool' },
    'Interactive Play':     { cost: 180000, note: 'Splash pad / spray ground' },
    'Spa / Hot Tub':        { cost: 38000,  note: 'Commercial spa' },
    'Wading Pool':          { cost: 55000,  note: 'Toddler / kiddie pool' },
    'Therapeutic Small':    { cost: 65000,  note: 'Rehab / hydrotherapy' },
    'Instructional Pool':   { cost: 110000, note: 'Lessons / training' },
    'Residential':          { cost: 45000,  note: 'Typical residential build' },
    'Residential Spa':      { cost: 14000,  note: 'Private home spa' },
    'Fountain':             { cost: 28000,  note: 'Decorative fountain' },
    'Other':                { cost: 0 },
  },
  /**
   * Pool Recirculation — per-linear-foot cost (Travis May 9.2026).
   * `cost` is `materialCostPerLf + laborCostPerLf`; the per-LF split is what
   * the configurator shows and what Estimate uses to compute total = perimeter × cost.
   */
  gutterStyle: {
    /* Skimmer family */
    'coping-no-skimmers':      { cost: 45,  materialCostPerLf: 30,  laborCostPerLf: 15, note: 'Coping, no skimmers' },
    'skimmer-12-coping':       { cost: 150, materialCostPerLf: 100, laborCostPerLf: 50, width: '12"', note: 'Skimmer with 12" coping' },
    'skimmer-18-coping':       { cost: 160, materialCostPerLf: 110, laborCostPerLf: 50, width: '18"', note: 'Skimmer with 18" coping' },
    'no-gutter-splash-pad':    { cost: 0,   materialCostPerLf: 0,   laborCostPerLf: 0,  note: 'No gutter — splash pad' },
    /* Gutter — Stainless Steel family */
    'ss-deck-level-weirs':     { cost: 180, materialCostPerLf: 140, laborCostPerLf: 40, note: 'SS deck-level with weirs' },
    'ss-deck-level':           { cost: 215, materialCostPerLf: 175, laborCostPerLf: 40, note: 'SS deck-level' },
    'ss-rollout':              { cost: 240, materialCostPerLf: 200, laborCostPerLf: 40, note: 'SS rollout gutter' },
    /* Gutter — Concrete family */
    'concrete-deck-level':     { cost: 200, materialCostPerLf: 150, laborCostPerLf: 50, note: 'Concrete deck-level gutter' },
    'concrete-rollout':        { cost: 225, materialCostPerLf: 175, laborCostPerLf: 50, note: 'Concrete rollout gutter' },
    'concrete-rollout-parapet':{ cost: 250, materialCostPerLf: 200, laborCostPerLf: 50, note: 'Concrete rollout w/ parapet' },
    'concrete-fully-recessed': { cost: 275, materialCostPerLf: 225, laborCostPerLf: 50, note: 'Concrete fully recessed' },
  },
  copingStyle: {
    'Bull Nose':    { cost: 5400 },
    Cantilevered:   { cost: 7200 },
    Flat:           { cost: 4800 },
    'Rolled Edge':  { cost: 6000 },
  },
  filtrationType: {
    Sand:           { cost: 1200, note: 'Sand filter' },
    Cartridge:      { cost: 1600, note: 'Cartridge filter' },
    DE:             { cost: 2400, note: 'Diatomaceous earth' },
    'Glass Media':  { cost: 3200, note: 'Glass media filter' },
  },
  /** Primary sanitation — Travis Apr 24 list. */
  sanitationType: {
    'Liquid Chlorine':              { cost: 600,  note: 'Bulk liquid chlorine feed' },
    'Chlorine Tablets':             { cost: 450,  note: 'Erosion / tab feeder' },
    'Bromine Tablets':              { cost: 700,  note: 'Bromine feeder — indoor / spa' },
    'Saltwater Chlorine Generator': { cost: 1900, note: 'Salt cell + controller' },
  },
  /** Chemical controllers — proxy products listed by Travis. */
  chemicalControl: {
    'No Chemical Control':       { cost: 0 },
    'Basic (CAT 2000)':          { cost: 1850, note: 'Entry — pH/ORP only' },
    'Mid (CAT 3500/4000)':       { cost: 3200, note: 'Mid-tier — adds free-Cl' },
    'Advanced (CAT 5000)':       { cost: 5400, note: 'Advanced — full chem suite' },
  },
  /** Optional UV / ozone polishing — multi-select. */
  secondarySanitation: {
    'Ozone System':           { cost: 3100 },
    'Ultraviolet Light System': { cost: 2400 },
  },
  /** pH buffer / acid feed system. */
  phBuffer: {
    'No pH Buffer':         { cost: 0 },
    CO2:                    { cost: 1400, note: 'CO₂ feed system' },
    'Liquid muriatic acid': { cost: 800,  note: 'Acid pump w/ tank' },
    'Tablet acid':          { cost: 600,  note: 'Tablet acid feeder' },
  },
  poolFeatures: {
    'Auto Cover':              { cost: 12000 },
    'Pool Slide':              { cost: 5800 },
    'ADA Pool Lift':           { cost: 4200, note: 'ADA accessibility' },
    'In-Floor Cleaning System':{ cost: 7500 },
    'Hand Rails':              { cost: 1200 },
    'Deck Jets':               { cost: 2200 },
  },
  heatingSystem: {
    'Gas Heater':  { cost: 3800 },
    'Heat Pump':   { cost: 5200 },
    Solar:         { cost: 8500 },
    Electric:      { cost: 2200 },
    None:          { cost: 0 },
  },
  interiorFinish: {
    Plaster:        { cost: 6800 },
    Pebble:         { cost: 9500, note: 'Pebble / aggregate' },
    Tile:           { cost: 24000, note: 'Full tile finish' },
    'Vinyl Liner':  { cost: 3200 },
    Fiberglass:     { cost: 4500 },
  },
  waterFeatures: {
    Waterfall:      { cost: 8000 },
    Fountain:       { cost: 3500 },
    Bubbler:        { cost: 1200 },
    'Laminar Jets': { cost: 4500 },
    'Spillover Spa': { cost: 12000 },
    'Rain Curtain': { cost: 6000 },
    None:           { cost: 0 },
  },
};

export function getOptionCost(
  step: string,
  value: string,
): OptionCost | null {
  return COSTS[step]?.[value] ?? null;
}
