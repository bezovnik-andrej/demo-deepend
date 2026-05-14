import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import {
  Search, Package, ArrowUpDown, ArrowDown, ArrowUp, X, Truck, Factory,
  Minus, Plus,
} from 'lucide-react';
import type { BOMLineRef, InventoryPart } from '../../data/inventory';
import styles from './SwapModal.module.css';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

type Availability = 'all' | 'in-stock' | 'backorder';

function isInStock(p: InventoryPart): boolean {
  return p.status !== 'on-order';
}

function priceDelta(currentTotal: number, candidateTotal: number): { label: string; cls: string } | null {
  const diff = candidateTotal - currentTotal;
  if (diff === 0 || currentTotal === 0) return null;
  const pct = Math.round((Math.abs(diff) / currentTotal) * 100);
  if (diff < 0) return { label: `Save ${fmt(Math.abs(diff))} (${pct}%)`, cls: styles.deltaSave };
  return { label: `+${fmt(diff)} (${pct}%)`, cls: styles.deltaMore };
}

function stockLabel(inv: InventoryPart): { text: string; cls: string } {
  if (inv.status === 'on-order') return { text: 'Backorder', cls: styles.stockBackorder };
  return { text: 'In Stock', cls: styles.stockInStock };
}

type PriceSort = 'none' | 'asc' | 'desc';

function nearestPriceRangeThumb(
  clientX: number,
  rect: DOMRect,
  lo: number,
  hi: number,
  minV: number,
  maxV: number,
): 'min' | 'max' {
  const span = maxV - minV;
  if (span <= 0 || rect.width <= 0) return 'min';
  const clickPct = ((clientX - rect.left) / rect.width) * 100;
  const loPct = ((lo - minV) / span) * 100;
  const hiPct = ((hi - minV) / span) * 100;
  return Math.abs(clickPct - loPct) <= Math.abs(clickPct - hiPct) ? 'min' : 'max';
}

/** An allocation the user has committed to while browsing this modal. */
export interface SwapAllocation {
  inv: InventoryPart;
  qty: number;
}

interface Props {
  item: BOMLineRef;
  inventory: InventoryPart[];
  /** Commit one or more SKU allocations for this line. */
  onApply: (allocations: SwapAllocation[]) => void;
  onClose: () => void;
}

const MAX_PER_SKU = 999;

