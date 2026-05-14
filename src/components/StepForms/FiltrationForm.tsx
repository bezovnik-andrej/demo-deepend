import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Filter as FilterIcon,
  Droplets,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../store';
import { OptionButton } from '../ui/OptionButton';
import { getOptionCost } from '../../data/configCosts';
import {
  FILTER_CATALOG,
  type FilterMediaType,
  type FilterProduct,
} from '../../data/equipmentCatalog';
import {
  calculateFilterSizing,
  defaultDesignRate,
  defaultBackwashRate,
  type FilterSizingInputs,
} from '../../data/filterSizing';
import { calculateVolumeTotals } from '../../data/poolSections';
import { getTurnoverHoursForPoolType } from '../../data/engineering';
import {
  capacityForNominalIn,
  nominalInForCapacityGpm,
  SEWER_NOMINAL_OPTIONS,
} from '../../data/sewerLineSizing';
import formStyles from './forms.module.css';
import styles from './FiltrationForm.module.css';
import { PriceRangeDual } from '../ui/PriceRangeDual';
import { InfoHint } from '../ui/InfoHint';

const MEDIA_OPTIONS = [
  { value: 'Sand', label: 'Sand' },
  { value: 'Cartridge', label: 'Cartridge' },
  { value: 'DE', label: 'Diatomaceous Earth (DE)' },
  { value: 'Glass Media', label: 'Glass Media' },
].map((o) => ({ ...o, cost: getOptionCost('filtrationType', o.value)?.cost }));

