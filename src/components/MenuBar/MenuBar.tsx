import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../store';
import styles from './MenuBar.module.css';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
}

export function MenuBar() {
  const { state, dispatch } = useApp();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpenMenu(null), []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [close]);

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Project', shortcut: '\u2318N', action: () => dispatch({ type: 'START_NEW_PROJECT' }) },
      { label: 'Open...', shortcut: '\u2318O' },
      { label: 'divider', divider: true },
      { label: 'Save', shortcut: '\u2318S' },
      { label: 'Save As...', shortcut: '\u21E7\u2318S' },
      { label: 'Export...', shortcut: '\u2318E' },
      { label: 'divider', divider: true },
      {
        label: 'Save as Template...',
        action: () => {
          if (state.wizardPhase !== 'workspace') return;
          const name = window.prompt('Template name:', state.data.projectName ? `${state.data.projectName} Template` : 'My Template');
          if (name?.trim()) dispatch({ type: 'SAVE_AS_TEMPLATE', name: name.trim() });
        },
      },
      { label: 'divider', divider: true },
      { label: 'Close', shortcut: '\u2318W' },
    ],
    Edit: [
      { label: 'Undo', shortcut: '\u2318Z' },
      { label: 'Redo', shortcut: '\u21E7\u2318Z' },
      { label: 'divider', divider: true },
      { label: 'Cut', shortcut: '\u2318X' },
      { label: 'Copy', shortcut: '\u2318C' },
      { label: 'Paste', shortcut: '\u2318V' },
      { label: 'Duplicate', shortcut: '\u2318D' },
      { label: 'Delete', shortcut: '\u232B' },
      { label: 'divider', divider: true },
      { label: 'Select All', shortcut: '\u2318A' },
      { label: 'Deselect', shortcut: '\u21E7\u2318A' },
      { label: 'divider', divider: true },
      { label: 'Find...', shortcut: '\u2318F' },
      { label: 'Preferences...' },
    ],
    View: [
      { label: 'Configurator', action: () => dispatch({ type: 'SET_WORKSPACE', workspace: 'configurator' }) },
      { label: 'Project Financials', action: () => dispatch({ type: 'SET_WORKSPACE', workspace: 'bom' }) },
      { label: 'divider', divider: true },
      { label: 'Reset Layout' },
    ],
    Window: [
      { label: 'Reset Layout' },
      { label: 'divider', divider: true },
      { label: 'Minimize' },
    ],
    Help: [
      { label: 'Keyboard Shortcuts', shortcut: '\u2318/' },
      { label: 'Documentation' },
      { label: 'divider', divider: true },
      { label: 'About The Deep End' },
    ],
  };

  const handleMenuClick = (key: string) => {
    setOpenMenu(openMenu === key ? null : key);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.divider) return;
    item.action?.();
    close();
  };

  return (
    <div className={styles.bar} ref={barRef}>
      {Object.entries(menus).map(([key, items]) => (
        <div key={key} className={styles.menuWrapper}>
          <button
            className={`${styles.menuTrigger} ${openMenu === key ? styles.menuTriggerOpen : ''}`}
            onClick={() => handleMenuClick(key)}
            onMouseEnter={() => openMenu && setOpenMenu(key)}
          >
            {key}
          </button>
          {openMenu === key && (
            <div className={styles.dropdown}>
              {items.map((item, i) =>
                item.divider ? (
                  <div key={i} className={styles.divider} />
                ) : (
                  <button
                    key={i}
                    className={styles.dropdownItem}
                    onClick={() => handleItemClick(item)}
                  >
                    <span className={styles.itemLabel}>{item.label}</span>
                    {item.shortcut && <span className={styles.itemShortcut}>{item.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
