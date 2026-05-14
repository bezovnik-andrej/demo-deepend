import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, FileDown, Plus, FileText, FileSpreadsheet,
  Ruler, BarChart3, Box, Download, Copy, RotateCcw, ExternalLink, Filter,
  Folder, HardDrive,
} from 'lucide-react';
import { getMember, type ProjectFile } from '../../data/projectHistory';
import { useApp } from '../../store';
import styles from './deliverables.module.css';

type FilterKind = 'all' | 'current' | 'drafts' | 'archived';
type VersionStatus = 'current' | 'draft' | 'archived';
type VersionFileKind = 'drawing' | 'bom' | 'estimate' | 'report' | 'model';

interface VersionFile {
  name: string;
  sizeKb: number;
  kind: VersionFileKind;
}

interface ProjectVersion {
  id: string;
  label: string;
  title: string;
  note: string;
  status: VersionStatus;
  authorId: string;
  savedAt: string;
  files: VersionFile[];
}

const FILE_ICONS: Record<VersionFileKind, React.FC<{ size?: number }>> = {
  drawing: Ruler,
  bom: FileSpreadsheet,
  estimate: BarChart3,
  report: FileText,
  model: Box,
};

const FILE_KIND_LABELS: Record<VersionFileKind, string> = {
  drawing: 'Drawing',
  bom: 'BOM',
  estimate: 'Estimate',
  report: 'Report',
  model: 'Model',
};