function fmtNum(n: number, digits = 1): string {
  if (!Number.isFinite(n) || n === 0) return digits === 0 ? '0' : (0).toFixed(digits);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtGallons(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${Math.round(n).toLocaleString()} gal`;
}

interface NumFieldProps {
  label: string;
  value: number;
  unit: string;
  hint?: string;
  disabled?: boolean;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  /** True when the visible value is the default (used only for placeholder hint). */
  isDefault?: boolean;
}

interface FiltrationCatalogueBlockProps {
  baseCatalogueRows: FilterProduct[];
  disabled: boolean;
  filterCount: number;
  selectedFilterModelIds: string[];
  recirculationGpm: number;
  designRate: number;
  filterAreaRequiredSf: number;
  onToggle: (f: FilterProduct) => void;
}

/** Toolbar + table; remounted when `mediaType` / brand preference change so filter UI resets without an effect. */
function FiltrationCatalogueBlock({
  baseCatalogueRows,
  disabled,
  filterCount,
  selectedFilterModelIds,
  recirculationGpm,
  designRate,
  filterAreaRequiredSf,
  onToggle,
}: FiltrationCatalogueBlockProps) {
  const { state, dispatch } = useApp();
  const qtyById = state.data.filterCatalogQtyByModelId ?? {};

  const priceBounds = useMemo(() => {
    if (!baseCatalogueRows.length) return { min: 0, max: 0 };
    const prices = baseCatalogueRows.map((r) => r.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [baseCatalogueRows]);

  const brandsInCatalogue = useMemo(() => {
    const set = new Set(baseCatalogueRows.map((r) => r.brand));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [baseCatalogueRows]);

  const [priceFloor, setPriceFloor] = useState<number | ''>('');
  const [priceCeil, setPriceCeil] = useState<number | ''>('');
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [minTanks, setMinTanks] = useState(1);
  const [meetsFilter, setMeetsFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sortKey, setSortKey] = useState<'area' | 'price' | 'brand'>('area');

  const displayedCatalogueRows = useMemo(() => {
    let rows = [...baseCatalogueRows];
    if (priceFloor !== '') rows = rows.filter((r) => r.price >= priceFloor);
    if (priceCeil !== '') rows = rows.filter((r) => r.price <= priceCeil);
    if (brandFilter.length) rows = rows.filter((r) => brandFilter.includes(r.brand));
    if (minTanks > 1) {
      rows = rows.filter((f) => {
        const need =
          filterAreaRequiredSf > 0 ? Math.ceil(filterAreaRequiredSf / f.filterAreaSqFt) : 1;
        return need >= minTanks;
      });
    }
    rows = rows.filter((f) => {
      const rowQty = qtyById[f.id] ?? filterCount;
      const totalArea = f.filterAreaSqFt * Math.max(1, rowQty);
      const rate = totalArea > 0 ? recirculationGpm / totalArea : 0;
      const meetsDesign = totalArea > 0 && rate <= designRate;
      if (meetsFilter === 'yes') return meetsDesign;
      if (meetsFilter === 'no') return totalArea > 0 && !meetsDesign;
      return true;
    });
    rows.sort((a, b) => {
      if (sortKey === 'price') return a.price - b.price || a.model.localeCompare(b.model);
      if (sortKey === 'brand') return a.brand.localeCompare(b.brand) || a.price - b.price;
      return a.filterAreaSqFt - b.filterAreaSqFt || a.price - b.price;
    });
    return rows;
  }, [
    baseCatalogueRows,
    priceFloor,
    priceCeil,
    brandFilter,
    minTanks,
    filterAreaRequiredSf,
    meetsFilter,
    sortKey,
    filterCount,
    qtyById,
    recirculationGpm,
    designRate,
  ]);

  const filtersDirty =
    priceFloor !== '' ||
    priceCeil !== '' ||
    brandFilter.length > 0 ||
    minTanks > 1 ||
    meetsFilter !== 'all' ||
    sortKey !== 'area';

  const clearToolbarFilters = () => {
    setPriceFloor('');
    setPriceCeil('');
    setBrandFilter([]);
    setMinTanks(1);
    setMeetsFilter('all');
    setSortKey('area');
  };

  return (
    <div className={styles.catSelectionShell}>
      <div className={styles.catToolbar}>
        <div className={styles.catToolbarHeader}>
          <div className={styles.catToolbarTitle}>
            <SlidersHorizontal size={14} className={styles.catToolbarTitleIcon} aria-hidden />
            <span>Filter & sort</span>
          </div>
          {filtersDirty && (
            <button
              type="button"
              className={styles.catResetBtn}
              onClick={clearToolbarFilters}
              disabled={disabled}
            >
              <RotateCcw size={12} aria-hidden />
              Clear filters
            </button>
          )}
        </div>
        <div className={styles.catToolbarRow}>
          <div className={styles.catFieldWide}>
            <span className={styles.catFieldLabel}>Price range ($)</span>
            {priceBounds.max > priceBounds.min ? (
              <PriceRangeDual
                minBound={priceBounds.min}
                maxBound={priceBounds.max}
                floor={priceFloor}
                ceil={priceCeil}
                onFloor={setPriceFloor}
                onCeil={setPriceCeil}
                disabled={disabled}
              />
            ) : (
              <span className={styles.toolbarMetaBadge}>Single price in catalogue</span>
            )}
          </div>
          <div className={styles.catField}>
            <span className={styles.catFieldLabel}>Min tanks (scenario)</span>
            <select
              className={styles.catSelect}
              value={minTanks}
              onChange={(e) => setMinTanks(Number(e.target.value))}
              disabled={disabled}
              aria-label="Minimum number of filter tanks"
            >
              <option value={1}>Any</option>
              <option value={2}>2+</option>
              <option value={3}>3+</option>
            </select>
          </div>
          <div className={styles.catField}>
            <span className={styles.catFieldLabel}>Meets design rate</span>
            <select
              className={styles.catSelect}
              value={meetsFilter}
              onChange={(e) => setMeetsFilter(e.target.value as 'all' | 'yes' | 'no')}
              disabled={disabled}
              aria-label="Filter rows by design rate"
            >
              <option value="all">All rows</option>
              <option value="yes">Meets design (green)</option>
              <option value="no">Over design rate</option>
            </select>
          </div>
          <div className={styles.catField}>
            <span className={styles.catFieldLabel}>Sort</span>
            <select
              className={styles.catSelect}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as 'area' | 'price' | 'brand')}
              disabled={disabled}
              aria-label="Sort catalogue"
            >
              <option value="area">Tank area (ft²)</option>
              <option value="price">Price</option>
              <option value="brand">Brand</option>
            </select>
          </div>
        </div>
        {brandsInCatalogue.length > 1 && (
          <div className={styles.catField}>
            <span className={styles.catFieldLabel}>Brands</span>
            <p className={styles.catFieldHint}>
              Select one or more, or leave all unchecked to show every brand.
            </p>
            <div className={styles.brandChips} role="group" aria-label="Filter by brand">
              {brandsInCatalogue.map((b) => {
                const on = brandFilter.includes(b);
                return (
                  <label key={b} className={styles.catBrandToggle}>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={disabled}
                      onChange={() => {
                        setBrandFilter((prev) =>
                          on ? prev.filter((x) => x !== b) : [...prev, b],
                        );
                      }}
                    />
                    <span>{b}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        <div className={styles.toolbarMeta}>
          <span className={styles.toolbarMetaBadge}>
            {displayedCatalogueRows.length} / {baseCatalogueRows.length} models
          </span>
          {priceBounds.min !== priceBounds.max && (
            <span className={styles.toolbarMetaRange}>
              ${priceBounds.min.toLocaleString()}–${priceBounds.max.toLocaleString()} in catalogue
            </span>
          )}
        </div>
      </div>
      {displayedCatalogueRows.length === 0 ? (
        <div className={styles.catTablePane}>
          <div className={styles.emptyState}>
            No models match the current filters. Widen the price range or clear filters.
          </div>
        </div>
      ) : (
        <div className={styles.catTablePane}>
          <div className={styles.compTable} role="table" aria-label="Filter selection">
          <div className={styles.compHead} role="row">
            <div role="columnheader" className={styles.compHeadRadio} aria-label="Selection" />
            <div role="columnheader">Model</div>
            <div role="columnheader" className={styles.compHeadRight}>Qty</div>
            <div role="columnheader" className={styles.compHeadRight}>Per-tank ft²</div>
            <div role="columnheader" className={styles.compHeadRight}>Total ft²</div>
            <div role="columnheader" className={styles.compHeadRight}>Rate gpm/ft²</div>
          </div>
          {displayedCatalogueRows.map((f) => {
            const isSelected = selectedFilterModelIds.includes(f.id);
            const rowQty = qtyById[f.id] ?? filterCount;
            const totalArea = f.filterAreaSqFt * Math.max(1, rowQty);
            const rate = totalArea > 0 ? recirculationGpm / totalArea : 0;
            const meetsDesign = totalArea > 0 && rate <= designRate;
            return (
              <div
                key={f.id}
                role="row"
                className={`${styles.compRow} ${meetsDesign ? styles.compRowMeets : styles.compRowOver} ${isSelected ? styles.compRowSelected : ''}`}
              >
                <button
                  type="button"
                  className={styles.compRowMainBtn}
                  onClick={() => onToggle(f)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? 'Deselect' : 'Select'} ${f.brand} ${f.model}`}
                >
                  <div className={styles.compSelectCell} role="cell">
                    <span className={styles.compCheckbox} aria-hidden="true">
                      {isSelected && <span className={styles.compCheckboxCheck} />}
                    </span>
                  </div>
                  <div className={styles.compCell} role="cell">
                    <span className={styles.compModelBrand}>{f.brand}</span>
                    {f.model}
                  </div>
                </button>
                <div
                  className={`${styles.compCell} ${styles.compCellRight} ${styles.compQtyCell}`}
                  role="cell"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className={styles.compQtyInput}
                    value={rowQty}
                    disabled={disabled}
                    aria-label={`Quantity for ${f.model}`}
                    onChange={(e) => {
                      const n = Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1));
                      dispatch({
                        type: 'UPDATE_DATA',
                        payload: {
                          filterCatalogQtyByModelId: { ...qtyById, [f.id]: n },
                          ...(isSelected ? { filterCount: n } : {}),
                        },
                      });
                    }}
                  />
                </div>
                <div
                  className={`${styles.compCell} ${styles.compCellRight} ${styles.compMetricPer}`}
                  role="cell"
                >
                  {fmtNum(f.filterAreaSqFt, 2)}
                </div>
                <div
                  className={`${styles.compCell} ${styles.compCellRight} ${styles.compMetricTotal}`}
                  role="cell"
                >
                  {fmtNum(totalArea, 2)}
                </div>
                <div
                  className={`${styles.compCell} ${styles.compCellRight} ${styles.compMetricRate} ${meetsDesign ? '' : styles.compMuted}`}
                  role="cell"
                >
                  {totalArea > 0 ? fmtNum(rate, 2) : '—'}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, unit, hint, disabled, onChange, min = 0, step = 1, isDefault }: NumFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {hint && <span className={styles.fieldHint}> ({hint})</span>}
      </span>
      <div className={styles.numWrap}>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          className={`${styles.input} ${styles.inputNum}`}
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          placeholder={isDefault ? `${value}` : '0'}
          disabled={disabled}
          aria-label={label}
        />
        <span className={styles.unit}>{unit}</span>
      </div>
    </label>
  );
}

