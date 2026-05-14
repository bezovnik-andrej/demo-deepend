import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ModelTree } from './ModelTree';
import { PropertiesInspector } from './PropertiesInspector';
import styles from './RightPanel.module.css';

type Tab = 'tree' | 'props';

interface Props {
  /** Default tab on mount. */
  defaultTab?: Tab;
  /** Which side of the workspace this panel is anchored to. Defaults to 'right'. */
  side?: 'left' | 'right';
}

export function RightPanel({ defaultTab = 'tree', side = 'right' }: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [collapsed, setCollapsed] = useState(false);

  const sideClass = side === 'left' ? styles.panelLeft : styles.panelRight;

  /* Collapse chevron points "into" the panel: on the left rail it points
     right (expand outward), on the right rail it points left. */
  const collapsedIcon = side === 'left' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />;
  const expandedIcon = side === 'left' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />;

  if (collapsed) {
    return (
      <div className={`${styles.panel} ${sideClass} ${styles.panelCollapsed}`}>
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={() => setCollapsed(false)}
          aria-label="Expand panel"
          title="Expand panel"
        >
          {collapsedIcon}
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.panel} ${sideClass}`}>
      <div className={styles.header}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tree'}
            className={`${styles.tab} ${tab === 'tree' ? styles.tabActive : ''}`}
            onClick={() => setTab('tree')}
          >
            Model Tree
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'props'}
            className={`${styles.tab} ${tab === 'props' ? styles.tabActive : ''}`}
            onClick={() => setTab('props')}
          >
            Properties
          </button>
        </div>
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={() => setCollapsed(true)}
          aria-label="Collapse panel"
          title="Collapse panel"
        >
          {expandedIcon}
        </button>
      </div>
      <div className={styles.content}>
        {tab === 'tree' ? <ModelTree /> : <PropertiesInspector />}
      </div>
    </div>
  );
}
