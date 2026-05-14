import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackOfficeShell } from './BackOfficeShell';
import { CompaniesList } from './CompaniesList';
import { ProjectsList } from './ProjectsList';
import { ProjectDetail } from './ProjectDetail';
import { MOCK_PROJECTS, getProjectById } from './mockProjects';
import styles from './BackOffice.module.css';

type View =
  | { kind: 'projects' }
  | { kind: 'project'; id: string }
  | { kind: 'companies' }
  | { kind: 'notfound' };

function getStoredTheme(): 'light' | 'dark' {
  try {
    const s = localStorage.getItem('norveo-theme');
    if (s === 'light' || s === 'dark') return s;
  } catch {
    /* ignore */
  }
  return 'light';
}

function parseBackOfficeView(hash: string): View {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const path = raw.split('?')[0];
  const segments = path.split('/').filter(Boolean);
  if (segments[0] !== 'backoffice') return { kind: 'companies' };
  if (segments[1] === 'projects') {
    const id = segments[2];
    if (id) {
      if (getProjectById(id)) return { kind: 'project', id };
      return { kind: 'notfound' };
    }
    return { kind: 'projects' };
  }
  if (segments[1] === 'companies') return { kind: 'companies' };
  return { kind: 'companies' };
}

export function BackOffice() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /** Keep pretty URLs: /projects#/backoffice/… and /projects/:id#/backoffice/projects/:id */
  useEffect(() => {
    function syncPathFromHash() {
      const h = window.location.hash;
      if (!h.startsWith('#/backoffice')) return;
      const segments = h.slice(1).split('/').filter(Boolean);
      if (segments[0] !== 'backoffice') return;
      const rest = segments.slice(1);
      const path = '/' + rest.join('/');
      const full = `${path}${h}`;
      if (window.location.pathname !== path) {
        window.history.replaceState(null, '', full);
      }
    }
    syncPathFromHash();
    window.addEventListener('hashchange', syncPathFromHash);
    return () => window.removeEventListener('hashchange', syncPathFromHash);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('norveo-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const view = useMemo(() => parseBackOfficeView(hash), [hash]);

  const navigate = useCallback((h: string) => {
    window.location.hash = h;
  }, []);

  const activeNav = view.kind === 'companies' ? 'companies' : 'projects';

  const pageTitle = useMemo(() => {
    if (view.kind === 'companies') return 'Companies';
    if (view.kind === 'projects') return 'Projects';
    if (view.kind === 'project') {
      const p = getProjectById(view.id);
      return p?.name ?? 'Project';
    }
    return 'Not found';
  }, [view]);

  const onCreateNew = useCallback(() => {
    window.alert('Create wizard — coming in a later phase (mock).');
  }, []);

  return (
    <BackOfficeShell
      activeNav={activeNav}
      pageTitle={pageTitle}
      onNavigate={navigate}
      onCreateNew={onCreateNew}
      theme={theme}
      onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    >
      {view.kind === 'companies' && (
        <CompaniesList
          onOpenCompany={(id) => navigate(`#/backoffice/companies/${id}`)}
          onAddCompany={onCreateNew}
        />
      )}
      {view.kind === 'projects' && (
        <ProjectsList
          projects={MOCK_PROJECTS}
          onOpenProject={(id) => navigate(`#/backoffice/projects/${id}`)}
          onCreateProject={onCreateNew}
        />
      )}
      {view.kind === 'project' && getProjectById(view.id) && (
        <ProjectDetail
          project={getProjectById(view.id)!}
          onBack={() => navigate('#/backoffice/projects')}
        />
      )}
      {view.kind === 'notfound' && (
        <div className={styles.placeholder}>
          <h1 className={styles.placeholderTitle}>Not found</h1>
          <p className={styles.placeholderText}>No mock data matches this URL.</p>
          <button
            type="button"
            className={styles.linkish}
            onClick={() => navigate('#/backoffice/companies')}
          >
            Back to companies
          </button>
        </div>
      )}
    </BackOfficeShell>
  );
}