export function FiltrationForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;
  const update = (payload: Record<string, unknown>) =>
    dispatch({ type: 'UPDATE_DATA', payload });

  const disposalMode = d.retentionDisposalMode ?? 'retention';
  const sewerNominalIn =
    d.filterSewerLineNominalIn ?? nominalInForCapacityGpm(d.filterSewerCapacityGpm);

  const totals = useMemo(() => calculateVolumeTotals(d.poolSections), [d.poolSections]);
  const turnoverHours =
    d.turnoverHoursOverride ?? getTurnoverHoursForPoolType(d.poolUseType, totals.averageDepth);
  const recirculationGpm = useMemo(
    () => (turnoverHours > 0 ? Math.round(totals.totalGallons / (turnoverHours * 60)) : 0),
    [totals.totalGallons, turnoverHours],
  );

  const mediaType = (d.filtrationType as FilterMediaType | null) ?? null;

  // Catalogue rows for the chosen media (brand is filtered in the table toolbar).
  const baseCatalogueRows = useMemo(() => {
    let rows: FilterProduct[] = FILTER_CATALOG;
    if (mediaType) rows = rows.filter((f) => f.mediaType === mediaType);
    return rows;
  }, [mediaType]);

  const selectedFilterIds = d.selectedFilterModelIds ?? [];
  const selectedFilters = useMemo(
    () => selectedFilterIds.map((id) => FILTER_CATALOG.find((f) => f.id === id)).filter(Boolean) as FilterProduct[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedFilterIds.join(',')],
  );

  const designRateDefault = defaultDesignRate(mediaType, d.poolUseType);
  const designRate = d.filterDesignRateGpmPerSf ?? designRateDefault;

  const backwashRateDefault = defaultBackwashRate(mediaType);
  const backwashRate = d.filterBackwashRateGpmPerSf ?? backwashRateDefault;

  // Total actual filter area = sum of (each selected model's area × its qty).
  const totalSelectedAreaSf = useMemo(() => {
    const qtyById = d.filterCatalogQtyByModelId ?? {};
    return selectedFilters.reduce((sum, f) => {
      const qty = qtyById[f.id] ?? d.filterCount;
      return sum + f.filterAreaSqFt * Math.max(1, qty);
    }, 0);
  }, [selectedFilters, d.filterCatalogQtyByModelId, d.filterCount]);

  // Use first selected filter for per-model backwash display.
  const primaryFilter = selectedFilters[0] ?? null;

  const sizingInputs: FilterSizingInputs = useMemo(
    () => ({
      recirculationGpm,
      flowRateDesignGpmPerSf: d.filterDesignRateGpmPerSf,
      mediaType,
      poolUseType: d.poolUseType,
      // Pass total area as a single "virtual" filter so sizing calcs use the real combined footprint.
      perFilterAreaSf: totalSelectedAreaSf,
      filterCount: 1,
      backwashRateGpmPerSf: d.filterBackwashRateGpmPerSf,
      sewerCapacityGpm: d.filterSewerCapacityGpm,
      retentionTimeMin: d.filterRetentionTimeMin,
      retentionPitLengthFt: d.filterRetentionPitLengthFt,
      retentionPitWidthFt: d.filterRetentionPitWidthFt,
      retentionPitDepthFt: d.filterRetentionPitDepthFt,
    }),
    [
      recirculationGpm,
      d.filterDesignRateGpmPerSf,
      mediaType,
      d.poolUseType,
      totalSelectedAreaSf,
      d.filterBackwashRateGpmPerSf,
      d.filterSewerCapacityGpm,
      d.filterRetentionTimeMin,
      d.filterRetentionPitLengthFt,
      d.filterRetentionPitWidthFt,
      d.filterRetentionPitDepthFt,
    ],
  );

  const sizing = useMemo(() => calculateFilterSizing(sizingInputs), [sizingInputs]);

  const isComplete = !!d.filtrationType && selectedFilterIds.length > 0;

  const handleToggleFilter = (f: FilterProduct) => {
    const prev = d.filterCatalogQtyByModelId ?? {};
    const alreadySelected = selectedFilterIds.includes(f.id);
    if (alreadySelected) {
      update({ selectedFilterModelIds: selectedFilterIds.filter((id) => id !== f.id) });
    } else {
      const recommended =
        sizing.filterAreaRequiredSf > 0
          ? Math.max(1, Math.ceil(sizing.filterAreaRequiredSf / f.filterAreaSqFt))
          : Math.max(1, d.filterCount);
      update({
        selectedFilterModelIds: [...selectedFilterIds, f.id],
        filterCount: recommended,
        filterCatalogQtyByModelId: { ...prev, [f.id]: prev[f.id] ?? recommended },
      });
    }
  };

  return (
    <div className={formStyles.form}>
      <div className={styles.titleRow}>
        <h2 className={formStyles.formTitle}>Filtration</h2>
        <InfoHint
          contextLabel="Filtration"
          text="Pick a media type, then select a filter tank model. The catalogue is filtered by media; use the table toolbar to narrow by price, brand, and design rate. The recirculation rate from the volume + turnover calc is used to size required area, and we surface backwash flow plus retention pit dimensions for your sewer capacity."
        />
        {isComplete && (
          <span className={styles.completeBadge}>
            <CheckCircle2 size={13} aria-hidden="true" />
            Complete
          </span>
        )}
      </div>

      {/* ── Filtration type (single label — avoid duplicating “Filtration” + “Filter”) ── */}
      <OptionButton
        label="Filtration type"
        options={MEDIA_OPTIONS}
        value={d.filtrationType}
        onChange={(v) =>
          update({
            filtrationType: v,
            // Clear selection / overrides when media changes — defaults must reset.
            selectedFilterModelIds: [],
            filterDesignRateGpmPerSf: null,
            filterBackwashRateGpmPerSf: null,
          })
        }
        disabled={disabled}
      />

      {/* ── Sizing Inputs ── */}
      <div className={styles.sectionLabel}>
        <FilterIcon size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} />{' '}
        Sizing — Required Filter Area
        <InfoHint
          contextLabel="Required filter area"
          text="Required area is recirculation GPM divided by your design surface rate. Green rows in the catalogue meet that rate for the tank quantity you enter."
        />
      </div>
      <p className={styles.hint}>
        Recirculation rate comes from your volume + turnover. The design rate
        falls back to a media-specific standard for your pool class — override
        if your local code differs.
      </p>
      <div className={styles.summaryStrip}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Recirculation (Q)</div>
          <div className={styles.summaryValue}>{recirculationGpm.toLocaleString()} gpm</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Turnover</div>
          <div className={styles.summaryValue}>
            {turnoverHours > 0 ? `${fmtNum(turnoverHours, 1)} hrs` : '—'}
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardAccent}`}>
          <div className={styles.summaryLabel}>Required filter area</div>
          <div className={styles.summaryValue}>{fmtNum(sizing.filterAreaRequiredSf, 2)} ft²</div>
        </div>
      </div>

      <div className={styles.fieldGrid} style={{ marginTop: 'var(--sp-3)' }}>
        <NumField
          label="Design flow rate"
          value={designRate}
          unit="gpm/ft²"
          hint={d.filterDesignRateGpmPerSf == null ? 'media default' : 'override'}
          step={0.5}
          disabled={disabled}
          isDefault={d.filterDesignRateGpmPerSf == null}
          onChange={(v) =>
            update({ filterDesignRateGpmPerSf: v === designRateDefault || v === 0 ? null : v })
          }
        />
        <NumField
          label="Number of filters"
          value={d.filterCount}
          unit="tanks"
          step={1}
          disabled={disabled}
          onChange={(v) => {
            const n = Math.max(1, Math.floor(v));
            const prev = d.filterCatalogQtyByModelId ?? {};
            const payload: Record<string, unknown> = { filterCount: n };
            if (selectedFilterIds.length > 0) {
              const updated = { ...prev };
              for (const id of selectedFilterIds) updated[id] = n;
              payload.filterCatalogQtyByModelId = updated;
            }
            update(payload);
          }}
        />
      </div>

      {/* ── Filter Selection (catalogue table) ── */}
      <div className={styles.sectionLabel}>Filter Selection</div>
      <p className={styles.hint}>
        Choose a filter tank. Each row shows total area for the tank quantity
        (override per model) and the resulting surface flow rate. Rows that meet your design rate
        are marked with a green bar.
      </p>

      {baseCatalogueRows.length === 0 ? (
        <div className={styles.emptyState}>
          {mediaType
            ? `No ${mediaType} models in the catalogue.`
            : 'No filter models in the catalogue match the current media. Pick a media type first.'}
        </div>
      ) : (
        <FiltrationCatalogueBlock
          key={mediaType ?? 'none'}
          baseCatalogueRows={baseCatalogueRows}
          disabled={disabled}
          filterCount={d.filterCount}
          selectedFilterModelIds={selectedFilterIds}
          recirculationGpm={recirculationGpm}
          designRate={designRate}
          filterAreaRequiredSf={sizing.filterAreaRequiredSf}
          onToggle={handleToggleFilter}
        />
      )}

      {/* ── Capacity Actuals ── */}
      {selectedFilters.length > 0 && (
        <>
          <div className={styles.sectionLabel}>Filter Capacity — Actual</div>
          <div className={styles.summaryStrip}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>
                {selectedFilters.length === 1 ? 'Selected model' : 'Models selected'}
              </div>
              <div className={styles.summaryValue}>
                {selectedFilters.length === 1
                  ? selectedFilters[0].model
                  : `${selectedFilters.length} models`}
              </div>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryCardAccent}`}>
              <div className={styles.summaryLabel}>Combined area</div>
              <div className={styles.summaryValue}>{fmtNum(sizing.filterAreaActualSf, 2)} ft²</div>
            </div>
            <div
              className={`${styles.summaryCard} ${sizing.meetsDesignRate ? styles.summaryCardAccent : styles.summaryCardWarn}`}
            >
              <div className={styles.summaryLabel}>Actual filter rate</div>
              <div className={styles.summaryValue}>
                {fmtNum(sizing.filterRateActualGpmPerSf, 2)} gpm/ft²
              </div>
            </div>
          </div>
          {!sizing.meetsDesignRate && sizing.filterAreaActualSf > 0 && (
            <p className={styles.hint}>
              Actual rate ({fmtNum(sizing.filterRateActualGpmPerSf, 2)} gpm/ft²)
              exceeds your design rate ({fmtNum(designRate, 2)} gpm/ft²). Add a
              tank, choose a larger model, or relax the design rate.
            </p>
          )}
        </>
      )}

      {/* ── Backwash & Sewer ── */}
      <div className={styles.sectionLabel}>
        <Droplets size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} />{' '}
        Backwash &amp; Sewer
      </div>
      <p className={styles.hint}>
        Backwash flow per tank is the worst-case discharge during a single filter&apos;s cleaning
        cycle. Pick how discharge is handled; the retention pit absorbs the difference when
        backwash exceeds sewer capacity.
      </p>

      <OptionButton
        label="Discharge strategy"
        options={[
          { value: 'retention', label: 'Retention pit' },
          { value: 'sewer', label: 'Sewer connection' },
          { value: 'not-needed', label: 'Not needed (2″ floor drain)' },
        ]}
        value={disposalMode}
        onChange={(v) => {
          const mode = v as 'retention' | 'sewer' | 'not-needed';
          const payload: Record<string, unknown> = { retentionDisposalMode: mode };
          if (mode === 'not-needed') {
            payload.filterSewerLineNominalIn = 2;
            payload.filterSewerCapacityGpm = capacityForNominalIn(2);
          }
          update(payload);
        }}
        disabled={disabled}
      />

      {disposalMode === 'not-needed' && (
        <p className={styles.hint}>
          Demo default: route to a <strong>2″ gravity floor drain</strong> when no engineered
          retention or sewer tie-in is required. Add a line in <strong>Additional costs</strong>{' '}
          if you want it on the BOM.
        </p>
      )}

      <div className={styles.fieldGrid}>
        <NumField
          label="Backwash rate"
          value={backwashRate}
          unit="gpm/ft²"
          hint={d.filterBackwashRateGpmPerSf == null ? 'media default' : 'override'}
          step={0.5}
          disabled={disabled || mediaType === 'Cartridge'}
          isDefault={d.filterBackwashRateGpmPerSf == null}
          onChange={(v) =>
            update({
              filterBackwashRateGpmPerSf: v === backwashRateDefault || v === 0 ? null : v,
            })
          }
        />
        <NumField
          label="Sewer capacity (paired)"
          value={d.filterSewerCapacityGpm}
          unit="gpm"
          step={5}
          disabled={disabled || disposalMode === 'not-needed'}
          onChange={(v) => {
            const gpm = Math.max(0, v);
            update({
              filterSewerCapacityGpm: gpm,
              filterSewerLineNominalIn: nominalInForCapacityGpm(gpm),
            });
          }}
        />
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Sewer line (nominal)</span>
          <select
            className={styles.catSelect}
            value={sewerNominalIn}
            disabled={disabled || disposalMode === 'not-needed'}
            aria-label="Sewer line nominal size in inches"
            onChange={(e) => {
              const inches = Number(e.target.value);
              update({
                filterSewerLineNominalIn: inches,
                filterSewerCapacityGpm: capacityForNominalIn(inches),
              });
            }}
          >
            {SEWER_NOMINAL_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}″ ({capacityForNominalIn(n)} gpm demo cap)
              </option>
            ))}
          </select>
        </label>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Backwash flow / tank (calc)</div>
          <div className={styles.summaryValue}>
            {fmtNum(sizing.backwashFlowPerFilterGpm, 0)} gpm
          </div>
        </div>
        {primaryFilter && primaryFilter.backwashGpm > 0 && (
          <div className={styles.summaryCard}>
            <div className={styles.summaryLabel}>
              Catalog backwash{selectedFilters.length > 1 ? ' (primary)' : ''}
            </div>
            <div className={styles.summaryValue}>{fmtNum(primaryFilter.backwashGpm, 0)} gpm</div>
          </div>
        )}
        <NumField
          label="Retention time"
          value={d.filterRetentionTimeMin}
          unit="min"
          step={0.5}
          disabled={disabled || disposalMode === 'not-needed'}
          onChange={(v) => update({ filterRetentionTimeMin: Math.max(0, v) })}
        />
      </div>

      {disposalMode !== 'not-needed' && (
        <>
          {/* ── Retention Pit ── */}
          <div className={styles.sectionLabel}>Retention Pit</div>
          <p className={styles.hint}>
            {disposalMode === 'sewer'
              ? 'Sized to absorb a single backwash spike when the sewer lateral is smaller than peak flow.'
              : 'Sized to absorb a single backwash event when the sewer can’t take the full flow. Length × Width × Depth × 7.4805 gal/ft³.'}
          </p>
          <div className={styles.fieldGrid3}>
            <NumField
              label="Length"
              value={d.filterRetentionPitLengthFt}
              unit="ft"
              step={0.5}
              disabled={disabled}
              onChange={(v) => update({ filterRetentionPitLengthFt: Math.max(0, v) })}
            />
            <NumField
              label="Width"
              value={d.filterRetentionPitWidthFt}
              unit="ft"
              step={0.5}
              disabled={disabled}
              onChange={(v) => update({ filterRetentionPitWidthFt: Math.max(0, v) })}
            />
            <NumField
              label="Depth"
              value={d.filterRetentionPitDepthFt}
              unit="ft"
              step={0.5}
              disabled={disabled}
              onChange={(v) => update({ filterRetentionPitDepthFt: Math.max(0, v) })}
            />
          </div>
          <div className={styles.summaryStrip2} style={{ marginTop: 'var(--sp-3)' }}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Required capacity</div>
              <div className={styles.summaryValue}>{fmtGallons(sizing.retentionRequiredGallons)}</div>
            </div>
            <div
              className={`${styles.summaryCard} ${
                sizing.retentionMeetsRequirement ? styles.summaryCardAccent : styles.summaryCardWarn
              }`}
            >
              <div className={styles.summaryLabel}>Actual pit capacity</div>
              <div className={styles.summaryValue}>{fmtGallons(sizing.retentionActualGallons)}</div>
            </div>
          </div>
          {!sizing.retentionMeetsRequirement && sizing.retentionRequiredGallons > 0 && (
            <p className={styles.hint}>
              Pit is {fmtGallons(sizing.retentionRequiredGallons - sizing.retentionActualGallons)}{' '}
              short of the required capacity. Increase L / W / D or shorten the retention time.
            </p>
          )}
        </>
      )}
    </div>
  );
}
