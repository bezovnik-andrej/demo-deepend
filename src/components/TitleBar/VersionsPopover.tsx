import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Plus, ChevronRight, Clock } from 'lucide-react';
import { getMember, formatBytes } from '../../data/projectHistory';
import { useApp } from '../../store';
import styles from './VersionsPopover.module.css';

const MAX_VISIBLE = 4;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const same = d.toDateString() === now.toDateString();
  if (same) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function VersionsPopover() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { state, dispatch } = useApp();
  const { projectFiles } = state;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const planSetFiles = projectFiles
    .filter((f) => f.folderId === 'plan-sets')
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const visible = planSetFiles.slice(0, MAX_VISIBLE);
  const totalFiles = projectFiles.length;

  const openBrowse = (fileId?: string) => {
    if (fileId) dispatch({ type: 'SELECT_FILE', fileId });
    else dispatch({ type: 'SET_FILES_VIEW', view: 'browse' });
    setOpen(false);
  };

  const openHistory = () => {
    dispatch({ type: 'SET_FILES_VIEW', view: 'activity' });
    setOpen(false);
  };

  const handleSave = () => {
    dispatch({ type: 'SAVE_PROJECT' });
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Recent saves"
        aria-label="Recent saves"
        aria-expanded={open}
      >
        <FolderOpen size={15} />
      </button>

      {open && (
        <div className={styles.popover} role="dialog" aria-label="Recent saves">
          <header className={styles.head}>
            <div>
              <div className={styles.headTitle}>Recent saves</div>
              <div className={styles.headSub}>
                {totalFiles} files in Plan Sets
              </div>
            </div>
            <button className={styles.saveBtn} onClick={handleSave}>
              <Plus size={12} /> Save new
            </button>
          </header>

          <ul className={styles.list}>
            {visible.map((file) => {
              const author = getMember(file.savedBy);
              return (
                <li key={file.id}>
                  <button
                    className={styles.row}
                    onClick={() => openBrowse(file.id)}
                  >
                    <span className={styles.rowMain}>
                      <span className={styles.rowTop}>
                        <span className={styles.rowLabel}>{file.version}</span>
                      </span>
                      <span className={styles.rowTitle}>{file.filename}</span>
                      <span className={styles.rowMeta}>
                        <span className={styles.avatar} style={{ background: author.color }}>
                          {author.initials}
                        </span>
                        <span>{author.name}</span>
                        <span className={styles.dotSep} />
                        <span className={styles.rowDate}>{formatDate(file.savedAt)}</span>
                        <span className={styles.dotSep} />
                        <span>{formatBytes(file.sizeBytes)}</span>
                      </span>
                    </span>
                    <ChevronRight size={12} className={styles.rowArrow} />
                  </button>
                </li>
              );
            })}
          </ul>

          <footer className={styles.foot}>
            <button className={styles.footLink} onClick={() => openBrowse()}>
              <FolderOpen size={12} /> All files
            </button>
            <button type="button" className={styles.footLink} onClick={openHistory}>
              <Clock size={12} /> Saves log
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
