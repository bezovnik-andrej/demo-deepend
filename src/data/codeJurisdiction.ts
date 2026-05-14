/**
 * Demo mapping: project state → likely adopted code standards.
 * Preview only — confirm with the AHJ before relying on this list.
 */

import { CODE_STANDARDS, type CodeStandard } from './codeStandards';

export function suggestedCodesForState(stateAbbr: string | null | undefined): CodeStandard[] {
  const s = (stateAbbr ?? '').trim().toUpperCase();
  if (!s) return [CODE_STANDARDS[0]!];
  if (s === 'TX') {
    return CODE_STANDARDS.filter((c) => c.id === 'ispsc-2021' || c.id === 'tx-tac-265-l');
  }
  return CODE_STANDARDS.filter((c) => c.id === 'ispsc-2021');
}
