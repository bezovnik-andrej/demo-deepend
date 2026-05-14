import { useMemo } from 'react';
import { useApp } from '../../store';
import { OptionButton } from '../ui/OptionButton';
import { TextInput } from '../ui/TextInput';
import { InfoHint } from '../ui/InfoHint';
import { getOptionCost } from '../../data/configCosts';
import { AGGREGATE_FINISH_BRANDS, PLASTER_FINISH_BRANDS } from '../../data/finishCatalog';
import type { ProjectData } from '../../types';
import {
  inchesFromBandPreset,
  legacyTileBandFromWaterline,
  waterlineBandPreset,
} from '../../utils/finishTileSpec';
import styles from './forms.module.css';

const FINISH_OPTIONS = [
  { value: 'Plaster', label: 'Plaster' },
  { value: 'Pebble', label: 'Pebble / Aggregate' },
  { value: 'Tile', label: 'Tile' },
  { value: 'Vinyl Liner', label: 'Vinyl Liner' },
  { value: 'Fiberglass', label: 'Fiberglass' },
].map((o) => ({ ...o, cost: getOptionCost('interiorFinish', o.value)?.cost }));

function isPlasterOrAggregateFinish(finishType: string | null | undefined): boolean {
  return finishType === 'Plaster' || finishType === 'Pebble';
}

function copyWaterlineToBody(d: ProjectData): Record<string, unknown> {
  return {
    bodyTileBandInches: d.waterlineBandInches,
    bodyTileBandCustomInches: d.waterlineBandCustomInches,
    bodyTileSizeLabel: d.waterlineTileSizeLabel,
    bodyTileSizeCustom: d.waterlineTileSizeCustom,
    bodyTilePickMode: d.waterlinePickMode,
    bodyTilePriceTier: d.waterlinePriceTier,
    bodyTileColorNotes: d.waterlineTileColorNotes,
  };
}

type TileScope = 'waterline' | 'body';

