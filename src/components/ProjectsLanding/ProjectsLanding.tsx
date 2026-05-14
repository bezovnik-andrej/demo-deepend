import { useMemo, useState } from 'react';
import { Plus, Search, MapPin, Clock, FolderOpen, X } from 'lucide-react';
import { useApp } from '../../store';
import { MOCK_PROJECTS, STATUS_META } from '../BackOffice/mockProjects';
import type { MockProject, ProjectStatus } from '../BackOffice/mockProjects';
import { getProjectProfile } from '../../data/projectProfiles';
import { Select } from '../ui/Select';
import styles from './ProjectsLanding.module.css';

const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#0891b2', '#ea580c', '#22c55e'];

type SortKey = 'modified' | 'name' | 'deadline' | 'progress';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'modified', label: 'Recent activity' },
  { value: 'name', label: 'Name' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'progress', label: 'Progress' },
];

function AvatarStack({ team }: { team: MockProject['team'] }) {
  const show = team.slice(0, 3);
  const extra = team.length - show.length;
  return (
    <div className={styles.avatarStack}>
      {show.map((m, i) => (
        <div
          key={m.avatar}
          className={styles.miniAvatar}
          style={{ background: TEAM_COLORS[i % TEAM_COLORS.length], zIndex: show.length - i }}
          title={`${m.role}: ${m.name}`}
        >
          {m.avatar}
        </div>
      ))}
      {extra > 0 && <div className={`${styles.miniAvatar} ${styles.miniAvatarMore}`}>+{extra}</div>}
    </div>
  );
}

function parseDeadlineDays(deadline: string): number {
  if (deadline === '—') return Number.POSITIVE_INFINITY;
  const match = deadline.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
}

function isUrgent(deadline: string): boolean {
  const days = parseDeadlineDays(deadline);
  return days <= 2 && Number.isFinite(days);
}

function ProjectCard({ project, onOpen }: { project: MockProject; onOpen: () => void }) {
  const sm = STATUS_META[project.status];
  const pct = Math.round((project.configDone / project.configTotal) * 100);
  const urgent = isUrgent(project.deadline);
  const noDeadline = project.deadline === '—';

  return (
    <button
      type="button"
      className={styles.card}
      onClick={onOpen}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardAvatar} style={{ background: project.avatarColor }} aria-hidden="true">
          {project.name.charAt(0)}
        </div>
        <div className={styles.cardTitleBlock}>
          <h3 className={styles.cardTitle}>{project.name}</h3>
          <p className={styles.cardSubtitle}>
            <span className={styles.cardCode}>{project.code}</span>
            <span className={styles.cardSubtitleSep} aria-hidden="true">·</span>
            <span className={styles.cardClient}>{project.client}</span>
          </p>
        </div>
        <span
          className={styles.statusBadge}
          style={{
            background: `color-mix(in srgb, ${sm.color} 14%, transparent)`,
            color: sm.color,
          }}
        >
          <span className={styles.statusDot} style={{ background: sm.color }} />
          {sm.label}
        </span>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>
          <MapPin size={11} aria-hidden="true" />
          <span className={styles.metaText}>
            {project.address}, {project.cityState}
          </span>
        </span>
        <span className={styles.metaDivider} aria-hidden="true" />
        <span className={styles.metaItem} title={project.poolType}>
          <span className={styles.metaText}>{project.poolType}</span>
        </span>
      </div>

      <div className={styles.progressBlock}>
        <div className={styles.progressMeta}>
          <span className={styles.progressLabel}>Configuration</span>
          <span className={styles.progressFraction}>
            {project.configDone}/{project.configTotal}
            <span className={styles.progressPct}>· {pct}%</span>
            {pct >= 100 && project.configTotal > 0 && (
              <span className={styles.configCompleteMark}>· Complete</span>
            )}
          </span>
        </div>
        <div className={styles.progressBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={styles.cardFooter}>
        <AvatarStack team={project.team} />
        <span className={styles.footerMeta}>
          <span className={styles.lastActivity}>{project.lastActivity}</span>
          {!noDeadline && (
            <>
              <span className={styles.metaDivider} aria-hidden="true" />
              <span className={`${styles.deadline} ${urgent ? styles.deadlineWarning : ''}`}>
                <Clock size={11} aria-hidden="true" />
                {project.deadline}
              </span>
            </>
          )}
        </span>
      </div>
    </button>
  );
}

