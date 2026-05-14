import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../store';
import { FILES_VIEW_LABELS } from '../../types';
import type { FilesView } from '../../types';
import { FilesBrowser } from './FilesBrowser';
import { HistoryWorkspace } from './HistoryWorkspace';
import styles from './files.module.css';

export function FilesWorkspace() {
  const { state, dispatch } = useApp();
  const isHistory = state.filesView === 'activity';

  const [browseSearch, setBrowseSearch] = useState('');
  const [browseFolderLabel, setBrowseFolderLabel] = useState('Plan Sets');

  useEffect(() => {
    if (!isHistory) return;
    const t = window.setTimeout(() => setBrowseSearch(''), 0);
    return () => window.clearTimeout(t);
  }, [isHistory]);

  const setView = (view: FilesView) => {
    dispatch({ type: 'SET_FILES_VIEW', view });
  };

  return (
    <div className={styles.outer}>
      <div className={styles.subNav} role="navigation" aria-label="Files workspace">
        <div className={styles.subNavLeft}>
          <div className={styles.seg} role="tablist" aria-label="Folders or project saves">
            <SegTab
              active={!isHistory}
              onClick={() => setView('browse')}
              label={FILES_VIEW_LABELS.browse}
            />
            <SegTab
              active={isHistory}
              onClick={() => setView('activity')}
              label={FILES_VIEW_LABELS.activity}
            />
          </div>
        </div>

        {!isHistory && (
          <div className={styles.browseSearchWrap}>
            <Search size={12} className={styles.browseSearchIcon} aria-hidden />
            <input
              id="files-browse-search"
              type="search"
              className={styles.browseSearchInput}
              placeholder={`Search in ${browseFolderLabel}…`}
              value={browseSearch}
              onChange={(e) => setBrowseSearch(e.target.value)}
              aria-label={`Search files in ${browseFolderLabel}`}
              autoComplete="off"
            />
          </div>
        )}
      </div>

      <div className={styles.content}>
        {isHistory ? (
          <HistoryWorkspace />
        ) : (
          <FilesBrowser
            search={browseSearch}
            onSearchChange={setBrowseSearch}
            onActiveFolderLabelChange={setBrowseFolderLabel}
          />
        )}
      </div>
    </div>
  );
}

function SegTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`${styles.segTab} ${active ? styles.segTabActive : ''}`}
      onClick={onClick}
    >
      <span>{label}</span>
    </button>
  );
}