function TileBandPicker({
  title,
  hint,
  scope,
  d,
  disabled,
  patch,
}: {
  title: string;
  hint?: string;
  scope: TileScope;
  d: ProjectData;
  disabled: boolean;
  patch: (p: Record<string, unknown>) => void;
}) {
  const bandInches = scope === 'waterline' ? d.waterlineBandInches : d.bodyTileBandInches;
  const bandCustomText = scope === 'waterline' ? d.waterlineBandCustomInches : d.bodyTileBandCustomInches;
  const sizeLabel = scope === 'waterline' ? d.waterlineTileSizeLabel : d.bodyTileSizeLabel;
  const sizeCustom = scope === 'waterline' ? d.waterlineTileSizeCustom : d.bodyTileSizeCustom;
  const pickMode = scope === 'waterline' ? d.waterlinePickMode : d.bodyTilePickMode;
  const priceTier = scope === 'waterline' ? d.waterlinePriceTier : d.bodyTilePriceTier;
  const colorNotes = scope === 'waterline' ? d.waterlineTileColorNotes : d.bodyTileColorNotes;

  const bandKey = scope === 'waterline' ? 'waterlineBandInches' : 'bodyTileBandInches';
  const bandCustomKey = scope === 'waterline' ? 'waterlineBandCustomInches' : 'bodyTileBandCustomInches';
  const sizeLabelKey = scope === 'waterline' ? 'waterlineTileSizeLabel' : 'bodyTileSizeLabel';
  const sizeCustomKey = scope === 'waterline' ? 'waterlineTileSizeCustom' : 'bodyTileSizeCustom';
  const pickKey = scope === 'waterline' ? 'waterlinePickMode' : 'bodyTilePickMode';
  const tierKey = scope === 'waterline' ? 'waterlinePriceTier' : 'bodyTilePriceTier';
  const colorKey = scope === 'waterline' ? 'waterlineTileColorNotes' : 'bodyTileColorNotes';

  const bandPreset = waterlineBandPreset(bandInches);

  const setBandPreset = (preset: string) => {
    if (preset === 'custom') {
      const text = bandCustomText || String(bandInches ?? '');
      const inches = inchesFromBandPreset('custom', text);
      patch({
        [bandCustomKey]: text,
        [bandKey]: inches ?? bandInches ?? 6,
      });
      return;
    }
    const inches = inchesFromBandPreset(preset, '');
    patch({ [bandKey]: inches, [bandCustomKey]: '' });
  };

  const onBandCustomText = (text: string) => {
    const inches = inchesFromBandPreset('custom', text);
    patch({ [bandCustomKey]: text, [bandKey]: inches ?? null });
  };

  return (
    <div className={styles.conditional}>
      <h3 className={styles.blockTitle}>
        {title}
        {hint && (
          <InfoHint
            contextLabel={title}
            text={hint}
          />
        )}
      </h3>
      <OptionButton
        label="Band height"
        options={[
          { value: '6', label: '6″' },
          { value: '12', label: '12″' },
          { value: 'full', label: 'Full' },
          { value: 'custom', label: 'Custom' },
        ]}
        value={bandPreset}
        onChange={(v) => setBandPreset(v)}
        disabled={disabled}
      />
      {bandPreset === 'custom' && (
        <TextInput
          label="Custom band height (inches)"
          value={bandCustomText}
          onChange={onBandCustomText}
          placeholder="e.g. 9"
          disabled={disabled}
        />
      )}
      <OptionButton
        label="Tile size"
        options={[
          { value: '1×1', label: '1×1' },
          { value: '2×2', label: '2×2' },
          { value: '6×6', label: '6×6' },
          { value: 'Custom', label: 'Custom' },
        ]}
        value={sizeLabel ?? '6×6'}
        onChange={(v) => patch({ [sizeLabelKey]: v, [sizeCustomKey]: v === 'Custom' ? sizeCustom : '' })}
        disabled={disabled}
      />
      {sizeLabel === 'Custom' && (
        <TextInput
          label="Custom tile size"
          value={sizeCustom}
          onChange={(v) => patch({ [sizeCustomKey]: v })}
          placeholder='e.g. 3×9 or 4" hex'
          disabled={disabled}
        />
      )}
      <OptionButton
        label="Selection mode"
        options={[
          { value: 'colors', label: 'Specific colors' },
          { value: 'price-range', label: 'Price tier' },
          { value: 'unknown', label: 'I don’t know' },
        ]}
        value={pickMode ?? 'unknown'}
        onChange={(v) => {
          const mode = v as 'colors' | 'price-range' | 'unknown';
          const next: Record<string, unknown> = { [pickKey]: mode };
          if (mode === 'unknown') {
            next[tierKey] = scope === 'waterline' ? d.waterlinePriceTier ?? 'high' : d.bodyTilePriceTier ?? 'high';
          }
          patch(next);
        }}
        disabled={disabled}
      />
      {pickMode === 'colors' && (
        <TextInput
          label="Color / mosaic notes"
          value={colorNotes}
          onChange={(v) => patch({ [colorKey]: v })}
          placeholder="e.g. Caribbean Blue glass, 2×2 at waterline"
          disabled={disabled}
        />
      )}
      <OptionButton
        label={pickMode === 'unknown' ? 'Price tier (used when you’re unsure — defaults high)' : 'Price tier'}
        options={[
          { value: 'low', label: 'Value' },
          { value: 'mid', label: 'Mid' },
          { value: 'high', label: 'Premium' },
        ]}
        value={(priceTier ?? 'high') as 'low' | 'mid' | 'high'}
        onChange={(v) => patch({ [tierKey]: v as 'low' | 'mid' | 'high' })}
        disabled={disabled || pickMode === 'colors'}
      />
    </div>
  );
}

