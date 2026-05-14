import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Search, Eye, EyeOff, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useApp } from '../../store';
import { subtotal } from '../../data/projectItems';
import { inventoryForLine } from '../../data/inventory';
import type { BOMLineRef } from '../../data/inventory';
import { computeSwapPatch } from '../../data/projectItemSwap';
import { SwapModal } from '../ui/SwapModal';
import type { SwapAllocation } from '../ui/SwapModal';
import type { ProjectItem } from '../../types';
import styles from './DesignLayersPanel.module.css';

const OBJECTS_PANEL_WIDTH_KEY = 'norveo-design-objects-panel-width';
const DEFAULT_PANEL_WIDTH = 220;
const MIN_PANEL_WIDTH = 160;
const MAX_PANEL_WIDTH = 560;

function readStoredPanelWidth(): number {
  try {
    const raw = localStorage.getItem(OBJECTS_PANEL_WIDTH_KEY);
    if (!raw) return DEFAULT_PANEL_WIDTH;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return DEFAULT_PANEL_WIDTH;
    return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, n));
  } catch {
    return DEFAULT_PANEL_WIDTH;
  }
}

function formatQty(node: ProjectItem): string | null {
  if (!node.qty || !node.unit) return null;
  return `${node.qty.toLocaleString()}`;
}

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function itemToLineRef(item: ProjectItem): BOMLineRef {
  return {
    partNo: item.partNo,
    brand: item.brand,
    description: item.description,
    category: item.category,
    qty: item.qty,
    unit: item.unit,
    supplier: item.supplier,
    status: item.status,
    unitCost: item.price,
  };
}

interface LayerNodeProps {
  node: ProjectItem;
  depth?: number;
  onSwapRequest: (item: ProjectItem) => void;
}

function LayerNode({ node, depth = 0, onSwapRequest }: LayerNodeProps) {
  const { dispatch } = useApp();
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;
  const qty = formatQty(node);
  const cost = subtotal(node);

  const altsCount = useMemo(() => {
    if (!isLeaf) return 0;
    return inventoryForLine(itemToLineRef(node)).length;
  }, [isLeaf, node]);

  const hasAlternatives = altsCount > 1;

  const toggleVisibility = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: 'UPDATE_PROJECT_ITEM', id: node.id, patch: { visible: !node.visible } });
    },
    [dispatch, node.id, node.visible],
  );

  const handleRowClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (hasAlternatives) {
      onSwapRequest(node);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick();
    }
  };

  const rowClass = [
    styles.row,
    !node.visible ? styles.rowHidden : '',
    isLeaf && hasAlternatives ? styles.rowSwappable : '',
    isLeaf && !hasAlternatives ? styles.rowInert : '',
  ].filter(Boolean).join(' ');

  return (
    <div>
      <div
        className={rowClass}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        role={isLeaf && hasAlternatives ? 'button' : undefined}
        tabIndex={isLeaf && hasAlternatives ? 0 : undefined}
        title={isLeaf && hasAlternatives ? 'Change part' : isLeaf ? 'No alternatives available' : undefined}
        onClick={handleRowClick}
        onKeyDown={isLeaf && hasAlternatives ? handleKeyDown : undefined}
      >
        {hasChildren ? (
          <button type="button" className={styles.chevron} onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <span className={styles.chevronSpace} />
        )}

        <button type="button" className={styles.eyeBtn} onClick={toggleVisibility} title={node.visible ? 'Hide layer' : 'Show layer'}>
          {node.visible ? <Eye size={10} /> : <EyeOff size={10} />}
        </button>

        <span className={styles.dot} style={{ background: node.color }} />

        <span className={styles.name}>
          {node.name}
        </span>

        {cost > 0 && (
          <span className={styles.cost}>{fmt(cost)}</span>
        )}

        {qty && (
          <span className={styles.qty}>
            {qty} <span className={styles.unit}>{node.unit}</span>
          </span>
        )}
      </div>

      {expanded && hasChildren && node.children!.map((child) => (
        <LayerNode key={child.id} node={child} depth={depth + 1} onSwapRequest={onSwapRequest} />
      ))}
    </div>
  );
}

export function DesignLayersPanel() {
  const { state, dispatch } = useApp();
  const [swapItem, setSwapItem] = useState<ProjectItem | null>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const [panelWidth, setPanelWidth] = useState(readStoredPanelWidth);
  const panelWidthRef = useRef(panelWidth);
  useEffect(() => {
    panelWidthRef.current = panelWidth;
  }, [panelWidth]);

  const startResize = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startW = panelWidthRef.current;
    const maxW = Math.min(MAX_PANEL_WIDTH, Math.round(window.innerWidth * 0.5));

    const onMove = (ev: PointerEvent) => {
      const next = Math.min(maxW, Math.max(MIN_PANEL_WIDTH, startW + (ev.clientX - startX)));
      panelWidthRef.current = next;
      setPanelWidth(next);
    };

    const onEnd = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      try {
        localStorage.setItem(OBJECTS_PANEL_WIDTH_KEY, String(panelWidthRef.current));
      } catch {
        /* ignore */
      }
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
  }, []);

  const allVisible = state.projectItems.every((n) => n.visible);

  const toggleAll = useCallback(() => {
    dispatch({ type: 'TOGGLE_ALL_ITEMS_VISIBILITY', visible: !allVisible });
  }, [dispatch, allVisible]);

  const handleSwapRequest = useCallback((item: ProjectItem) => {
    invokerRef.current = document.activeElement as HTMLElement | null;
    setSwapItem(item);
  }, []);

  const modalInventory = useMemo(
    () => (swapItem ? inventoryForLine(itemToLineRef(swapItem)) : []),
    [swapItem],
  );

  const handleApply = useCallback(
    (allocations: SwapAllocation[]) => {
      if (!swapItem) return;
      const result = computeSwapPatch(
        { id: swapItem.id, partNo: swapItem.partNo, qty: swapItem.qty },
        allocations,
        state.projectItems,
      );
      if (result) {
        dispatch({ type: 'UPDATE_PROJECT_ITEM', id: result.id, patch: result.patch });
      }
      setSwapItem(null);
      requestAnimationFrame(() => invokerRef.current?.focus());
    },
    [swapItem, state.projectItems, dispatch],
  );

  const handleClose = useCallback(() => {
    setSwapItem(null);
    requestAnimationFrame(() => invokerRef.current?.focus());
  }, []);

  return (
    <div className={styles.shell} style={{ width: panelWidth, minWidth: panelWidth }}>
      <div
        className={styles.resizeHandle}
        onPointerDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize objects panel"
        title="Drag to resize"
      />
      <div className={styles.panel}>
        <div className={styles.header}>
          <span>Objects</span>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={toggleAll}
              title={allVisible ? 'Hide all layers' : 'Show all layers'}
            >
              {allVisible ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
            </button>
            <button type="button" className={styles.searchBtn} title="Search objects">
              <Search size={12} />
            </button>
          </div>
        </div>
        <div className={styles.list}>
          {state.projectItems.map((node) => (
            <LayerNode key={node.id} node={node} onSwapRequest={handleSwapRequest} />
          ))}
        </div>

        {swapItem && modalInventory.length > 1 && (
          <SwapModal
            item={itemToLineRef(swapItem)}
            inventory={modalInventory}
            onApply={handleApply}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}
