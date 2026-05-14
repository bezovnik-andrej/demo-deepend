import { Building2, Droplets, FileText, Waves, Shell, LayoutGrid, Trophy, type LucideIcon } from 'lucide-react';
import type { ProjectData } from '../types';
import type { MockProject } from '../components/BackOffice/mockProjects';

export interface ProjectTemplate {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  preset: Partial<ProjectData>;
  isUserTemplate?: boolean;
}

const GUTTER_KEYWORDS: Record<string, string[]> = {
  skimmer: ['skimmer-12-coping'],
  'deck level': ['concrete-deck-level'],
  'deck-level': ['concrete-deck-level'],
  overflow: ['ss-deck-level-weirs'],
  'rim flow': ['concrete-rollout'],
  vanishing: ['ss-deck-level-weirs'],
};

const FINISH_KEYWORDS: Record<string, string> = {
  plaster: 'Plaster',
  tile: 'Tile',
  pebble: 'Pebble',
  vinyl: 'Vinyl',
  gunite: 'Plaster',
};

function extractFromPoolType(poolType: string): { gutterStyle?: string; finishType?: string } {
  const lower = poolType.toLowerCase();
  let gutterStyle: string | undefined;
  let finishType: string | undefined;
  for (const [kw, val] of Object.entries(GUTTER_KEYWORDS)) {
    if (lower.includes(kw)) {
      gutterStyle = val[0];
      break;
    }
  }
  for (const [kw, val] of Object.entries(FINISH_KEYWORDS)) {
    if (lower.includes(kw)) { finishType = val; break; }
  }
  return { gutterStyle, finishType };
}

function parseCityState(cityState: string): { city: string; state: string } {
  const parts = cityState.split(',').map((s) => s.trim());
  return { city: parts[0] || '', state: parts[1] || '' };
}

const DEMO_READY_PROJECT_PRESET: Partial<ProjectData> = {
  clientContactName: 'Morgan Smith',
  clientContactEmail: 'morgan.smith@aquabuild.com',
  ownerName: 'Morgan Smith',
  ownerAddress: '742 Evergreen Terrace, Springfield, IL 62704',
  ownerCrmLink: 'aquabuild-smith-gpl-13',
  localCodeAwareness: 'yes',
  codeStandards: ['ispsc-2021'],
  customCodes: ['Springfield residential setback review'],
  poolUseType: 'Residential',
  poolSections: [
    { id: 'ps-demo-shallow', label: 'Shallow lounge', type: 'open-area', area: 185, depth: 3.5 },
    { id: 'ps-demo-main', label: 'Main swim lane', type: 'open-area', area: 235, depth: 5 },
    { id: 'ps-demo-steps', label: 'Entry steps', type: 'stairs', area: 60, depth: 2.5 },
  ],
  deckSf: 620,
  numDivingBoards: 0,
  gutterStyle: 'skimmer-12-coping',
  copingStyle: 'Bull Nose',
  mechanicalKnowledge: 'know',
  brandPreferences: {
    filtration: 'Pentair',
    sanitation: 'Pentair',
    heating: 'Pentair',
    pump: 'Pentair',
    controller: null,
    lighting: null,
  },
  filtrationType: 'Sand',
  selectedFilterModelIds: ['flt-pen-tr100'],
  filterCount: 2,
  sanitationType: 'Saltwater Chlorine Generator',
  chemicalControl: 'Basic (CAT 2000)',
  secondarySanitation: [],
  phBuffer: 'No pH Buffer',
  heatingSystem: ['Gas Heater'],
  poolEnvironment: 'outdoor',
  heaterScenario: 'shoulder-season',
  heaterTargetWaterTempF: 84,
  heaterStartWaterTempF: 62,
  heaterAmbientTempF: 48,
  heaterWindMph: 6,
  heaterFillWaterTempF: 56,
  heaterHeatUpDays: 2,
  heaterEfficiencyPct: 84,
  finishType: 'Plaster',
};

