import type { ProjectItem } from '../types';
import { inventoryPickToProjectPatch } from './inventory';
import type { SwapAllocation } from '../components/ui/SwapModal';

/**
 * Recursive lookup so the allocation split can inherit parent-only fields
 * (color, interaction, markup, configuratorSection, etc.) when building
 * new child ProjectItems.
 */
export function findItemById(items: ProjectItem[], id: string): ProjectItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findItemById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

export interface SwapTarget {
  id: string;
  partNo: string;
  qty: number;
}

export type SwapPatch =
  | { type: 'single'; id: string; patch: Partial<ProjectItem> }
  | { type: 'split'; id: string; patch: { children: ProjectItem[] } };

/**
 * Compute the dispatch patch(es) for a swap allocation.
 *
 * - 1 SKU  -> patch the leaf in place (preserves identity + markup).
 * - >1 SKU -> convert the leaf into a parent with one child per allocation.
 *
 * Returns `null` when no change is needed (same part, same qty, or empty).
 */
export function computeSwapPatch(
  target: SwapTarget,
  allocations: SwapAllocation[],
  projectItems: ProjectItem[],
): SwapPatch | null {
  if (allocations.length === 0) return null;

  if (allocations.length === 1) {
    const { inv, qty } = allocations[0];
    if (inv.partNo === target.partNo && qty === target.qty) return null;
    return {
      type: 'single',
      id: target.id,
      patch: { ...inventoryPickToProjectPatch(inv), qty },
    };
  }

  const parent = findItemById(projectItems, target.id);
  if (!parent) return null;

  const children: ProjectItem[] = allocations.map(({ inv, qty }) => {
    const patch = inventoryPickToProjectPatch(inv);
    return {
      id: `${parent.id}--${inv.partNo}`,
      name: patch.name ?? inv.description,
      category: parent.category,
      color: parent.color,
      qty,
      unit: inv.unit,
      price: inv.unitCost,
      markup: parent.markup,
      visible: parent.visible,
      partNo: inv.partNo,
      brand: inv.brand,
      description: inv.description,
      supplier: inv.supplier,
      status: inv.status,
      interaction: parent.interaction,
      configuratorSection: parent.configuratorSection,
    };
  });

  return { type: 'split', id: target.id, patch: { children } };
}