export function ProjectsLanding() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('modified');

  const projects = MOCK_PROJECTS;

  const distinctTypes = useMemo(
    () => Array.from(new Set(projects.map((p) => p.projectType))),
    [projects],
  );
  const distinctCustomers = useMemo(
    () => Array.from(new Set(projects.map((p) => p.client))),
    [projects],
  );

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All Statuses' },
      ...(Object.keys(STATUS_META) as ProjectStatus[]).map((s) => ({
        value: s,
        label: STATUS_META[s].label,
      })),
    ],
    [],
  );

  const customerOptions = useMemo(
    () => [
      { value: 'all', label: 'All Customers' },
      ...distinctCustomers.map((c) => ({ value: c, label: c })),
    ],
    [distinctCustomers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = projects.filter((p) => {
      if (typeFilter !== 'all' && p.projectType !== typeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (customerFilter !== 'all' && p.client !== customerFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.code} ${p.client} ${p.address} ${p.cityState} ${p.poolType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    out = [...out].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress': {
          const ap = a.configDone / a.configTotal;
          const bp = b.configDone / b.configTotal;
          return bp - ap;
        }
        case 'deadline':
          return parseDeadlineDays(a.deadline) - parseDeadlineDays(b.deadline);
        case 'modified':
        default:
          return b.modified.localeCompare(a.modified);
      }
    });

    return out;
  }, [projects, search, typeFilter, statusFilter, customerFilter, sortKey]);

  const handleOpenProject = (project: MockProject) => {
    dispatch({ type: 'OPEN_PROJECT', profile: getProjectProfile(project) });
    window.location.assign(`#/app/configurator?project=${encodeURIComponent(project.id)}`);
  };

  const handleCreateNew = () => {
    dispatch({ type: 'START_NEW_PROJECT' });
  };

  type ActiveFilter = { key: string; label: string; clear: () => void };
  const activeFilters: ActiveFilter[] = [];
  if (typeFilter !== 'all') {
    activeFilters.push({
      key: 'type',
      label: `Type: ${typeFilter}`,
      clear: () => setTypeFilter('all'),
    });
  }
  if (statusFilter !== 'all') {
    activeFilters.push({
      key: 'status',
      label: `Status: ${STATUS_META[statusFilter as ProjectStatus]?.label ?? statusFilter}`,
      clear: () => setStatusFilter('all'),
    });
  }
  if (customerFilter !== 'all') {
    activeFilters.push({
      key: 'customer',
      label: `Customer: ${customerFilter}`,
      clear: () => setCustomerFilter('all'),
    });
  }
  if (search.trim().length > 0) {
    activeFilters.push({
      key: 'search',
      label: `“${search.trim()}”`,
      clear: () => setSearch(''),
    });
  }
  const filtersActive = activeFilters.length > 0;

  const handleClearAll = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setCustomerFilter('all');
    setSearch('');
  };

  const userName = state.data.clientContactName?.split(' ')[0] || 'there';

  return (
    <div className={styles.page}>
      <div className={styles.headerWrap}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.tagline}>
              Welcome back, {userName}. Pick up where you left off, or start something new.
            </p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                className={styles.search}
                placeholder="Search projects, clients, locations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search projects"
              />
              {search && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button type="button" className={styles.primaryBtn} onClick={handleCreateNew}>
              <Plus size={14} aria-hidden="true" />
              New Project
            </button>
          </div>
        </header>
      </div>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Type</span>
            <div className={styles.chipGroup} role="group" aria-label="Filter by type">
              <button
                type="button"
                className={`${styles.chip} ${typeFilter === 'all' ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter('all')}
                aria-pressed={typeFilter === 'all'}
              >
                All
              </button>
              {distinctTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.chip} ${typeFilter === t ? styles.chipActive : ''}`}
                  onClick={() => setTypeFilter(t)}
                  aria-pressed={typeFilter === t}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <span className={styles.toolbarDivider} aria-hidden="true" />

          <Select
            prefix="Status"
            ariaLabel="Filter by status"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Select
            prefix="Customer"
            ariaLabel="Filter by customer"
            options={customerOptions}
            value={customerFilter}
            onChange={setCustomerFilter}
          />

          <div className={styles.toolbarSpacer} />

          <Select<SortKey>
            prefix="Sort by"
            ariaLabel="Sort projects"
            options={SORT_OPTIONS}
            value={sortKey}
            onChange={setSortKey}
            alignEnd
          />
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultCount}>
            <strong>{filtered.length}</strong>
            <span className={styles.resultCountTotal}>
              {filtered.length === 1 ? 'project' : 'projects'}
              {filtersActive && filtered.length !== projects.length && ` of ${projects.length}`}
            </span>
          </span>
          {filtersActive && (
            <div className={styles.activeFilters}>
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={styles.activeFilterChip}
                  onClick={f.clear}
                  aria-label={`Remove filter ${f.label}`}
                >
                  <span>{f.label}</span>
                  <X size={11} aria-hidden="true" />
                </button>
              ))}
              <button type="button" className={styles.clearAllBtn} onClick={handleClearAll}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <FolderOpen size={22} />
            </div>
            <div className={styles.emptyTitle}>
              {filtersActive ? 'No projects match your filters' : 'No projects yet'}
            </div>
            <p className={styles.emptyText}>
              {filtersActive
                ? 'Try adjusting your filters, or clear them to see all projects.'
                : 'Create your first project to start designing pools.'}
            </p>
            <div className={styles.emptyActions}>
              {filtersActive ? (
                <>
                  <button type="button" className={styles.secondaryBtn} onClick={handleClearAll}>
                    Clear filters
                  </button>
                  <button type="button" className={styles.primaryBtn} onClick={handleCreateNew}>
                    <Plus size={14} aria-hidden="true" />
                    New Project
                  </button>
                </>
              ) : (
                <button type="button" className={styles.primaryBtn} onClick={handleCreateNew}>
                  <Plus size={14} aria-hidden="true" />
                  New Project
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onOpen={() => handleOpenProject(p)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