export function InteriorFinishForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;
  const rawUpdate = (payload: Record<string, unknown>) => dispatch({ type: 'UPDATE_DATA', payload });

  const patchFinishes = (payload: Record<string, unknown>) => {
    const next = { ...d, ...payload } as ProjectData;
    const legacy =
      next.finishType === 'Tile' || isPlasterOrAggregateFinish(next.finishType)
        ? legacyTileBandFromWaterline(next)
        : {};
    rawUpdate({ ...payload, ...legacy });
  };

  const brandCatalog = useMemo(() => {
    if (d.finishType === 'Plaster') return PLASTER_FINISH_BRANDS;
    if (d.finishType === 'Pebble') return AGGREGATE_FINISH_BRANDS;
    return [];
  }, [d.finishType]);

  const lineOptions = useMemo(() => {
    const b = brandCatalog.find((x) => x.brand === d.finishBrand);
    return b?.lines ?? [];
  }, [brandCatalog, d.finishBrand]);

  const colorOptions = useMemo(() => {
    const line = lineOptions.find((l) => l.id === d.finishProductLine);
    return line?.colors ?? [];
  }, [lineOptions, d.finishProductLine]);

  const showFinishCatalog = isPlasterOrAggregateFinish(d.finishType);
  const showWaterlineTileBand =
    (isPlasterOrAggregateFinish(d.finishType) && d.waterlineTileEnabled) || d.finishType === 'Tile';

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>Interior Finish</h2>
      <OptionButton
        label="Finish Type"
        options={FINISH_OPTIONS}
        value={d.finishType}
        onChange={(v) =>
          rawUpdate({
            finishType: v,
            finishBrand: null,
            finishProductLine: null,
            finishColorName: null,
            waterlineTileEnabled: v === 'Plaster' || v === 'Pebble',
            allTilePool: v === 'Tile',
            applyWaterlineTileToBody: v === 'Tile' ? true : false,
          })
        }
        disabled={disabled}
      />

      {showFinishCatalog && (
        <div className={styles.conditional}>
          <p className={styles.formDesc}>Pick a catalog entry (demo data) or leave blank and describe in notes.</p>
          <label className={styles.formDesc} style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Brand
          </label>
          <select
            className={styles.optionSelect}
            value={d.finishBrand ?? ''}
            disabled={disabled}
            onChange={(e) =>
              rawUpdate({
                finishBrand: e.target.value || null,
                finishProductLine: null,
                finishColorName: null,
              })
            }
            aria-label="Finish brand"
          >
            <option value="">Select brand…</option>
            {brandCatalog.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand}
              </option>
            ))}
          </select>

          {d.finishBrand && (
            <>
              <label className={styles.formDesc} style={{ display: 'block', margin: '12px 0 6px', fontWeight: 600 }}>
                Product line
              </label>
              <select
                className={styles.optionSelect}
                value={d.finishProductLine ?? ''}
                disabled={disabled}
                onChange={(e) =>
                  rawUpdate({
                    finishProductLine: e.target.value || null,
                    finishColorName: null,
                  })
                }
                aria-label="Finish product line"
              >
                <option value="">Select line…</option>
                {lineOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </>
          )}

          {d.finishProductLine && colorOptions.length > 0 && (
            <>
              <label className={styles.formDesc} style={{ display: 'block', margin: '12px 0 6px', fontWeight: 600 }}>
                Color
              </label>
              <select
                className={styles.optionSelect}
                value={d.finishColorName ?? ''}
                disabled={disabled}
                onChange={(e) => rawUpdate({ finishColorName: e.target.value || null })}
                aria-label="Finish color"
              >
                <option value="">Select color…</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {isPlasterOrAggregateFinish(d.finishType) && (
        <div className={styles.conditional}>
          <h3 className={styles.blockTitle}>
            Waterline / tile band
            <InfoHint
              contextLabel="Waterline tile band"
              text="Required for plaster and aggregate pools. Turn off only when there is no separate tile band at the waterline."
            />
          </h3>
          <OptionButton
            label="Include waterline tile band"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            value={d.waterlineTileEnabled ? 'yes' : 'no'}
            onChange={(v) => rawUpdate({ waterlineTileEnabled: v === 'yes' })}
            disabled={disabled}
          />
        </div>
      )}

      {showWaterlineTileBand && (
        <TileBandPicker
          title={d.finishType === 'Tile' ? 'Waterline band' : 'Waterline / tile band'}
          hint={
            d.finishType === 'Tile'
              ? 'Even on an all-tile pool, specify the band at the waterline first. Field tile can match or differ below.'
              : 'Height, size, and how you want colors or budget represented for estimating.'
          }
          scope="waterline"
          d={d}
          disabled={disabled}
          patch={patchFinishes}
        />
      )}

      {d.finishType === 'Tile' && (
        <div className={styles.conditional}>
          <h3 className={styles.blockTitle}>
            Field tile (rest of pool)
            <InfoHint
              contextLabel="Field tile"
              text="Use the same sizes and color approach as the waterline band, or specify field tile separately when walls or floor use a different tile."
            />
          </h3>
          <label className={styles.sameAsCard}>
            <input
              type="checkbox"
              checked={d.applyWaterlineTileToBody}
              disabled={disabled}
              onChange={(e) => {
                const on = e.target.checked;
                if (on) {
                  patchFinishes({ applyWaterlineTileToBody: true });
                } else {
                  patchFinishes({ applyWaterlineTileToBody: false, ...copyWaterlineToBody(d) });
                }
              }}
            />
            <span className={styles.sameAsCardText}>
              <span className={styles.sameAsLead}>Field tile matches waterline band</span>
            </span>
          </label>
          {!d.applyWaterlineTileToBody && (
            <TileBandPicker
              title="Field tile specification"
              scope="body"
              d={d}
              disabled={disabled}
              patch={patchFinishes}
            />
          )}
          <OptionButton
            label="Stair nosing at tile steps"
            options={[
              { value: 'Matching Tile', label: 'Matching tile' },
              { value: 'Contrasting', label: 'Contrasting color' },
              { value: 'Bull Nose', label: 'Bull nose trim' },
            ]}
            value={d.stairNosingDetail}
            onChange={(v) => rawUpdate({ stairNosingDetail: v })}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
