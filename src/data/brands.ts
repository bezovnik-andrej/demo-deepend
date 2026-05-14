/**
 * Mock brand catalogue (BackOffice-curated, dealer-imported in production).
 *
 * Brands are global — set in BackOffice by superadmins, imported from various
 * dealer/distributor catalogues. The project-side picker consumes this read-only.
 *
 * See docs/manufacturer-selection.md.
 */

import type { EquipmentCategory } from '../types';

export interface Brand {
  /** Stable id used as the stored value. */
  value: string;
  /** Display name. */
  label: string;
  /** Importing dealer / distributor. */
  dealer: string;
  /** Equipment categories this brand covers. */
  categories: EquipmentCategory[];
  /** Single character used for the avatar fallback when no logo URL exists. */
  initial: string;
  /** Tailwind-ish accent for the avatar background. */
  avatarColor: string;
}

export const BRANDS: Brand[] = [
  {
    value: 'pentair',
    label: 'Pentair',
    dealer: 'PoolCorp',
    categories: ['filtration', 'sanitation', 'heating', 'pump', 'controller', 'lighting'],
    initial: 'P',
    avatarColor: '#1e40af',
  },
  {
    value: 'hayward',
    label: 'Hayward',
    dealer: 'SRS Distribution',
    categories: ['filtration', 'sanitation', 'heating', 'pump', 'controller', 'lighting'],
    initial: 'H',
    avatarColor: '#0891b2',
  },
  {
    value: 'jandy',
    label: 'Jandy',
    dealer: 'PoolCorp',
    categories: ['filtration', 'sanitation', 'heating', 'pump', 'controller'],
    initial: 'J',
    avatarColor: '#7c3aed',
  },
  {
    value: 'zodiac',
    label: 'Zodiac',
    dealer: 'PoolCorp',
    categories: ['sanitation', 'heating', 'controller'],
    initial: 'Z',
    avatarColor: '#0d9488',
  },
  {
    value: 'waterway',
    label: 'Waterway',
    dealer: 'Aquatic Industries',
    categories: ['filtration', 'pump'],
    initial: 'W',
    avatarColor: '#ea580c',
  },
  {
    value: 'paramount',
    label: 'Paramount',
    dealer: 'PoolCorp',
    categories: ['filtration', 'sanitation', 'controller'],
    initial: 'P',
    avatarColor: '#dc2626',
  },
  {
    value: 'raypak',
    label: 'Raypak',
    dealer: 'SRS Distribution',
    categories: ['heating'],
    initial: 'R',
    avatarColor: '#16a34a',
  },
  {
    value: 'sta-rite',
    label: 'Sta-Rite',
    dealer: 'PoolCorp',
    categories: ['filtration', 'pump'],
    initial: 'S',
    avatarColor: '#a16207',
  },
  {
    value: 'cmp',
    label: 'CMP',
    dealer: 'Custom Molded Products',
    categories: ['filtration', 'pump', 'lighting'],
    initial: 'C',
    avatarColor: '#475569',
  },
  {
    value: 'autopilot',
    label: 'AutoPilot',
    dealer: 'AutoPilot Systems',
    categories: ['sanitation'],
    initial: 'A',
    avatarColor: '#9333ea',
  },
];

/** Filter the catalogue to brands that cover a given equipment category. */
export function getBrandsForCategory(category: EquipmentCategory): Brand[] {
  return BRANDS.filter((b) => b.categories.includes(category));
}

/** Lookup a brand by value (returns null if not found). */
export function getBrandByValue(value: string | null): Brand | null {
  if (!value) return null;
  return BRANDS.find((b) => b.value === value) ?? null;
}
