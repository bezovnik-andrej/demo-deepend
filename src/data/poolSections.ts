/** Volume Calculator — section types that make up a pool. */
export type PoolSectionType = 'open-area' | 'wet-deck' | 'bench' | 'stairs';

export interface PoolSection {
  id: string;
  label: string;
  type: PoolSectionType;
  /** Surface area in square feet. */
  area: number;
  /** Average depth in feet. Wet decks are typically very shallow. */
  depth: number;
}

export const POOL_SECTION_TYPE_LABELS: Record<PoolSectionType, string> = {
  'open-area': 'Open Area',
  'wet-deck': 'Wet Deck',
  bench: 'Bench',
  stairs: 'Stairs',
};

export const POOL_SECTION_TYPE_OPTIONS: { value: PoolSectionType; label: string }[] = [
  { value: 'open-area', label: 'Open Area' },
  { value: 'wet-deck', label: 'Wet Deck' },
  { value: 'bench', label: 'Bench' },
  { value: 'stairs', label: 'Stairs' },
];

/** US conversion: 1 cubic foot ≈ 7.4805 US gallons. */
export const CF_TO_GALLONS = 7.4805;

export interface VolumeTotals {
  totalArea: number;        // sf
  totalVolume: number;      // cf
  totalGallons: number;     // gal (rounded)
  averageDepth: number;     // ft (volume / area), 0 when area is 0
}

export function sectionVolume(section: Pick<PoolSection, 'area' | 'depth'>): number {
  return Math.max(0, section.area) * Math.max(0, section.depth);
}

export function calculateVolumeTotals(sections: PoolSection[]): VolumeTotals {
  let totalArea = 0;
  let totalVolume = 0;
  for (const s of sections) {
    const area = Math.max(0, s.area);
    const depth = Math.max(0, s.depth);
    totalArea += area;
    totalVolume += area * depth;
  }
  const totalGallons = Math.round(totalVolume * CF_TO_GALLONS);
  const averageDepth = totalArea > 0 ? totalVolume / totalArea : 0;
  return { totalArea, totalVolume, totalGallons, averageDepth };
}

/** Stable, monotonically increasing id for new rows in a session. */
let __idCounter = 0;
export function makePoolSectionId(): string {
  __idCounter += 1;
  return `ps-${Date.now().toString(36)}-${__idCounter}`;
}

export function makeEmptyPoolSection(label = ''): PoolSection {
  return {
    id: makePoolSectionId(),
    label,
    type: 'open-area',
    area: 0,
    depth: 0,
  };
}

/** Super-shallow: depth under 2 ft, or bench / wet-deck regardless of depth. */
export function isSuperShallowPoolSection(section: PoolSection): boolean {
  if (section.type === 'wet-deck' || section.type === 'bench') return true;
  return section.depth > 0 && section.depth < 2;
}

export const DEFAULT_POOL_SECTIONS: PoolSection[] = [
  { id: 'ps-default-shallow', label: 'Shallow end', type: 'open-area', area: 500, depth: 3.5 },
  { id: 'ps-default-main', label: 'Main body', type: 'open-area', area: 2000, depth: 4.5 },
  { id: 'ps-default-deep', label: 'Deep end', type: 'open-area', area: 500, depth: 6 },
];
