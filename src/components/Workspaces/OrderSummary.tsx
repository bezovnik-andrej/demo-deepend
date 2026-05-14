import { useState, useMemo, useEffect } from 'react';
import { Check, Package, ShoppingCart, PackageCheck } from 'lucide-react';
import { useApp } from '../../store';
import { inventoryForLine } from '../../data/inventory';
import type { BOMLineRef } from '../../data/inventory';
import type { ItemStatus } from '../../types';
import styles from './ordersummary.module.css';

interface BOMRow extends BOMLineRef {
  id: string;
}

interface DisplayRow {
  id: string;
  partNo: string;
  brand: string;
  description: string;
  category: string;
  supplier: string;
  qty: number;
  unit: string;
  unitCost: number;
  extCost: number;
  wasCheaper: boolean;
  savedPerUnit: number;
}

/* A real PO — one vendor, one shipment, one invoice. A single vendor on a
   project typically receives 3–4 distinct POs (phased purchases split by
   category / delivery batch), so we slice each vendor's items into multiple
   orders keyed by (supplier, category, batch). */
interface OrderGroup {
  id: string;
  supplier: string;
  category: string;
  poNumber: string;
  orderDate: string;
  items: DisplayRow[];
  subtotal: number;
}

/* Which part lifecycle statuses land in each tab. `not-required` is excluded
   from every Orders view — those parts never need to be purchased. */
export type OrderTab = 'pending' | 'placed' | 'completed';

const TAB_TO_STATUS: Record<OrderTab, ItemStatus> = {
  pending: 'to-purchase',
  placed: 'on-order',
  completed: 'purchased',
};

const TAB_LABEL: Record<OrderTab, string> = {
  pending: 'Pending',
  placed: 'Placed',
  completed: 'Completed',
};

