import { ConfigStep as CS } from '../types';
import type { ConfigStep, ProjectData } from '../types';

/** ProjectData keys that each config step primarily edits (for "pre-filled by template" badge). */
const STEP_TO_KEYS: Partial<Record<ConfigStep, (keyof ProjectData)[]>> = {
  [CS.ProjectType]: ['projectType', 'poolEnvironment'],
  [CS.PoolUseType]: ['poolUseType'],
  [CS.GutterStyle]: ['gutterStyle'],
  [CS.CopingStyle]: ['copingStyle'],
  [CS.MechanicalKnowledge]: ['mechanicalKnowledge'],
  [CS.MechanicalBrand]: ['mechanicalBrandPreference'],
  [CS.MechanicalPriorities]: ['mechanicalPriorities'],
  [CS.Filtration]: ['filtrationType'],
  [CS.Sanitation]: ['sanitationType'],
  [CS.ChemicalControl]: ['chemicalControl'],
  [CS.SecondarySanitation]: ['secondarySanitation', 'secondarySanitationMode'],
  [CS.PhBuffer]: ['phBuffer'],
  [CS.Heating]: ['heatingSystem', 'poolEnvironment', 'heaterScenario', 'heaterTargetWaterTempF', 'heaterHeatUpDays', 'heaterEfficiencyPct'],
  [CS.InteriorFinish]: ['finishType'],
  [CS.TileDetails]: [
    'stairNosingDetail',
    'waterlineBandInches',
    'waterlineBandCustomInches',
    'waterlineTileSizeLabel',
    'waterlineTileSizeCustom',
    'waterlinePickMode',
    'waterlinePriceTier',
    'waterlineTileColorNotes',
    'applyWaterlineTileToBody',
    'bodyTileBandInches',
    'bodyTileBandCustomInches',
    'bodyTileSizeLabel',
    'bodyTileSizeCustom',
    'bodyTilePickMode',
    'bodyTilePriceTier',
    'bodyTileColorNotes',
    'tileBandHeight',
    'customTileHeight',
  ],
  [CS.WaterFeatures]: ['waterFeatures'],
  [CS.Features]: ['poolFeatures'],
  [CS.LocalCodeDetails]: ['codeStandards', 'customCodes'],
};

function presetKeyHasValue(preset: Partial<ProjectData>, key: keyof ProjectData): boolean {
  const v = preset[key];
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'boolean') return true;
  return true;
}

/** True if the template preset populated any field this step is responsible for. */
export function isStepPrefilledFromTemplate(
  stepId: ConfigStep,
  preset: Partial<ProjectData> | null,
): boolean {
  if (!preset) return false;
  if (Object.keys(preset).length === 0) return false;
  const keys = STEP_TO_KEYS[stepId];
  if (!keys?.length) return false;
  return keys.some((k) => presetKeyHasValue(preset, k));
}
