import type { ProjectData } from '../types';

export type TilePickMode = 'colors' | 'price-range' | 'unknown';

/** Map stored band height to UI preset. */
export function waterlineBandPreset(inches: number | null): '6' | '12' | 'full' | 'custom' {
  if (inches === 6) return '6';
  if (inches === 12) return '12';
  if (inches !== null && inches >= 48) return 'full';
  if (inches !== null && inches > 0) return 'custom';
  return 'custom';
}

export function inchesFromBandPreset(preset: string, customInchesText: string): number | null {
  if (preset === '6') return 6;
  if (preset === '12') return 12;
  if (preset === 'full') return 60;
  if (preset === 'custom') {
    const n = parseFloat(String(customInchesText).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  return 6;
}

/** Keep legacy Tile Details / summary fields aligned with waterline band inches. */
export function legacyTileBandFromWaterline(
  d: Pick<ProjectData, 'waterlineBandInches'>,
): { tileBandHeight: string | null; customTileHeight: string } {
  const inches = d.waterlineBandInches;
  if (inches === 6) return { tileBandHeight: '6"', customTileHeight: '' };
  if (inches === 12) return { tileBandHeight: '12"', customTileHeight: '' };
  if (inches !== null && inches >= 48) return { tileBandHeight: 'Full', customTileHeight: '' };
  if (inches !== null && inches > 0) return { tileBandHeight: 'Custom', customTileHeight: `${inches}"` };
  return { tileBandHeight: 'Custom', customTileHeight: '' };
}

function tilePickAndSizeComplete(
  sizeLabel: string | null,
  sizeCustom: string,
  pickMode: TilePickMode,
  priceTier: string | null,
  colorNotes: string,
): boolean {
  const sizeOk =
    !!sizeLabel &&
    (sizeLabel !== 'Custom' || sizeCustom.trim().length > 0);
  if (!sizeOk) return false;
  if (pickMode === 'colors') return colorNotes.trim().length > 0;
  if (pickMode === 'price-range') return !!priceTier;
  return true;
}

/** Waterline / tile-band row: band + size + selection mode satisfied. */
export function isWaterlineTileSegmentComplete(d: ProjectData): boolean {
  if (d.finishType === 'Vinyl Liner' || d.finishType === 'Fiberglass') return true;
  if ((d.finishType === 'Plaster' || d.finishType === 'Pebble') && !d.waterlineTileEnabled) return true;
  if (!(d.finishType === 'Plaster' || d.finishType === 'Pebble' || d.finishType === 'Tile')) return true;

  const bandOk = d.waterlineBandInches !== null && d.waterlineBandInches > 0;
  if (!bandOk) return false;
  return tilePickAndSizeComplete(
    d.waterlineTileSizeLabel,
    d.waterlineTileSizeCustom,
    d.waterlinePickMode,
    d.waterlinePriceTier,
    d.waterlineTileColorNotes,
  );
}

export function isBodyTileSegmentComplete(d: ProjectData): boolean {
  const bandOk = d.bodyTileBandInches !== null && d.bodyTileBandInches > 0;
  if (!bandOk) return false;
  return tilePickAndSizeComplete(
    d.bodyTileSizeLabel,
    d.bodyTileSizeCustom,
    d.bodyTilePickMode,
    d.bodyTilePriceTier,
    d.bodyTileColorNotes,
  );
}

/** Tile Details step: stair nosing + waterline band + optional separate field tile for all-tile pools. */
export function isTileDetailsStepComplete(d: ProjectData): boolean {
  if (d.finishType !== 'Tile') return true;
  if (!d.stairNosingDetail) return false;
  if (!isWaterlineTileSegmentComplete(d)) return false;
  if (d.finishType === 'Tile' && !d.applyWaterlineTileToBody && !isBodyTileSegmentComplete(d)) return false;
  return true;
}
