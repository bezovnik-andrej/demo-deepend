import { useReducer, useEffect } from 'react';
import { AppContext, INITIAL_STATE, appReducer } from './store';
import { TitleBar } from './components/TitleBar/TitleBar';
import { ConfigDrawer } from './components/ConfigDrawer/ConfigDrawer';
import { StatusBar } from './components/StatusBar/StatusBar';
import { EngineeringWorkspace } from './components/Workspaces/ConfiguratorWorkspace';
import { ConfiguratorPage } from './components/Workspaces/ConfiguratorPage';
import { BOMWorkspace } from './components/Workspaces/BOMWorkspace';
import { EstimateWorkspace } from './components/Workspaces/EstimateWorkspace';
import { DeliverablesWorkspace } from './components/Workspaces/DeliverablesWorkspace';
import { HistoryWorkspace } from './components/Workspaces/HistoryWorkspace';
import { SummaryWorkspace } from './components/Workspaces/SummaryWorkspace';
import { FilesWorkspace } from './components/Workspaces/FilesWorkspace';
import { CatalogWorkspace } from './components/Workspaces/CatalogWorkspace';
import { PlaceholderWorkspace } from './components/Workspaces/PlaceholderWorkspace';
import { WorkspaceLanding } from './components/WorkspaceLanding/WorkspaceLanding';
import { ProjectsLanding } from './components/ProjectsLanding/ProjectsLanding';
import { DesignLayersPanel } from './components/DesignWorkspace/DesignLayersPanel';
import { DrawingCanvas } from './components/DrawingCanvas/DrawingCanvas';
import { LayerFilterBar } from './components/DesignWorkspace/LayerFilterBar';
import { InspectorPanel } from './components/DesignWorkspace/InspectorPanel';
import { ToolStrip } from './components/ToolStrip/ToolStrip';
import { ProjectKpiBar } from './components/ProjectKpiBar/ProjectKpiBar';
import { getProjectById } from './components/BackOffice/mockProjects';
import { getProjectProfile } from './data/projectProfiles';
import type { Workspace } from './types';
import styles from './App.module.css';

const VALID_WORKSPACES = new Set<string>([
  'configurator',
  'engineering',
  'design',
  'bom',
  'catalog',
  'estimate',
  'deliverables',
  'history',
  'summary',
  'files',
]);

export default function App({ initialWorkspace, initialProjectId }: { initialWorkspace?: string; initialProjectId?: string }) {
  const [state, dispatch] = useReducer(appReducer, {
    ...INITIAL_STATE,
    /* Direct workspace links (e.g. /#/app/design) skip the landing screen. */
    wizardPhase: initialWorkspace && VALID_WORKSPACES.has(initialWorkspace)
      ? 'workspace'
      : INITIAL_STATE.wizardPhase,
    activeWorkspace: (initialWorkspace && VALID_WORKSPACES.has(initialWorkspace)
      ? initialWorkspace
      : INITIAL_STATE.activeWorkspace) as Workspace,
  });

  useEffect(() => {
    if (!initialProjectId) return;
    const project = getProjectById(initialProjectId);
    if (!project) return;
    dispatch({ type: 'OPEN_PROJECT', profile: getProjectProfile(project) });
    if (initialWorkspace && VALID_WORKSPACES.has(initialWorkspace) && initialWorkspace !== 'configurator') {
      window.setTimeout(() => {
        dispatch({ type: 'SET_WORKSPACE', workspace: initialWorkspace as Workspace });
      }, 0);
    }
  }, [initialProjectId, initialWorkspace]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.configDrawerOpen) {
          dispatch({ type: 'CLOSE_CONFIG_DRAWER' });
          e.preventDefault();
        }
      }
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 's') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.configDrawerOpen]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
      localStorage.setItem('norveo-theme', state.theme);
    } catch {
      /* ignore */
    }
  }, [state.theme]);

  const renderWorkspaceContent = () => {
    switch (state.activeWorkspace) {
      case 'configurator':
        return <ConfiguratorPage />;
      case 'engineering':
        return (
          <>
            <EngineeringWorkspace />
            <ConfigDrawer />
          </>
        );
      case 'design':
        return (
          <div className={styles.designWrapper}>
            <div className={styles.designContent}>
              <ToolStrip />
              <DesignLayersPanel />
              <div className={styles.canvasArea}>
                <LayerFilterBar />
                <DrawingCanvas />
                <StatusBar />
              </div>
              <InspectorPanel />
            </div>
          </div>
        );
      case 'bom':
        return <BOMWorkspace />;
      case 'catalog':
        return <CatalogWorkspace />;
      case 'estimate':
        return <EstimateWorkspace estimateView="admin" />;
      case 'deliverables':
        return <DeliverablesWorkspace />;
      case 'history':
        return <HistoryWorkspace />;
      case 'summary':
        return <SummaryWorkspace />;
      case 'files':
        return <FilesWorkspace />;
      default:
        return <PlaceholderWorkspace workspace={state.activeWorkspace} />;
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className={styles.app}>
        <TitleBar />
        {state.wizardPhase === 'workspace' && <ProjectKpiBar />}
        <div className={styles.workspace}>
          {state.wizardPhase === 'workspace' ? (
            renderWorkspaceContent()
          ) : state.wizardPhase === 'landing' ? (
            <ProjectsLanding />
          ) : (
            <WorkspaceLanding />
          )}
        </div>
        {state.wizardPhase !== 'landing' &&
          (state.wizardPhase !== 'workspace' || state.activeWorkspace !== 'design') && (
            <StatusBar />
          )}
      </div>
    </AppContext.Provider>
  );
}