export function SwapModal({ item, inventory, onApply, onClose }: Props) {
  const titleId = useId();
  const searchId = useId();

  const { priceMin, priceMax } = useMemo(() => {
    if (inventory.length === 0) return { priceMin: 0, priceMax: 0 };
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of inventory) {
      if (p.unitCost < lo) lo = p.unitCost;
      if (p.unitCost > hi) hi = p.unitCost;
    }
    return { priceMin: Math.floor(lo), priceMax: Math.ceil(hi) };
  }, [inventory]);

  const [modalSearch, setModalSearch] = useState('');
  const [priceSort, setPriceSort] = useState<PriceSort>('none');
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());
  const [activeSuppliers, setActiveSuppliers] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Availability>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([priceMin, priceMax]);
  const [activePriceThumb, setActivePriceThumb] = useState<'min' | 'max'>('max');
  const priceRangeWrapRef = useRef<HTMLDivElement>(null);

  /* Allocation map: partNo → qty. Seeded with the current SKU at the line's
     existing qty so "open then click Apply" is a safe no-op. The user can
     decrement the current SKU to split off units to other SKUs. */
  const [allocations, setAllocations] = useState<Record<string, number>>(
    () => ({ [item.partNo]: item.qty }),
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      setModalSearch('');
      setPriceSort('none');
      setActiveBrands(new Set());
      setActiveSuppliers(new Set());
      setAvailability('all');
      setPriceRange([priceMin, priceMax]);
      setActivePriceThumb('max');
      setAllocations({ [item.partNo]: item.qty });
    }, 0);
    return () => window.clearTimeout(t);
  }, [item.partNo, item.qty, priceMin, priceMax]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of inventory) set.add(p.brand);
    return Array.from(set).sort();
  }, [inventory]);

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    for (const p of inventory) set.add(p.supplier);
    return Array.from(set).sort();
  }, [inventory]);

  const toggleBrand = (b: string) => {
    setActiveBrands((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  };

  const toggleSupplier = (s: string) => {
    setActiveSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const priceFilterActive = priceRange[0] > priceMin || priceRange[1] < priceMax;
  const activeFilterCount =
    (activeSuppliers.size > 0 ? 1 : 0) +
    (activeBrands.size > 0 ? 1 : 0) +
    (availability !== 'all' ? 1 : 0) +
    (priceFilterActive ? 1 : 0);

  const resetAllFilters = () => {
    setActiveBrands(new Set());
    setActiveSuppliers(new Set());
    setAvailability('all');
    setPriceRange([priceMin, priceMax]);
  };

  const modalFiltered = useMemo(() => {
    let result = inventory;

    if (activeSuppliers.size > 0) {
      result = result.filter((p) => activeSuppliers.has(p.supplier));
    }

    if (activeBrands.size > 0) {
      result = result.filter((p) => activeBrands.has(p.brand));
    }

    if (availability === 'in-stock') {
      result = result.filter(isInStock);
    } else if (availability === 'backorder') {
      result = result.filter((p) => !isInStock(p));
    }

    result = result.filter((p) => p.unitCost >= priceRange[0] && p.unitCost <= priceRange[1]);

    const q = modalSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.partNo.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.supplier.toLowerCase().includes(q),
      );
    }

    if (priceSort === 'asc') {
      result = [...result].sort((a, b) => a.unitCost - b.unitCost);
    } else if (priceSort === 'desc') {
      result = [...result].sort((a, b) => b.unitCost - a.unitCost);
    }

    return result;
  }, [inventory, modalSearch, activeBrands, activeSuppliers, availability, priceRange, priceSort]);

  /* ── Allocation helpers ── */

  const setQtyFor = (partNo: string, next: number) => {
    setAllocations((prev) => {
      const cleaned = { ...prev };
      const v = Math.max(0, Math.min(MAX_PER_SKU, Math.floor(next)));
      if (v === 0) delete cleaned[partNo];
      else cleaned[partNo] = v;
      return cleaned;
    });
  };

  const inc = (partNo: string) => setQtyFor(partNo, (allocations[partNo] ?? 0) + 1);
  const dec = (partNo: string) => setQtyFor(partNo, (allocations[partNo] ?? 0) - 1);

  /* ── Derived totals ── */

  const totalAllocated = useMemo(
    () => Object.values(allocations).reduce((s, n) => s + n, 0),
    [allocations],
  );

  const totalCost = useMemo(() => {
    let sum = 0;
    for (const [partNo, qty] of Object.entries(allocations)) {
      const inv = inventory.find((p) => p.partNo === partNo);
      if (inv) sum += inv.unitCost * qty;
    }
    return sum;
  }, [allocations, inventory]);

  const originalCost = item.qty * item.unitCost;
  const qtyDelta = totalAllocated - item.qty;
  const costDelta = priceDelta(originalCost, totalCost);
  const allocatedSkuCount = Object.keys(allocations).length;
  const canApply = totalAllocated > 0;

  /* Hidden allocations (filtered out of the current view) so the user knows
     they still count toward the apply total. */
  const hiddenAllocated = useMemo(() => {
    let hidden = 0;
    for (const [partNo, qty] of Object.entries(allocations)) {
      if (!modalFiltered.some((p) => p.partNo === partNo)) hidden += qty;
    }
    return hidden;
  }, [allocations, modalFiltered]);

  /* ── Apply ── */

  const apply = () => {
    const selections: SwapAllocation[] = [];
    for (const [partNo, qty] of Object.entries(allocations)) {
      const inv = inventory.find((p) => p.partNo === partNo);
      if (inv && qty > 0) selections.push({ inv, qty });
    }

    /* No-op: unchanged single allocation matching current. */
    const isUnchanged =
      selections.length === 1 &&
      selections[0].inv.partNo === item.partNo &&
      selections[0].qty === item.qty;

    if (isUnchanged || selections.length === 0) {
      onClose();
      return;
    }

    onApply(selections);
  };

  const cyclePriceSort = () => {
    setPriceSort((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const alternativeCount = inventory.filter((p) => p.partNo !== item.partNo).length;

  /* Apply-button label adapts to intent: single SKU swap, split across SKUs,
     or unchanged. Gives the user a clear commitment read. */
  const applyLabel = (() => {
    if (!canApply) return 'Apply';
    if (allocatedSkuCount === 1) {
      const [partNo] = Object.keys(allocations);
      if (partNo === item.partNo && allocations[partNo] === item.qty) return 'No changes';
      return `Apply · ${totalAllocated} ${item.unit}`;
    }
    return `Apply split · ${allocatedSkuCount} SKUs`;
  })();

  return createPortal(
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 id={titleId} className={styles.modalTitle}>
              Replace line item
            </h2>
            <p className={styles.modalSubtitle}>
              {item.category} · Split across manufacturers using the qty steppers
            </p>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Current part card */}
        <div className={styles.modalCurrentCard}>
          <div className={styles.modalCurrentHead}>
            <Package size={13} className={styles.modalCurrentIcon} aria-hidden />
            <span className={styles.modalCurrentLabel}>Current part</span>
            <span className={styles.modalCurrentBrand}>{item.brand}</span>
            <span className={styles.qtyInline} title="Line quantity">
              {item.qty} {item.unit.toUpperCase()}
            </span>
          </div>
          <div className={styles.modalCurrentBody}>
            <div className={styles.modalCurrentDesc}>{item.description}</div>
            <div className={styles.modalCurrentMeta}>
              <span className={styles.currentTotal}>{fmt(originalCost)}</span>
              <span className={styles.metaOp}>
                {fmt(item.unitCost)} × {item.qty}
              </span>
              <span className={styles.metaDot}>·</span>
              <span className={styles.currentPart}>{item.partNo}</span>
              <span className={styles.metaDot}>·</span>
              <span>{item.supplier}</span>
            </div>
          </div>
        </div>

        {/* Search + filter bar */}
        <div className={styles.filterBar}>
          <div className={styles.modalSearchWrap}>
            <Search size={14} className={styles.modalSearchIcon} aria-hidden />
            <input
              id={searchId}
              className={styles.modalSearchInput}
              placeholder="Search by part #, brand, description, distributor..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              autoComplete="off"
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                className={styles.clearInline}
                onClick={resetAllFilters}
                title={`Clear ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'}`}
                aria-label={`Clear ${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'}`}
              >
                <X size={11} /> {activeFilterCount}
              </button>
            )}
          </div>
        </div>

        {/* ── Body: filter sidebar + list column ── */}
        <div className={styles.bodyGrid}>
          <aside className={styles.filterSide} aria-label="Filters">
            {brands.length > 1 && (
              <div className={styles.sideGroup}>
                <h3 className={styles.sideGroupLabel}>
                  <Factory size={11} aria-hidden /> Manufacturer
                </h3>
                <div className={styles.chipList}>
                  {brands.map((b) => {
                    const isActive = activeBrands.has(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                        onClick={() => toggleBrand(b)}
                      >
                        {b}
                        {isActive && <X size={9} className={styles.chipX} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {suppliers.length > 1 && (
              <div className={styles.sideGroup}>
                <h3 className={styles.sideGroupLabel}>
                  <Truck size={11} aria-hidden /> Distributor
                </h3>
                <div className={styles.chipList}>
                  {suppliers.map((s) => {
                    const isActive = activeSuppliers.has(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
                        onClick={() => toggleSupplier(s)}
                      >
                        {s}
                        {isActive && <X size={9} className={styles.chipX} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.sideGroup}>
              <h3 className={styles.sideGroupLabel}>Availability</h3>
              <div
                className={`${styles.segmented} ${styles.segmentedBlock}`}
                role="group"
                aria-label="Availability"
              >
                {([
                  { id: 'all', label: 'All' },
                  { id: 'in-stock', label: 'In Stock' },
                  { id: 'backorder', label: 'Backorder' },
                ] as { id: Availability; label: string }[]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${styles.segmentedBtn} ${availability === opt.id ? styles.segmentedBtnActive : ''}`}
                    onClick={() => setAvailability(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {priceMax > priceMin && (
              <div className={styles.sideGroup}>
                <h3 className={styles.sideGroupLabel}>
                  Price
                  <span className={styles.priceValue}>
                    {fmt(priceRange[0])} – {fmt(priceRange[1])}
                  </span>
                </h3>
                <div
                  ref={priceRangeWrapRef}
                  className={styles.rangeWrap}
                  onPointerDownCapture={(e) => {
                    if (priceMax <= priceMin) return;
                    const el = priceRangeWrapRef.current;
                    if (!el) return;
                    const rect = el.getBoundingClientRect();
                    const thumb = nearestPriceRangeThumb(
                      e.clientX,
                      rect,
                      priceRange[0],
                      priceRange[1],
                      priceMin,
                      priceMax,
                    );
                    flushSync(() => setActivePriceThumb(thumb));
                  }}
                >
                  <div className={styles.rangeTrack} aria-hidden />
                  <div
                    className={styles.rangeFill}
                    aria-hidden
                    style={{
                      left: `${((priceRange[0] - priceMin) / (priceMax - priceMin)) * 100}%`,
                      right: `${100 - ((priceRange[1] - priceMin) / (priceMax - priceMin)) * 100}%`,
                    }}
                  />
                  <input
                    type="range"
                    className={styles.rangeInput}
                    style={{ zIndex: activePriceThumb === 'min' ? 2 : 1 }}
                    min={priceMin}
                    max={priceMax}
                    value={priceRange[0]}
                    aria-label="Minimum price"
                    onChange={(e) => {
                      const v = Math.min(Number(e.target.value), priceRange[1]);
                      setPriceRange([v, priceRange[1]]);
                    }}
                  />
                  <input
                    type="range"
                    className={styles.rangeInput}
                    style={{ zIndex: activePriceThumb === 'max' ? 2 : 1 }}
                    min={priceMin}
                    max={priceMax}
                    value={priceRange[1]}
                    aria-label="Maximum price"
                    onChange={(e) => {
                      const v = Math.max(Number(e.target.value), priceRange[0]);
                      setPriceRange([priceRange[0], v]);
                    }}
                  />
                </div>
              </div>
            )}
          </aside>

          <div className={styles.listSide}>
            {/* List header with sort */}
            <div className={styles.modalListHead}>
              <span>
                Alternative parts
                {alternativeCount > 0 && (
                  <span className={styles.altCount}> · {alternativeCount} available</span>
                )}
              </span>
              <div className={styles.listControls}>
                <button
                  type="button"
                  className={`${styles.sortBtn} ${priceSort !== 'none' ? styles.sortBtnActive : ''}`}
                  onClick={cyclePriceSort}
                  title={priceSort === 'none' ? 'Sort by price' : priceSort === 'asc' ? 'Price: low to high' : 'Price: high to low'}
                >
                  {priceSort === 'none' && <><ArrowUpDown size={11} /> Price</>}
                  {priceSort === 'asc' && <><ArrowUp size={11} /> Price: Low</>}
                  {priceSort === 'desc' && <><ArrowDown size={11} /> Price: High</>}
                </button>
                <span className={styles.modalListCount}>{modalFiltered.length} shown</span>
              </div>
            </div>

            {/* Scrollable parts list */}
            <div className={styles.modalListScroll}>
              {modalFiltered.length === 0 ? (
                <div className={styles.modalEmpty}>
                  <p className={styles.emptyTitle}>No matching parts</p>
                  <p className={styles.emptyHint}>
                    Try a different search term or clear your filters to see all alternatives.
                  </p>
                </div>
              ) : (
                <ul className={styles.invList}>
                  {modalFiltered.map((inv) => {
                    const isCurrent = inv.partNo === item.partNo;
                    const qty = allocations[inv.partNo] ?? 0;
                    const lineCost = inv.unitCost * (qty || item.qty);
                    const hasAllocation = qty > 0;
                    const delta = !isCurrent && qty > 0
                      ? priceDelta(item.unitCost * qty, inv.unitCost * qty)
                      : null;
                    const stock = stockLabel(inv);
                    return (
                      <li
                        key={inv.partNo}
                        className={[
                          styles.invRow,
                          isCurrent ? styles.invRowCurrent : '',
                          hasAllocation ? styles.invRowAllocated : '',
                        ].join(' ')}
                      >
                        <div className={styles.invRowMain}>
                          <span className={styles.invPrimary}>
                            <span
                              className={`${styles.stockDot} ${stock.cls}`}
                              aria-label={stock.text}
                              title={stock.text}
                            />
                            <span className={styles.invBrand}>{inv.brand}</span>
                            {isCurrent && <span className={styles.currentTag}>Current</span>}
                            <span className={styles.invDesc}>{inv.description}</span>
                          </span>
                          <span className={styles.invMetaLine}>
                            <span className={styles.invPart}>{inv.partNo}</span>
                            <span className={styles.invMetaDot} aria-hidden />
                            <span className={styles.invSupplier}>
                              <Truck size={9} aria-hidden />
                              {inv.supplier}
                            </span>
                          </span>
                        </div>
                        <div className={styles.invRowRight}>
                          <div className={styles.priceBlock}>
                            <span className={styles.invCost}>{fmt(lineCost)}</span>
                            <span className={styles.invUnitCost}>
                              {fmt(inv.unitCost)} × {qty || item.qty}
                              {delta && (
                                <span className={`${styles.priceDelta} ${delta.cls}`}>{delta.label}</span>
                              )}
                            </span>
                          </div>
                          <Stepper
                            value={qty}
                            onDec={() => dec(inv.partNo)}
                            onInc={() => inc(inv.partNo)}
                            labelBrand={inv.brand}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Apply bar ── */}
        <div className={styles.applyBar}>
          <div className={styles.applyTotals}>
            <div className={styles.applyQty}>
              <span className={styles.applyQtyNum}>{totalAllocated}</span>
              <span className={styles.applyQtySep}>/</span>
              <span className={styles.applyQtyTarget}>{item.qty}</span>
              <span className={styles.applyQtyUnit}>{item.unit}</span>
              {qtyDelta !== 0 && (
                <span
                  className={`${styles.applyQtyDelta} ${qtyDelta > 0 ? styles.applyDeltaPlus : styles.applyDeltaMinus}`}
                  title={qtyDelta > 0 ? 'Over-allocated — line qty will increase' : 'Under-allocated — line qty will decrease'}
                >
                  {qtyDelta > 0 ? `+${qtyDelta}` : qtyDelta}
                </span>
              )}
              {hiddenAllocated > 0 && (
                <span className={styles.applyHidden} title="Allocated parts hidden by current filters">
                  {hiddenAllocated} hidden
                </span>
              )}
            </div>
            <div className={styles.applyCost}>
              <span className={styles.applyCostValue}>{fmt(totalCost)}</span>
              {costDelta && (
                <span className={`${styles.priceDelta} ${costDelta.cls}`}>{costDelta.label}</span>
              )}
            </div>
          </div>

          <div className={styles.applyActions}>
            <button type="button" className={styles.modalBtnGhost} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={apply}
              disabled={!canApply}
            >
              {applyLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Compact qty stepper (left: minus, center: value, right: plus) ── */
function Stepper({
  value,
  onDec,
  onInc,
  labelBrand,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  labelBrand: string;
}) {
  const isZero = value === 0;
  return (
    <div
      className={`${styles.stepper} ${isZero ? styles.stepperZero : styles.stepperActive}`}
      role="group"
      aria-label={`Quantity for ${labelBrand}`}
    >
      <button
        type="button"
        className={styles.stepperBtn}
        onClick={onDec}
        disabled={isZero}
        aria-label={`Decrease ${labelBrand}`}
      >
        <Minus size={11} strokeWidth={2.5} />
      </button>
      <span className={styles.stepperVal} aria-live="polite">{value}</span>
      <button
        type="button"
        className={styles.stepperBtn}
        onClick={onInc}
        aria-label={`Increase ${labelBrand}`}
      >
        <Plus size={11} strokeWidth={2.5} />
      </button>
    </div>
  );
}