const STATUS_LABEL: Record<VersionStatus, string> = {
  current: 'Current',
  draft: 'Draft',
  archived: 'Archived',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function totalSize(v: ProjectVersion): number {
  return v.files.reduce((s, f) => s + f.sizeKb, 0);
}

function fileKind(file: ProjectFile): VersionFileKind {
  const name = file.filename.toLowerCase();
  if (name.includes('bom')) return 'bom';
  if (name.includes('estimate') || name.includes('quote')) return 'estimate';
  if (name.includes('drawing') || name.includes('shop') || name.endsWith('.dwg')) return 'drawing';
  if (name.includes('model') || name.endsWith('.json')) return 'model';
  return 'report';
}

function buildVersions(files: ProjectFile[], projectName: string): ProjectVersion[] {
  const byVersion = new Map<string, ProjectFile[]>();
  for (const file of files) {
    const existing = byVersion.get(file.version);
    if (existing) existing.push(file);
    else byVersion.set(file.version, [file]);
  }

  return Array.from(byVersion, ([version, versionFiles], idx) => {
    const newest = versionFiles.reduce((latest, file) => (file.savedAt > latest.savedAt ? file : latest));
    const status: VersionStatus = idx === 0 ? 'current' : idx === 1 ? 'draft' : 'archived';
    return {
      id: version,
      label: version,
      title: `${projectName || 'Project'} deliverables`,
      note: newest.notes || 'Generated from current project files.',
      status,
      authorId: newest.savedBy,
      savedAt: newest.savedAt,
      files: versionFiles.map((file) => ({
        name: file.filename,
        sizeKb: Math.max(1, Math.round(file.sizeBytes / 1024)),
        kind: fileKind(file),
      })),
    };
  }).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function DeliverablesWorkspace() {
  const { state } = useApp();
  const [filter, setFilter] = useState<FilterKind>('all');
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  const versions = useMemo(
    () => buildVersions(state.projectFiles, state.data.projectName),
    [state.projectFiles, state.data.projectName],
  );
  const [selectedId, setSelectedId] = useState<string>(versions[0]?.id ?? '');
  const [justLanded, setJustLanded] = useState<string | null>(versions[0]?.id ?? null);

  useEffect(() => {
    if (versions.length === 0) {
      const timer = window.setTimeout(() => setSelectedId(''), 0);
      return () => window.clearTimeout(timer);
    }
    if (!versions.some((version) => version.id === selectedId)) {
      const timer = window.setTimeout(() => {
        setSelectedId(versions[0].id);
        setJustLanded(versions[0].id);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [selectedId, versions]);

  useEffect(() => {
    if (justLanded === null) return;
    const t = setTimeout(() => setJustLanded(null), 1600);
    return () => clearTimeout(t);
  }, [justLanded]);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-version-id="${selectedId}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const filtered = useMemo(() => {
    let rows = versions;
    if (filter === 'current') rows = rows.filter((v) => v.status === 'current');
    if (filter === 'drafts') rows = rows.filter((v) => v.status === 'draft');
    if (filter === 'archived') rows = rows.filter((v) => v.status === 'archived');
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (v) =>
          v.label.toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          v.note.toLowerCase().includes(q) ||
          v.files.some((f) => f.name.toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [filter, search, versions]);

  const selected = filtered.find((v) => v.id === selectedId) ?? filtered[0];

  const counts = useMemo(
    () => ({
      all: versions.length,
      current: versions.filter((v) => v.status === 'current').length,
      drafts: versions.filter((v) => v.status === 'draft').length,
      archived: versions.filter((v) => v.status === 'archived').length,
    }),
    [versions],
  );

  const currentVersion = versions.find((v) => v.status === 'current') ?? versions[0];
  const totalFileCount = versions.reduce((s, v) => s + v.files.length, 0);
  const totalBytes = versions.reduce((s, v) => s + totalSize(v), 0);

  const filterTabs: { id: FilterKind; label: string }[] = [
    { id: 'all', label: 'All versions' },
    { id: 'current', label: 'Current' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'archived', label: 'Archived' },
  ];

  return (
    <div className={styles.outer}>
      <div className={styles.topBar}>
        <div className={styles.viewTabs}>
          {filterTabs.map(({ id, label }) => (
            <button key={id} className={`${styles.viewTab} ${filter === id ? styles.viewTabActive : ''}`} onClick={() => setFilter(id)}>
              {label}<span className={styles.viewTabCount}>{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.searchWrap}>
            <Search size={12} className={styles.searchIcon} />
            <input className={styles.searchInput} placeholder="Search versions, files..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search versions and files" />
          </div>
          <button className={styles.toolBtn} title="Download current version"><FileDown size={13} /> Download</button>
          <button className={styles.toolBtnPrimary} title="Save new version"><Plus size={13} /> Save version</button>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}><Folder size={10} /> Current version</span>
          <span className={styles.summaryValue}>{currentVersion ? `${currentVersion.label} · ${formatDate(currentVersion.savedAt)}` : 'No versions yet'}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Last saved by</span>
          <span className={styles.summaryValue}>{currentVersion ? getMember(currentVersion.authorId).name : '-'}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}><HardDrive size={10} /> Storage</span>
          <span className={styles.summaryValue}>{counts.all} versions · {totalFileCount} files · {formatSize(totalBytes)}</span>
        </div>
      </div>

      <div className={styles.body}>
        <ul className={styles.list} ref={listRef}>
          {filtered.length === 0 && <li className={styles.emptyRow}><Filter size={14} />No versions match the current filter.</li>}
          {filtered.map((v) => {
            const author = getMember(v.authorId);
            const isActive = selected?.id === v.id;
            const isCurrent = v.status === 'current';
            return (
              <li key={v.id} data-version-id={v.id} className={[styles.listItem, styles[`statusRail_${v.status}`], isActive ? styles.listItemActive : '', justLanded === v.id ? styles.listItemJustLanded : ''].join(' ')} onClick={() => setSelectedId(v.id)}>
                <div className={styles.listTop}>
                  <span className={styles.versionLabel}>{v.label}</span>
                  {isCurrent && <span className={styles.currentPill}>Latest</span>}
                  <span className={`${styles.statusChip} ${styles[`chip_${v.status}`]}`}>{STATUS_LABEL[v.status]}</span>
                </div>
                <div className={styles.versionTitle}>{v.title}</div>
                <div className={styles.listMeta}>
                  <span className={styles.avatar} style={{ background: author.color }}>{author.initials}</span>
                  <span className={styles.metaAuthor}>{author.name}</span>
                  <span className={styles.metaDot} />
                  <span className={styles.metaDate}>{formatDate(v.savedAt)}</span>
                </div>
                <div className={styles.listFileLine}>{v.files.length} file{v.files.length === 1 ? '' : 's'} · {formatSize(totalSize(v))}</div>
              </li>
            );
          })}
        </ul>

        {selected ? (
          <section className={styles.detail}>
            <header className={styles.detailHead}>
              <div className={styles.detailHeadMain}>
                <div className={styles.detailTitleRow}>
                  <h2 className={styles.detailLabel}>{selected.label}</h2>
                  {selected.status === 'current' && <span className={styles.currentPill}>Latest</span>}
                  <span className={`${styles.statusChip} ${styles[`chip_${selected.status}`]}`}>{STATUS_LABEL[selected.status]}</span>
                </div>
                <div className={styles.detailTitle}>{selected.title}</div>
              </div>
              <div className={styles.detailActions}>
                <button className={styles.toolBtn}><Copy size={13} /> Duplicate</button>
                {selected.status !== 'current' && <button className={styles.toolBtn}><RotateCcw size={13} /> Restore</button>}
                <button className={styles.toolBtnPrimary}><Download size={13} /> Download all</button>
              </div>
            </header>
            <div className={styles.metaGrid}>
              <div><div className={styles.metaLabel}>Saved by</div><div className={styles.metaValueRow}><span className={styles.avatarSm} style={{ background: getMember(selected.authorId).color }}>{getMember(selected.authorId).initials}</span><span className={styles.metaValue}>{getMember(selected.authorId).name}</span></div></div>
              <div><div className={styles.metaLabel}>Saved at</div><div className={styles.metaValue}>{formatDate(selected.savedAt)} · {formatTime(selected.savedAt)}</div></div>
              <div><div className={styles.metaLabel}>Files</div><div className={styles.metaValue}>{selected.files.length} · {formatSize(totalSize(selected))}</div></div>
              <div><div className={styles.metaLabel}>Status</div><div className={styles.metaValue}>{STATUS_LABEL[selected.status]}</div></div>
            </div>
            <p className={styles.note}>{selected.note}</p>
            <div className={styles.filesBlock}>
              <div className={styles.filesHead}><span className={styles.filesHeadLabel}>Files in this version</span><span className={styles.filesHeadCount}>{selected.files.length}</span></div>
              <ul className={styles.fileList}>
                {selected.files.map((f) => {
                  const Icon = FILE_ICONS[f.kind];
                  return (
                    <li key={f.name} className={styles.fileRow}>
                      <span className={styles.fileIcon}><Icon size={14} /></span>
                      <span className={styles.fileMain}><span className={styles.fileName}>{f.name}</span><span className={styles.fileMeta}><span className={styles.fileKind}>{FILE_KIND_LABELS[f.kind]}</span><span className={styles.metaDot} /><span>{formatSize(f.sizeKb)}</span></span></span>
                      <span className={styles.fileActions}><button className={styles.fileBtn} title="Open"><ExternalLink size={12} /></button><button className={styles.fileBtn} title="Download"><Download size={12} /></button></span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
