/** Demo finish catalog — brand / product line / color for interior surfaces. */

export interface FinishBrandEntry {
  brand: string;
  lines: { id: string; label: string; colors: string[] }[];
}

export const AGGREGATE_FINISH_BRANDS: FinishBrandEntry[] = [
  {
    brand: 'Pebble Tec',
    lines: [
      { id: 'pebble-sheen', label: 'Pebble Sheen', colors: ['Blue Granite', 'Caribbean Blue', 'Tahoe Blue', 'Sand'] },
      { id: 'pebble-fina', label: 'Pebble Fina', colors: ['Frost', 'Sky Blue', 'Sandstone'] },
      { id: 'pebble-brilliance', label: 'Pebble Brilliance', colors: ['Azure', 'Midnight'] },
    ],
  },
  {
    brand: 'StoneScapes',
    lines: [
      { id: 'ss-mini', label: 'Mini Pebble', colors: ['Tropics Blue', 'Slate Gray'] },
    ],
  },
];

export const PLASTER_FINISH_BRANDS: FinishBrandEntry[] = [
  {
    brand: 'Marcite / White',
    lines: [{ id: 'std', label: 'Standard white plaster', colors: ['White'] }],
  },
];
