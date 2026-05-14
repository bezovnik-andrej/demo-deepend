/**
 * Standard building codes a pool project may be governed by.
 *
 * Travis Apr 13.2026 — replace the old free-text "Code Details" with a
 * fixed list. Future enhancement (Code User Story): autopopulate based
 * on project location from a searchable database.
 */

export interface CodeStandard {
  /** Stable id stored in ProjectData.codeStandards. */
  id: string;
  /** Short label used in dense UI (chips, summaries). */
  short: string;
  /** Full official name shown in option lists. */
  label: string;
  /** Optional governing body / region hint. */
  scope?: string;
}

/** When selected (with code awareness), Deck & Diving Board steps are N/A unless the wizard override is enabled. */
export const CODE_ID_DECK_DIVING_NA_BY_LOCAL = 'local-no-deck-diving';

export const CODE_STANDARDS: CodeStandard[] = [
  {
    id: 'ispsc-2021',
    short: 'ISPSC 2021',
    label: 'International Swimming Pool and Spa Code, 2021 Edition',
    scope: 'ICC — model code, US-wide adoption',
  },
  {
    id: 'tx-tac-265-l',
    short: '25 TAC 265-L',
    label: '25 TAC Chapter 265, Subchapter L — Public Swimming Pools and Spas',
    scope: 'Texas DSHS — state regulation',
  },
  {
    id: 'mahc',
    short: 'MAHC',
    label: 'Model Aquatic Health Code',
    scope: 'CDC — voluntary model code',
  },
  {
    id: 'ansi-apsp-icc-11',
    short: 'ANSI/APSP/ICC-11',
    label: 'ANSI/APSP/ICC-11 — Water Quality in Public Pools and Spas',
    scope: 'ANSI / Pool & Hot Tub Alliance',
  },
  {
    id: CODE_ID_DECK_DIVING_NA_BY_LOCAL,
    short: 'Deck/diving N/A',
    label: 'Local chapter — deck & diving board not applicable under selected code',
    scope: 'Demo — marks Deck / Diving Board N/A; use wizard override to configure anyway',
  },
];

export function getCodeStandard(id: string): CodeStandard | undefined {
  return CODE_STANDARDS.find((c) => c.id === id);
}

export function getCodeShort(id: string): string {
  return getCodeStandard(id)?.short ?? id;
}
