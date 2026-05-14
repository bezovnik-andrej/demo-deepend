import type { ProjectData } from '../types';
import { CODE_ID_DECK_DIVING_NA_BY_LOCAL } from '../data/codeStandards';

/** Pool types where deck area is usually not part of the hydraulic / permit package in this demo. */
const POOL_TYPES_HIDE_DECK = new Set(['Fountain', 'Interactive Play']);

/** Pool types where diving boards are not applicable by default. */
const POOL_TYPES_HIDE_DIVING = new Set([
  'Fountain',
  'Interactive Play',
  'Wading Pool',
  'Spa / Hot Tub',
  'Residential Spa',
  'Therapeutic Small',
  'Leisure River',
]);

/**
 * Selected model code treats deck & diving-board data as out of scope for this wizard
 * (demo). Cleared when `deckDivingWizardOverride` is true.
 */
export function deckDivingSuppressedByLocalCode(data: ProjectData): boolean {
  if (data.deckDivingWizardOverride) return false;
  return data.codeStandards.includes(CODE_ID_DECK_DIVING_NA_BY_LOCAL);
}

/**
 * Deck step visibility — user can force-show when a jurisdiction still wants deck data
 * for an edge-case pool type, or when local code would otherwise hide it.
 */
export function isDeckStepVisible(data: ProjectData): boolean {
  if (data.deckDivingWizardOverride) return true;
  if (deckDivingSuppressedByLocalCode(data)) return false;
  const t = data.poolUseType;
  if (!t) return true;
  return !POOL_TYPES_HIDE_DECK.has(t);
}

export function isDivingBoardStepVisible(data: ProjectData): boolean {
  if (data.deckDivingWizardOverride) return true;
  if (deckDivingSuppressedByLocalCode(data)) return false;
  const t = data.poolUseType;
  if (!t) return true;
  return !POOL_TYPES_HIDE_DIVING.has(t);
}

/** When MAHC or Texas public-pool rules are selected, secondary sanitation is commonly required — demo rule. */
export function secondarySanitationRequiredByCodes(data: ProjectData): boolean {
  const ids = data.codeStandards;
  if (ids.includes('mahc') || ids.includes('tx-tac-265-l')) {
    const publicish = data.poolUseType && ['Public Pool', 'Semi-Public Pool'].includes(data.poolUseType);
    return Boolean(publicish);
  }
  return false;
}