const TAB_ORDER: OrderTab[] = ['pending', 'placed', 'completed'];

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtFull(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

/* Stable deterministic vendor SKU derived from (supplier, partNo). Demo-only —
   when a real vendor-catalog field is added to ProjectItem, swap this helper
   for a direct field read. No call sites outside this file need to change. */
function vendorSkuOf(supplier: string, partNo: string): string {
  const prefix = supplier.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'VND';
  let h = 0;
  const key = `${supplier}:${partNo}`;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  const n = Math.abs(h) % 100000;
  return `${prefix}-${n.toString().padStart(5, '0')}`;
}

function hashStr(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* Stable PO number for a given (supplier, category, batchIdx). Keeps numbers
   identical across re-renders so the master list doesn't "churn" on every
   keystroke elsewhere in the app. */
function poNumberFor(supplier: string, category: string, batchIdx: number): string {
  const prefix = supplier.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'PO';
  const n = hashStr(`${supplier}:${category}:${batchIdx}`) % 10000;
  return `PO-${prefix}-${n.toString().padStart(4, '0')}`;
}

/* Plausible calendar dates stamped onto each PO so the UI feels like real
   procurement history rather than a computed view. */
const ORDER_DATE_POOL = [
  'Mar 18', 'Mar 25', 'Apr 1', 'Apr 8', 'Apr 15', 'Apr 22', 'May 1', 'May 8', 'May 15', 'May 22',
];
function orderDateFor(supplier: string, category: string, batchIdx: number): string {
  return ORDER_DATE_POOL[hashStr(`${supplier}|${category}|${batchIdx}|date`) % ORDER_DATE_POOL.length];
}

/* A single vendor often receives 3–4 distinct POs on a project: parts go out
   in phases (early-pour hardware, mechanical skid, finish materials, trim-out)
   and each phase is a separate purchase order. We model that by splitting a
   vendor's items first by category (different phases usually map to different
   categories) and then chunking large categories into PO-sized batches. */
const MAX_ITEMS_PER_ORDER = 3;

function buildOrdersFromRows(rows: DisplayRow[]): OrderGroup[] {
  const byKey = new Map<string, DisplayRow[]>();
  for (const r of rows) {
    const key = `${r.supplier}__${r.category}`;
    const existing = byKey.get(key);
    if (existing) existing.push(r);
    else byKey.set(key, [r]);
  }
  const orders: OrderGroup[] = [];
  for (const [key, items] of byKey) {
    const [supplier, category] = key.split('__');
    for (let i = 0; i < items.length; i += MAX_ITEMS_PER_ORDER) {
      const chunk = items.slice(i, i + MAX_ITEMS_PER_ORDER);
      const batchIdx = Math.floor(i / MAX_ITEMS_PER_ORDER);
      orders.push({
        id: `${supplier}__${category}__${batchIdx}`,
        supplier,
        category,
        poNumber: poNumberFor(supplier, category, batchIdx),
        orderDate: orderDateFor(supplier, category, batchIdx),
        items: chunk,
        subtotal: chunk.reduce((s, r) => s + r.extCost, 0),
      });
    }
  }
  return orders.sort((a, b) => b.subtotal - a.subtotal);
}

interface OrderSummaryProps {
  rows: BOMRow[];
  cheapestMode: boolean;
  /** Lets the parent hide procurement actions (e.g. Show Cheapest) per tab. */
  onActiveTabChange?: (tab: OrderTab) => void;
}

export function OrderSummary({ rows, cheapestMode, onActiveTabChange }: OrderSummaryProps) {
  const { dispatch } = useApp();

  /* The active lifecycle tab drives which rows are visible and which action
     (if any) appears in the detail footer. It is the single source of truth
     for the order workflow — no parallel "ordered suppliers" state to drift. */
  const [activeTab, setActiveTab] = useState<OrderTab>('pending');
  const [selectedOrderByTab, setSelectedOrderByTab] = useState<Record<OrderTab, string | null>>({
    pending: null,
    placed: null,
    completed: null,
  });
  const [orderToast, setOrderToast] = useState<string | null>(null);

  useEffect(() => {
    onActiveTabChange?.(activeTab);
    // Intentionally once on mount: remount (e.g. leaving Orders and returning) must
    // realign the parent with this panel's initial tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orderToast) return;
    const timer = window.setTimeout(() => setOrderToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [orderToast]);

  /* Normalize a single raw row into a DisplayRow, applying cheapest-mode
     vendor/part substitution when enabled. Extracted so we can do it per-tab
     for accurate tab counts without duplicating the branching logic. */
  const normalizeRow = (row: BOMRow): DisplayRow => {
    if (!cheapestMode) {
      return {
        id: row.id,
        partNo: row.partNo,
        brand: row.brand,
        description: row.description,
        category: row.category,
        supplier: row.supplier,
        qty: row.qty,
        unit: row.unit,
        unitCost: row.unitCost,
        extCost: row.qty * row.unitCost,
        wasCheaper: false,
        savedPerUnit: 0,
      };
    }
    const lineRef: BOMLineRef = {
      partNo: row.partNo, brand: row.brand, description: row.description,
      category: row.category, qty: row.qty, unit: row.unit,
      supplier: row.supplier, status: row.status, unitCost: row.unitCost,
    };
    const alts = inventoryForLine(lineRef);
    if (alts.length <= 1) {
      return {
        id: row.id,
        partNo: row.partNo,
        brand: row.brand,
        description: row.description,
        category: row.category,
        supplier: row.supplier,
        qty: row.qty,
        unit: row.unit,
        unitCost: row.unitCost,
        extCost: row.qty * row.unitCost,
        wasCheaper: false,
        savedPerUnit: 0,
      };
    }
    const cheapest = alts.reduce((best, alt) => alt.unitCost < best.unitCost ? alt : best, alts[0]);
    const saved = row.unitCost - cheapest.unitCost;
    return {
      id: row.id,
      partNo: cheapest.partNo,
      brand: cheapest.brand,
      description: cheapest.description,
      category: row.category,
      supplier: cheapest.supplier,
      qty: row.qty,
      unit: row.unit,
      unitCost: cheapest.unitCost,
      extCost: row.qty * cheapest.unitCost,
      wasCheaper: saved > 0,
      savedPerUnit: saved,
    };
  };

  /* Build orders for every tab up front so the tab-count pills and the active
     list stay in sync. Each (supplier, category) cluster is chunked into POs
     of at most MAX_ITEMS_PER_ORDER items to mirror how vendors actually
     receive 3–4 distinct POs per project. */
  const ordersByTab = useMemo<Record<OrderTab, OrderGroup[]>>(() => {
    const out: Record<OrderTab, OrderGroup[]> = { pending: [], placed: [], completed: [] };
    for (const tab of TAB_ORDER) {
      const targetStatus = TAB_TO_STATUS[tab];
      const tabRows = rows
        .filter((r) => r.qty > 0 && r.supplier && r.status === targetStatus)
        .map(normalizeRow);
      out[tab] = buildOrdersFromRows(tabRows);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cheapestMode]);

  const tabCounts = useMemo<Record<OrderTab, number>>(() => ({
    pending: ordersByTab.pending.length,
    placed: ordersByTab.placed.length,
    completed: ordersByTab.completed.length,
  }), [ordersByTab]);

  const orderGroups = ordersByTab[activeTab];

  /* Keep an order selected in the detail pane whenever the current tab has
     groups. This survives tab changes, status transitions, and cheapestMode
     toggles that can swap suppliers (and therefore PO numbers) under the
     hood. */
  const effectiveSelectedId = useMemo<string | null>(() => {
    if (orderGroups.length === 0) return null;
    const selectedOrderId = selectedOrderByTab[activeTab];
    if (selectedOrderId && orderGroups.some((g) => g.id === selectedOrderId)) {
      return selectedOrderId;
    }
    return orderGroups[0].id;
  }, [activeTab, selectedOrderByTab, orderGroups]);

  const selectedGroup = orderGroups.find((g) => g.id === effectiveSelectedId);

  /* Bulk status transitions. Moving parts through the lifecycle is the entire
     "place/receive" UX — there is no separate draft-order entity. Because
     splitting into orders is deterministic, the same (supplier, category,
     batchIdx) slice will re-materialize on the destination tab with its
     original PO number — we reselect it there. */
  const transitionGroup = (group: OrderGroup, nextStatus: ItemStatus, nextTab: OrderTab) => {
    for (const item of group.items) {
      dispatch({
        type: 'UPDATE_PROJECT_ITEM',
        id: item.id,
        patch: { status: nextStatus },
      });
    }
    setActiveTab(nextTab);
    onActiveTabChange?.(nextTab);
    setSelectedOrderByTab((prev) => ({ ...prev, [nextTab]: group.id }));
    if (nextStatus === 'on-order') {
      setOrderToast(`${group.poNumber} sent to ${group.supplier}`);
    }
  };

  const selectTab = (tab: OrderTab) => {
    setActiveTab(tab);
    onActiveTabChange?.(tab);
  };

  const tabsBar = (
    <div className={styles.tabBar} role="tablist" aria-label="Order status">
      {TAB_ORDER.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
            onClick={() => selectTab(tab)}
          >
            <span className={styles.tabLabel}>{TAB_LABEL[tab]}</span>
            <span className={styles.tabCount}>{tabCounts[tab]}</span>
          </button>
        );
      })}
    </div>
  );

  const tabChipClass = (tab: OrderTab): string => {
    if (tab === 'pending') return styles.orderStatusDraft;
    if (tab === 'placed') return styles.orderStatusPlaced;
    return styles.orderStatusCompleted;
  };

  const tabChipLabel = (tab: OrderTab): React.ReactNode => {
    if (tab === 'pending') return <>Pending</>;
    if (tab === 'placed') return <>Placed</>;
    return <><Check size={11} /> Completed</>;
  };

  return (
    <div className={styles.outer}>
      <div className={styles.split}>
        {/* ── Master pane: status tabs + supplier list ── */}
        <aside className={styles.masterPane}>
          <div className={styles.masterHeader}>{tabsBar}</div>

          {orderGroups.length === 0 ? (
            <div className={styles.masterEmpty}>
              <Package size={20} />
              <span className={styles.masterEmptyText}>
                {activeTab === 'pending' && 'No pending orders. Add parts from the Procurement list tab to create one.'}
                {activeTab === 'placed' && 'No orders placed yet. Place a pending order to see it here.'}
                {activeTab === 'completed' && 'No completed orders yet.'}
              </span>
            </div>
          ) : (
            <div className={styles.masterList} role="listbox" aria-label={`${TAB_LABEL[activeTab]} orders`}>
              {orderGroups.map((group) => {
                const isSelected = group.id === effectiveSelectedId;
                const dateLabel =
                  activeTab === 'pending' ? 'Draft' :
                  activeTab === 'placed' ? `Ordered ${group.orderDate}` :
                  `Received ${group.orderDate}`;
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`${styles.listItem} ${isSelected ? styles.listItemSelected : ''}`}
                    onClick={() => setSelectedOrderByTab((prev) => ({ ...prev, [activeTab]: group.id }))}
                  >
                    <div className={styles.listItemTopRow}>
                      <span className={`${styles.orderStatusChip} ${tabChipClass(activeTab)}`}>
                        {tabChipLabel(activeTab)}
                      </span>
                      <span className={styles.listItemTotal}>{fmt(group.subtotal)}</span>
                    </div>
                    <div className={styles.listItemMidRow}>
                      <span className={styles.listItemSupplier}>{group.supplier}</span>
                      <span className={styles.listItemPo}>{group.poNumber}</span>
                    </div>
                    <div className={styles.listItemBottomRow}>
                      <span className={styles.listItemMeta}>
                        {group.category} · {group.items.length} item{group.items.length !== 1 && 's'}
                      </span>
                      <span className={styles.listItemMeta}>{dateLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* ── Detail pane ── */}
        <section className={styles.detailPane}>
          {selectedGroup ? (
            (() => {
              const group = selectedGroup;
              const groupSavings = cheapestMode
                ? group.items.reduce((s, r) => s + r.qty * r.savedPerUnit, 0)
                : 0;
              return (
                <>
                  <div className={styles.detailPaneHeader}>
                    <div className={styles.detailHeaderLeft}>
                      <div className={styles.detailHeaderTitles}>
                        <span className={styles.detailTitle}>{group.poNumber}</span>
                        <span className={styles.detailSubtitle}>
                          {group.supplier} · {group.category}
                          {activeTab !== 'pending' && (
                            <>
                              {' · '}
                              {activeTab === 'placed' ? 'Ordered ' : 'Received '}
                              {group.orderDate}
                            </>
                          )}
                        </span>
                      </div>
                      <span className={`${styles.orderStatusChip} ${tabChipClass(activeTab)}`}>
                        {tabChipLabel(activeTab)}
                      </span>
                    </div>
                    <span className={styles.detailHeaderMeta}>
                      {group.items.length} item{group.items.length !== 1 && 's'} · {fmt(group.subtotal)}
                    </span>
                  </div>

                  {cheapestMode && groupSavings > 0 && activeTab === 'pending' && (
                    <div className={styles.detailSavingsChip}>
                      <Check size={12} />
                      Optimized — saving <strong>{fmt(groupSavings)}</strong> on this order
                    </div>
                  )}

                  <div className={styles.detailTableWrap}>
                    <table className={styles.detailTable}>
                      <thead>
                        <tr>
                          <th className={styles.tdName}>Name</th>
                          <th className={styles.tdMfr}>Mfr Part #</th>
                          <th className={styles.tdVendor}>Vendor #</th>
                          <th className={styles.tdQty}>Qty</th>
                          <th className={styles.tdUnit}>Unit</th>
                          <th className={styles.tdUnitCost}>Unit Cost</th>
                          <th className={styles.tdTotal}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => {
                          const vendorSku = vendorSkuOf(item.supplier, item.partNo);
                          return (
                            <tr key={item.id}>
                              <td className={styles.tdName}>
                                <span className={styles.cellName}>{item.description}</span>
                                <span className={styles.cellBrand}>{item.brand}</span>
                              </td>
                              <td className={styles.tdMfr}>{item.partNo}</td>
                              <td className={styles.tdVendor}>{vendorSku}</td>
                              <td className={styles.tdQty}>{item.qty}</td>
                              <td className={styles.tdUnit}>{item.unit}</td>
                              <td className={styles.tdUnitCost}>
                                <span>{fmtFull(item.unitCost)}</span>
                                {item.wasCheaper && activeTab === 'pending' && (
                                  <span className={styles.cellSaved}>
                                    saved {fmtFull(item.savedPerUnit)}/ea
                                  </span>
                                )}
                              </td>
                              <td className={styles.tdTotal}>{fmt(item.extCost)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.detailPaneFooter}>
                    <div className={styles.detailFooterSubtotal}>
                      <span className={styles.detailFooterLabel}>Subtotal</span>
                      <span className={styles.detailFooterValue}>{fmt(group.subtotal)}</span>
                    </div>
                    {activeTab === 'pending' && (
                      <button
                        type="button"
                        className={styles.placeOrderBtn}
                        onClick={() => transitionGroup(group, 'on-order', 'placed')}
                      >
                        <ShoppingCart size={13} /> Place Order
                      </button>
                    )}
                    {activeTab === 'placed' && (
                      <button
                        type="button"
                        className={styles.placeOrderBtn}
                        onClick={() => transitionGroup(group, 'purchased', 'completed')}
                      >
                        <PackageCheck size={13} /> Mark Received
                      </button>
                    )}
                    {activeTab === 'completed' && (
                      <span className={styles.completedNote}>
                        <Check size={13} /> All items received
                      </span>
                    )}
                  </div>
                </>
              );
            })()
          ) : (
            <div className={styles.emptyPane}>
              <Package size={24} />
              <span>
                {activeTab === 'pending' && 'Select a pending order to review and place it.'}
                {activeTab === 'placed' && 'Select a placed order to mark items received.'}
                {activeTab === 'completed' && 'Select a completed order to review its items.'}
              </span>
            </div>
          )}
        </section>
      </div>
      {orderToast && (
        <div className={styles.orderToast} role="status" aria-live="polite">
          <Check size={14} aria-hidden="true" />
          <span>{orderToast}</span>
        </div>
      )}
    </div>
  );
}
