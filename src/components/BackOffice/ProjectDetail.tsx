import { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  MoreHorizontal,
  MapPin,
  Droplets,
  Users,
  DollarSign,
  Clock,
} from 'lucide-react';
import type { MockProject } from './mockProjects';
import { STATUS_META } from './mockProjects';
import styles from './ProjectDetail.module.css';

function workspaceHref(projectId: string): string {
  return `#/app/configurator?project=${encodeURIComponent(projectId)}`;
}

const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#0891b2', '#ea580c', '#22c55e'];

const TAB_IDS = [
  'overview',
  'configuration',
  'engineering',
  'estimate',
  'bom',
  'deliverables',
  'history',
  'files',
] as const;

const TAB_LABELS: Record<(typeof TAB_IDS)[number], string> = {
  overview: 'Overview',
  configuration: 'Configuration',
  engineering: 'Engineering',
  estimate: 'Estimate',
  bom: 'Project Financials',
  deliverables: 'Deliverables',
  history: 'History',
  files: 'Files',
};

interface ProjectDetailProps {
  project: MockProject;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const [tab, setTab] = useState<(typeof TAB_IDS)[number]>('overview');
  const sm = STATUS_META[project.status];

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={onBack}>
        <ArrowLeft size={16} />
        Back to projects
      </button>

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{project.name}</h1>
            <span
              className={styles.statusBadge}
              style={{ background: `${sm.color}18`, color: sm.color }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: sm.color }} />
              {sm.label}
            </span>
          </div>
          <div className={styles.meta}>
            <span>{project.code}</span>
            <span className={styles.metaDot} />
            <Clock size={13} />
            <span>{project.deadline}</span>
            <span className={styles.metaDot} />
            <span>
              {project.address}, {project.cityState}
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <a className={styles.workspaceBtn} href={workspaceHref(project.id)}>
            <ExternalLink size={16} />
            Open in Workspace
          </a>
          <button type="button" className={styles.ghostBtn} title="Edit project (mock)">
            <Pencil size={16} />
            Edit
          </button>
          <button type="button" className={styles.iconOnlyBtn} title="More actions (mock)">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      <div className={styles.infoCards}>
        <div className={styles.infoCard}>
          <div className={styles.infoCardIcon}>
            <MapPin size={20} />
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoCardLabel}>Location</div>
            <div className={styles.infoCardValue}>
              {project.cityState}
            </div>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardIcon}>
            <Droplets size={20} />
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoCardLabel}>Pool</div>
            <div className={styles.infoCardValue}>{project.poolType}</div>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardIcon}>
            <Users size={20} />
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoCardLabel}>Collaborators</div>
            <div className={styles.infoCardValue}>{project.team.length} people</div>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardIcon}>
            <DollarSign size={20} />
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoCardLabel}>Estimated Cost</div>
            <div className={styles.infoCardValue}>{project.estimatedCost}</div>
          </div>
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Project sections">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
            onClick={() => setTab(id)}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className={styles.panel} role="tabpanel">
          <h2 className={styles.panelTitle}>Project Overview</h2>
          <div className={styles.grid}>
            <div>
              <div className={styles.fieldLabel}>Status</div>
              <div className={styles.fieldValue}>{project.status}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Configuration</div>
              <div className={styles.fieldValue}>
                {project.configDone} / {project.configTotal} steps
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Project Type</div>
              <div className={styles.fieldValue}>{project.projectType}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Pool Type</div>
              <div className={styles.fieldValue}>{project.poolType}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Dimensions</div>
              <div className={styles.fieldValue}>{project.dimensions}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Estimated Cost</div>
              <div className={styles.fieldValue}>{project.estimatedCost}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Created</div>
              <div className={styles.fieldValue}>{project.created}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Last Modified</div>
              <div className={styles.fieldValue}>{project.modified}</div>
            </div>
          </div>

          <div className={styles.detailCards}>
            <div className={styles.detailCard}>
              <div className={styles.detailCardTitle}>Signed Engineer</div>
              {project.engineerName ? (
                <>
                  <div className={styles.detailRow}>
                    <strong>{project.engineerName}</strong>
                  </div>
                  <div className={styles.detailRow}>{project.engineerEmail}</div>
                </>
              ) : (
                <div className={styles.detailRow}>Not assigned yet</div>
              )}
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailCardTitle}>Team</div>
              {project.team.map((m, i) => (
                <div key={`${m.role}-${m.name}`} className={styles.teamMember}>
                  <div
                    className={styles.teamAvatar}
                    style={{ background: TEAM_COLORS[i % TEAM_COLORS.length] }}
                  >
                    {m.avatar}
                  </div>
                  <div className={styles.teamMemberInfo}>
                    <span className={styles.teamMemberName}>{m.name}</span>
                    <span className={styles.teamMemberRole}>{m.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.placeholder} role="tabpanel">
          {TAB_LABELS[tab]} — content placeholder (Phase 1 mock).
        </div>
      )}
    </div>
  );
}
