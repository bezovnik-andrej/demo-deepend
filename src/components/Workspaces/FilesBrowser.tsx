import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Copy,
  ExternalLink,
  Share2,
  FileDown,
  File,
  FileText,
  FileSpreadsheet,
  FileJson2,
  FileType,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  FOLDERS, getMember, formatBytes, fileTypeLabel, getFolderDef,
  type FolderId, type ProjectFile,
} from '../../data/projectHistory';
import { useApp } from '../../store';
import styles from './filesBrowser.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function FileGlyph({
  filename,
  size,
  className,
}: {
  filename: string;
  size: number;
  className?: string;
}) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'xlsx' || ext === 'csv') {
    return <FileSpreadsheet size={size} className={className} strokeWidth={1.75} aria-hidden />;
  }
  if (ext === 'json') {
    return <FileJson2 size={size} className={className} strokeWidth={1.75} aria-hidden />;
  }
  if (ext === 'dwg' || ext === 'dxf') {
    return <FileType size={size} className={className} strokeWidth={1.75} aria-hidden />;
  }
  if (ext === 'pdf') {
    return <FileText size={size} className={className} strokeWidth={1.75} aria-hidden />;
  }
  return <File size={size} className={className} strokeWidth={1.75} aria-hidden />;
}

export interface FilesBrowserProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Updates the parent sub-nav search placeholder when the active folder changes. */
  onActiveFolderLabelChange?: (folderLabel: string) => void;
}