export function mockProjectToPreset(project: MockProject): Partial<ProjectData> {
  const { gutterStyle, finishType } = extractFromPoolType(project.poolType);
  const { city, state } = parseCityState(project.cityState);
  const preset: Partial<ProjectData> = {
    projectName: project.name,
    clientCompanyName: project.client,
    projectAddress: project.address,
    projectCity: city,
    projectState: state,
    projectZip: project.zip,
  };
  if (project.projectType) preset.projectType = project.projectType;
  if (gutterStyle) preset.gutterStyle = gutterStyle;
  if (finishType) preset.finishType = finishType;
  const lower = project.poolType.toLowerCase();
  if (lower.includes('competition')) preset.poolUseType = 'Competition Pool';
  else if (lower.includes('lap') || lower.includes('public')) preset.poolUseType = 'Public Pool';
  else if (lower.includes('spa')) preset.poolUseType = 'Spa / Hot Tub';
  if (project.id === 'smith-residence-pool') {
    Object.assign(preset, DEMO_READY_PROJECT_PRESET);
  }
  return preset;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'residential',
    name: 'Residential Standard',
    desc: 'Standard residential pool with common equipment defaults',
    icon: Waves,
    preset: {
      projectType: 'Residential',
      poolUseType: 'Residential',
      gutterStyle: 'skimmer-12-coping',
      copingStyle: 'Bull Nose',
      mechanicalKnowledge: 'help',
      filtrationType: 'Sand',
      sanitationType: 'Saltwater Chlorine Generator',
      chemicalControl: 'No Chemical Control',
      phBuffer: 'No pH Buffer',
      heatingSystem: ['Gas Heater'],
      poolEnvironment: 'outdoor' as const,
      heaterScenario: 'coldest-month' as const,
      heaterTargetWaterTempF: 82,
      heaterStartWaterTempF: 60,
      heaterHeatUpDays: 2,
      heaterEfficiencyPct: 84,
      finishType: 'Plaster',
    },
  },
  {
    id: 'commercial',
    name: 'Commercial',
    desc: 'Commercial/public pool with code-compliant defaults',
    icon: Building2,
    preset: {
      projectType: 'Commercial',
      poolUseType: 'Public Pool',
      gutterStyle: 'concrete-deck-level',
      copingStyle: 'Flat',
      mechanicalKnowledge: 'know',
      filtrationType: 'Sand',
      sanitationType: 'Liquid Chlorine',
      chemicalControl: 'Mid (CAT 3500/4000)',
      secondarySanitation: ['Ultraviolet Light System'],
      phBuffer: 'CO2',
      heatingSystem: ['Gas Heater'],
      poolEnvironment: 'outdoor' as const,
      heaterScenario: 'coldest-month' as const,
      heaterTargetWaterTempF: 82,
      heaterStartWaterTempF: 55,
      heaterHeatUpDays: 2,
      heaterEfficiencyPct: 84,
      finishType: 'Tile',
      tileBandHeight: '6"',
      batherLoadSqFtPerPerson: 15,
      batherLoadUsageMultiplier: 0.75,
      turnoverHoursOverride: 6,
    },
  },
  {
    id: 'spa',
    name: 'Spa Only',
    desc: 'Standalone spa/hot tub with heating & jets',
    icon: Droplets,
    preset: {
      projectType: 'Residential',
      poolUseType: 'Residential Spa',
      gutterStyle: 'concrete-fully-recessed',
      copingStyle: 'Bull Nose',
      mechanicalKnowledge: 'help',
      filtrationType: 'Cartridge',
      sanitationType: 'Bromine Tablets',
      chemicalControl: 'Basic (CAT 2000)',
      phBuffer: 'Liquid muriatic acid',
      heatingSystem: ['Gas Heater'],
      poolEnvironment: 'indoor' as const,
      heaterScenario: 'coldest-month' as const,
      heaterTargetWaterTempF: 104,
      heaterStartWaterTempF: 60,
      heaterHeatUpDays: 1,
      heaterEfficiencyPct: 84,
      finishType: 'Tile',
    },
  },
  {
    id: 'pool-spa',
    name: 'Pool + Spa',
    desc: 'Residential pool with attached spa, shared equipment pad',
    icon: Shell,
    preset: {
      projectType: 'Residential',
      poolUseType: 'Residential',
      gutterStyle: 'concrete-rollout',
      copingStyle: 'Bull Nose',
      mechanicalKnowledge: 'help',
      filtrationType: 'Cartridge',
      sanitationType: 'Saltwater Chlorine Generator',
      chemicalControl: 'No Chemical Control',
      phBuffer: 'No pH Buffer',
      heatingSystem: ['Gas Heater'],
      poolEnvironment: 'outdoor' as const,
      heaterScenario: 'coldest-month' as const,
      heaterTargetWaterTempF: 84,
      heaterStartWaterTempF: 60,
      heaterHeatUpDays: 2,
      heaterEfficiencyPct: 84,
      finishType: 'Pebble',
      waterFeatures: ['Spillover Spa', 'Bubbler'],
      poolFeatures: ['Auto Cover'],
    },
  },
  {
    id: 'dual-pool',
    name: 'Dual Pool Complex',
    desc: 'Two-pool commercial facility — lap pool + leisure pool',
    icon: LayoutGrid,
    preset: {
      projectType: 'Commercial',
      poolUseType: 'Public Pool',
      gutterStyle: 'concrete-deck-level',
      copingStyle: 'Flat',
      mechanicalKnowledge: 'know',
      filtrationType: 'Sand',
      sanitationType: 'Liquid Chlorine',
      chemicalControl: 'Mid (CAT 3500/4000)',
      secondarySanitation: ['Ultraviolet Light System'],
      phBuffer: 'CO2',
      heatingSystem: ['Gas Heater', 'Heat Pump'],
      poolEnvironment: 'outdoor' as const,
      heaterScenario: 'coldest-month' as const,
      heaterTargetWaterTempF: 82,
      heaterStartWaterTempF: 55,
      heaterHeatUpDays: 2,
      heaterEfficiencyPct: 84,
      finishType: 'Tile',
      tileBandHeight: '6"',
      batherLoadSqFtPerPerson: 15,
      batherLoadUsageMultiplier: 0.75,
      turnoverHoursOverride: 6,
    },
  },
  {
    id: 'aquatic-center',
    name: 'Aquatic Center',
    desc: 'Multi-vessel municipal facility — competition, leisure & warm-up pools',
    icon: Trophy,
    preset: {
      projectType: 'Commercial',
      poolUseType: 'Competition Pool',
      gutterStyle: 'ss-deck-level-weirs',
      copingStyle: 'Flat',
      mechanicalKnowledge: 'know',
      filtrationType: 'DE',
      sanitationType: 'Liquid Chlorine',
      chemicalControl: 'Advanced (CAT 5000)',
      secondarySanitation: ['Ozone System', 'Ultraviolet Light System'],
      phBuffer: 'CO2',
      heatingSystem: ['Gas Heater', 'Solar'],
      poolEnvironment: 'indoor' as const,
      heaterScenario: 'coldest-month' as const,
      heaterTargetWaterTempF: 80,
      heaterStartWaterTempF: 55,
      heaterHeatUpDays: 2,
      heaterEfficiencyPct: 90,
      finishType: 'Tile',
      tileBandHeight: 'Full',
      batherLoadSqFtPerPerson: 12,
      batherLoadUsageMultiplier: 0.85,
      turnoverHoursOverride: 4,
    },
  },
  {
    id: 'blank',
    name: 'Blank Project',
    desc: 'Start from scratch — no pre-filled configuration',
    icon: FileText,
    preset: {},
  },
];
