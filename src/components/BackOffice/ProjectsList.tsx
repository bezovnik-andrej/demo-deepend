import { useMemo, useState } from 'react';
import type { MockProject, ProjectStatus } from './mockProjects';
import { STATUS_META } from './mockProjects';
import styles from './ProjectsList.module.css';

const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#0891b2', '#ea580c', '#22c55e'];

interface ProjectsListProps {
  projects: MockProject[];
  onOpenProject: (id: string) => void;
  onCreateProject: () => void;
}

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
          title={m.name}
        >
          {m.avatar}
        </div>
      ))}
      {extra > 0 && (
        <div className={`${styles.miniAvatar} ${styles.miniAvatarMore}`}>+{extra}</div>
      )}
    </div>
  );
}

export function ProjectsList({ projects, onOpenProject, onCreateProject }: ProjectsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showEmpty, setShowEmpty] = useState(false);

  const filtered = useMemo(() => {
    if (showEmpty) return [];
    if (statusFilter === 'all') return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter, showEmpty]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.subtitle}>
              View all projects across client companies
            </p>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={onCreateProject}>
            Create Project
          </button>
          <input
            className={styles.cardSearch}
            type="search"
            placeholder="Search"
            readOnly
            title="Mock"
          />
        </div>

        <div className={styles.toolbar}>
          <label htmlFor="bo-status-filter" className={styles.srOnly}>Filter by status</label>
          <select
            id="bo-status-filter"
            className={styles.filter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            disabled={showEmpty}
          >
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_META) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <label className={styles.demoToggle}>
            <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} />
            Preview empty state
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>No projects yet</div>
            <p className={styles.emptyText}>
              Create a project for a client company and it will appear here.
            </p>
            <button type="button" className={styles.primaryBtn} onClick={onCreateProject}>
              Create Project
            </button>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Config</th>
                  <th>Collaborators</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const sm = STATUS_META[p.status];
                  const pct = Math.round((p.configDone / p.configTotal) * 100);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenProject(p.id);
                        }
                      }}
                    >
                      <td>
                        <div className={styles.projectCell}>
                          <div
                            className={styles.projectAvatar}
                            style={{ background: p.avatarColor }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div className={styles.projectInfo}>
                            <span className={styles.projectName}>{p.name}</span>
                            <span className={styles.projectCode}>
                              {p.code} · {p.client}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.statusCell}>
                          <span className={styles.statusDot} style={{ background: sm.color }} />
                          <span className={styles.statusLabel} style={{ color: sm.color }}>
                            {sm.label}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.configCell}>
                          <div className={styles.configBar}>
                            <div className={styles.configBarFill} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={styles.configText}>
                            {p.configDone}/{p.configTotal}
                          </span>
                        </div>
                      </td>
                      <td>
                        <AvatarStack team={p.team} />
                      </td>
                      <td className={styles.muted}>{p.deadline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className={styles.pagination}>
              <button type="button" className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}>
                Previous
              </button>
              <button type="button" className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
              <button type="button" className={styles.pageBtn}>2</button>
              <button type="button" className={styles.pageBtn}>3</button>
              <button type="button" className={styles.pageBtn}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