export function FilesBrowser({
  search,
  onSearchChange,
  onActiveFolderLabelChange,
}: FilesBrowserProps) {
  const { state, dispatch } = useApp();
  const { projectFiles } = state;

  const [activeFolderId, setActiveFolderId] = useState<FolderId>('plan-sets');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const listRef = useRef<HTMLTableSectionElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handoffRef = useRef<string | null>(state.selectedFileId);

  /* Cross-workspace handoff: another workspace dispatched SELECT_FILE. */
  useEffect(() => {
    const id = state.selectedFileId;
    if (id === handoffRef.current) return;
    handoffRef.current = id;
    if (!id) return;
    const file = projectFiles.find((f) => f.id === id);
    if (!file) return;
    const t = window.setTimeout(() => {
      setActiveFolderId(file.folderId);
      setSelectedFileId(file.id);
      onSearchChange('');
    }, 0);
    return () => window.clearTimeout(t);
  }, [state.selectedFileId, projectFiles, onSearchChange]);

  useEffect(() => {
    if (state.selectedFileId === null) return;
    dispatch({ type: 'SELECT_FILE', fileId: null });
  }, [state.selectedFileId, dispatch]);

  useEffect(() => {
    if (!selectedFileId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-file-id="${selectedFileId}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedFileId]);

  /* Folder stats */
  const folderStats = useMemo(() => {
    const map = new Map<FolderId, { count: number; bytes: number }>();
    for (const f of FOLDERS) map.set(f.id, { count: 0, bytes: 0 });
    for (const file of projectFiles) {
      const stat = map.get(file.folderId);
      if (stat) { stat.count++; stat.bytes += file.sizeBytes; }
    }
    return map;
  }, [projectFiles]);

  /* Files in active folder, optionally filtered */
  const folderFiles = useMemo(() => {
    let files = projectFiles.filter((f) => f.folderId === activeFolderId);
    if (search.trim()) {
      const q = search.toLowerCase();
      files = files.filter(
        (f) =>
          f.filename.toLowerCase().includes(q) ||
          f.notes.toLowerCase().includes(q) ||
          getMember(f.savedBy).name.toLowerCase().includes(q),
      );
    }
    return files.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }, [projectFiles, activeFolderId, search]);

  const selected = folderFiles.find((f) => f.id === selectedFileId) ?? null;
  const folderDef = getFolderDef(activeFolderId);

  useEffect(() => {
    onActiveFolderLabelChange?.(folderDef.label);
  }, [activeFolderId, folderDef.label, onActiveFolderLabelChange]);

  /* Keyboard nav */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/') {
      e.preventDefault();
      document.getElementById('files-browse-search')?.focus();
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Enter') return;
    e.preventDefault();
    const idx = selectedFileId ? folderFiles.findIndex((f) => f.id === selectedFileId) : -1;
    if (e.key === 'ArrowDown') {
      const next = Math.min(idx + 1, folderFiles.length - 1);
      setSelectedFileId(folderFiles[next]?.id ?? null);
    } else if (e.key === 'ArrowUp') {
      const next = Math.max(idx - 1, 0);
      setSelectedFileId(folderFiles[next]?.id ?? null);
    }
  };

  return (
    <div className={styles.outer} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className={styles.body}>
        {/* Left: folder list */}
        <nav className={styles.folderPane} aria-label="Folders">
          <ul className={styles.folderList}>
            {FOLDERS.map((fd) => {
              const Icon = fd.icon;
              const stat = folderStats.get(fd.id) ?? { count: 0, bytes: 0 };
              const isActive = activeFolderId === fd.id;
              return (
                <li key={fd.id}>
                  <button
                    className={`${styles.folderRow} ${isActive ? styles.folderRowActive : ''}`}
                    onClick={() => {
                      setActiveFolderId(fd.id);
                      setSelectedFileId(null);
                      onSearchChange('');
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={16} className={styles.folderRowIcon} aria-hidden />
                    <span className={styles.folderInfo}>
                      <span className={styles.folderName}>{fd.label}</span>
                      <span className={styles.folderMeta}>
                        {stat.count} file{stat.count === 1 ? '' : 's'} · {formatBytes(stat.bytes)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right: file table + detail */}
        <div className={styles.rightPane}>
          <div className={styles.folderToolbar}>
            <div className={styles.folderToolbarText}>
              <span className={styles.folderToolbarTitle}>{folderDef.label}</span>
              <span className={styles.folderToolbarHint}>
                Upload adds file metadata to this folder (demo — binary not stored).
              </span>
            </div>
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} aria-hidden />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className={styles.hiddenFileInput}
              multiple
              onChange={(e) => {
                const input = e.target;
                const list = input.files;
                if (!list?.length) return;
                const items = Array.from(list).map((file) => ({
                  folderId: activeFolderId,
                  filename: file.name,
                  mimeType: file.type || 'application/octet-stream',
                  sizeBytes: file.size,
                }));
                dispatch({ type: 'ADD_PROJECT_FILES', items });
                input.value = '';
              }}
            />
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.fileTable}>
              <thead>
                <tr>
                  <th className={styles.thName}>Name</th>
                  <th className={styles.thType}>Type</th>
                  <th className={styles.thSize}>Size</th>
                  <th className={styles.thBy}>Saved by</th>
                  <th className={styles.thDate}>Date</th>
                  <th className={styles.thActions}></th>
                </tr>
              </thead>
              <tbody ref={listRef}>
                {folderFiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyRow}>
                      <div className={styles.emptyContent}>
                        <File size={18} strokeWidth={1.75} aria-hidden />
                        <span>
                          {search.trim()
                            ? `No files matching "${search}"`
                            : activeFolderId === 'plan-sets'
                              ? 'No files yet. Use Save for a plan snapshot, or Upload for owner / third-party docs.'
                              : folderDef.description}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  folderFiles.map((file) => {
                    const author = getMember(file.savedBy);
                    const isSelected = selectedFileId === file.id;
                    return (
                      <tr
                        key={file.id}
                        data-file-id={file.id}
                        className={`${styles.fileRow} ${isSelected ? styles.fileRowSelected : ''}`}
                        onClick={() => setSelectedFileId(file.id)}
                      >
                        <td className={styles.tdName}>
                          <div className={styles.tdNameInner}>
                            <FileGlyph filename={file.filename} size={14} className={styles.fileRowIcon} />
                            <span className={styles.fileName}>{file.filename}</span>
                          </div>
                        </td>
                        <td className={styles.tdType}>{fileTypeLabel(file.filename)}</td>
                        <td className={styles.tdSize}>{formatBytes(file.sizeBytes)}</td>
                        <td className={styles.tdBy}>
                          <div className={styles.tdByInner}>
                            <span className={styles.avatar} style={{ background: author.color }}>
                              {author.initials}
                            </span>
                            <span>{author.name}</span>
                          </div>
                        </td>
                        <td className={styles.tdDate}>{formatDate(file.savedAt)}</td>
                        <td className={styles.tdActions}>
                          <button type="button" className={styles.fileBtn} title="Download"><Download size={12} aria-hidden /></button>
                          <button type="button" className={styles.fileBtn} title="Delete"><Trash2 size={12} aria-hidden /></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {selected && (
            <DetailPanel file={selected} onOpenHistory={() => dispatch({ type: 'SET_FILES_VIEW', view: 'activity' })} />
          )}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ file, onOpenHistory }: { file: ProjectFile; onOpenHistory: () => void }) {
  const author = getMember(file.savedBy);
  return (
    <aside className={styles.detail} aria-label="File details">
      <div className={styles.detailHead}>
        <FileGlyph filename={file.filename} size={22} className={styles.detailFileIcon} />
        <div>
          <div className={styles.detailFilename}>{file.filename}</div>
          <div className={styles.detailVersion}>{file.version}</div>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div>
          <div className={styles.metaLabel}>Type</div>
          <div className={styles.metaValue}>{fileTypeLabel(file.filename)}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Size</div>
          <div className={styles.metaValue}>{formatBytes(file.sizeBytes)}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Saved by</div>
          <div className={styles.metaValueRow}>
            <span className={styles.avatarSm} style={{ background: author.color }}>{author.initials}</span>
            <span>{author.name}</span>
          </div>
        </div>
        <div>
          <div className={styles.metaLabel}>Date</div>
          <div className={styles.metaValue}>{formatDate(file.savedAt)} · {formatTime(file.savedAt)}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Folder</div>
          <div className={styles.metaValue}>{getFolderDef(file.folderId).label}</div>
        </div>
      </div>

      {file.notes && <p className={styles.note}>{file.notes}</p>}

      <div className={styles.detailActions}>
        <button className={styles.actionBtn}><Download size={13} /> Download</button>
        <button className={styles.actionBtn}><ExternalLink size={13} /> Open</button>
        <button className={styles.actionBtn}><Copy size={13} /> Copy link</button>
        <button className={styles.actionBtnGhost} title="Share (coming soon)"><Share2 size={13} /> Share</button>
        <button type="button" className={styles.actionBtnGhost} onClick={onOpenHistory}>
          <FileDown size={13} /> View saves log
        </button>
      </div>
    </aside>
  );
}
