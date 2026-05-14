import { useMemo, useState, useCallback } from 'react';
import {
  FileText, Download, Copy, Check,
} from 'lucide-react';
import {
  getMember,
  formatBytes,
  fileTypeLabel,
  type ActivityEvent,
  type ProjectFile,
} from '../../data/projectHistory';
import { useApp } from '../../store';
import styles from './history.module.css';

function ymd(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Group headers: full calendar date, uppercase (date is implied by grouping). */
function groupLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  return d
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();
}

/** Row time in Mountain Time + label, matching design spec. */
function formatTimeMt(iso: string): string {
  const d = new Date(iso);
  const t = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Denver',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);
  return `${t} (MT)`;
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function shareLinkForFile(file: ProjectFile): string {
  const path = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${path}#/app/files?file=${encodeURIComponent(file.id)}`;
}

function downloadPlaceholder(file: ProjectFile): void {
  const lines = [
    'The Deep End — demo download',
    `File: ${file.filename}`,
    `Version: ${file.version}`,
    `Size: ${formatBytes(file.sizeBytes)}`,
    '',
    'In a production build this would be the real binary export.',
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const base = file.filename.replace(/\.[^/.]+$/, '') || 'file';
  a.href = url;
  a.download = `${base}-deep-end-placeholder.txt`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type SaveRowModel = {
  event: ActivityEvent;
  file: ProjectFile | null;
};

/** Save log: each save with file metadata, copy link, and download (demo placeholder). */
export function HistoryWorkspace() {
  const { state } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rows = useMemo((): SaveRowModel[] => {
    const saves = state.activityLog
      .filter((e): e is ActivityEvent & { kind: 'saved' } => e.kind === 'saved')
      .sort((a, b) => b.at.localeCompare(a.at));
    return saves.map((event) => ({
      event,
      file: event.fileId
        ? state.projectFiles.find((f) => f.id === event.fileId) ?? null
        : null,
    }));
  }, [state.activityLog, state.projectFiles]);

  const grouped = useMemo(() => {
    const out: { key: string; rows: SaveRowModel[] }[] = [];
    for (const row of rows) {
      const key = ymd(row.event.at);
      const bucket = out[out.length - 1];
      if (bucket && bucket.key === key) bucket.rows.push(row);
      else out.push({ key, rows: [row] });
    }
    return out;
  }, [rows]);

  const copyForRow = useCallback(async (row: SaveRowModel) => {
    const text = row.file
      ? shareLinkForFile(row.file)
      : `${row.event.title} · ${formatSavedAt(row.event.at)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(row.event.id);
      window.setTimeout(() => {
        setCopiedId((id) => (id === row.event.id ? null : id));
      }, 2000);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className={styles.outer}>
      <div className={styles.saveLogBody}>
        {grouped.length === 0 ? (
          <div className={styles.saveLogEmpty}>No saves recorded yet.</div>
        ) : (
          <div className={styles.saveTableScroll}>
            <table className={styles.saveTable}>
              <thead>
                <tr>
                  <th className={styles.saveThName}>File</th>
                  <th className={styles.saveThType}>Type</th>
                  <th className={styles.saveThSize}>Size</th>
                  <th className={styles.saveThBy}>Saved by</th>
                  <th className={styles.saveThTime}>Time</th>
                  <th className={styles.saveThActions}><span className={styles.visuallyHidden}>Actions</span></th>
                </tr>
              </thead>
              {grouped.map((group) => (
                <tbody key={group.key}>
                  <tr className={styles.saveDayRow}>
                    <td colSpan={6} className={styles.saveDayCell}>
                      {groupLabel(group.key)}
                    </td>
                  </tr>
                  {group.rows.map(({ event, file }) => {
                    const author = getMember(event.authorId);
                    const copied = copiedId === event.id;
                    return (
                      <tr key={event.id} className={styles.saveDataRow}>
                        <td className={styles.saveTdName}>
                          <span className={styles.saveNameInner}>
                            <FileText size={14} className={styles.saveFileIcon} aria-hidden />
                            <span className={styles.saveFileName} title={file?.filename ?? event.title}>
                              {file?.filename ?? '—'}
                            </span>
                          </span>
                        </td>
                        <td className={styles.saveTdType}>
                          {file ? fileTypeLabel(file.filename) : '—'}
                        </td>
                        <td className={styles.saveTdSize}>
                          {file ? formatBytes(file.sizeBytes) : '—'}
                        </td>
                        <td className={styles.saveTdBy}>
                          <span className={styles.saveByInner}>
                            <span className={styles.saveAvatar} style={{ background: author.color }}>
                              {author.initials}
                            </span>
                            {author.name}
                          </span>
                        </td>
                        <td className={styles.saveTdTime}>{formatTimeMt(event.at)}</td>
                        <td className={styles.saveTdActions}>
                          <div className={styles.saveActions}>
                            <button
                              type="button"
                              className={`${styles.saveIconBtn} ${copied ? styles.saveIconBtnCopied : ''}`}
                              title="Copy share link"
                              aria-label={`Copy link for ${file?.filename ?? event.title}`}
                              onClick={() => copyForRow({ event, file })}
                            >
                              {copied ? <Check size={13} strokeWidth={2.25} aria-hidden /> : <Copy size={13} strokeWidth={2.25} aria-hidden />}
                            </button>
                            <button
                              type="button"
                              className={styles.saveIconBtn}
                              title={file ? 'Download (demo placeholder file)' : 'No file on record'}
                              aria-label={`Download ${file?.filename ?? 'entry'}`}
                              disabled={!file}
                              onClick={() => file && downloadPlaceholder(file)}
                            >
                              <Download size={13} strokeWidth={2.25} aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
