import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../store';
import type { ProjectItem } from '../../types';
import styles from './RightPanel.module.css';

/**
 * Sum the qty of every leaf descendant under a node so container rows
 * get a meaningful badge ("how many parts live in here").
 */
function leafQtySum(node: ProjectItem): number {
  if (!node.children || node.children.length === 0) {
    return node.qty;
  }
  return node.children.reduce((s, c) => s + leafQtySum(c), 0);
}

interface NodeProps {
  item: ProjectItem;
  depth: number;
  hiddenIds: Set<string>;
  onToggleVisible: (id: string) => void;
}

function TreeNode({ item, depth, hiddenIds, onToggleVisible }: NodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = !!(item.children && item.children.length > 0);
  const visible = !hiddenIds.has(item.id);
  const badgeQty = hasChildren ? leafQtySum(item) : item.qty;

  return (
    <div>
      <div
        className={styles.treeRow}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.treeChevron}
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <span className={styles.treeChevronSpace} />
        )}
        <button
          type="button"
          className={styles.treeVisibility}
          onClick={() => onToggleVisible(item.id)}
          aria-label={visible ? 'Hide' : 'Show'}
        >
          {visible ? <Eye size={10} /> : <EyeOff size={10} />}
        </button>
        {item.color && (
          <span
            className={styles.treeSwatch}
            style={{ background: item.color }}
            aria-hidden
          />
        )}
        <span className={`${styles.treeName} ${!visible ? styles.treeHidden : ''}`}>
          {item.name}
        </span>
        {badgeQty > 0 && (
          <span className={styles.treeBadge} title={item.unit ? `${badgeQty} ${item.unit}` : `${badgeQty}`}>
            {badgeQty}
          </span>
        )}
      </div>
      {expanded && hasChildren && item.children!.map((child) => (
        <TreeNode
          key={child.id}
          item={child}
          depth={depth + 1}
          hiddenIds={hiddenIds}
          onToggleVisible={onToggleVisible}
        />
      ))}
    </div>
  );
}

export function ModelTree() {
  const { state } = useApp();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const items = state.projectItems;

  const totalLeafQty = useMemo(
    () => items.reduce((s, it) => s + leafQtySum(it), 0),
    [items],
  );

  const handleToggleVisible = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (items.length === 0) {
    return <div className={styles.empty}>No model items yet.</div>;
  }

  return (
    <div className={styles.treeWrapper}>
      <div className={styles.treeMeta}>
        <span>{items.length} groups</span>
        <span>·</span>
        <span>{totalLeafQty.toLocaleString()} parts</span>
      </div>
      <div className={styles.treeContainer}>
        {items.map((item) => (
          <TreeNode
            key={item.id}
            item={item}
            depth={0}
            hiddenIds={hiddenIds}
            onToggleVisible={handleToggleVisible}
          />
        ))}
      </div>
    </div>
  );
}
