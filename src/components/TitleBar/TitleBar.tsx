import {
  Save, Lock, Unlock, Share2, ChevronRight, ChevronLeft, Settings, BookTemplate,
  Sun, Moon, SlidersHorizontal, PenTool, ClipboardList, Folder, Wrench, Library,
} from 'lucide-react';
import { useApp } from '../../store';
import { WORKSPACE_LABELS, isConfiguratorWorkflowComplete } from '../../types';
import type { Workspace } from '../../types';
import { BrandMark } from './NarveoLogo';
import { VersionsPopover } from './VersionsPopover';
import styles from './TitleBar.module.css';

const WORKSPACES: { id: Workspace; icon: React.FC<{ size?: number }> }[] = [
  { id: 'configurator', icon: SlidersHorizontal },
  { id: 'design', icon: PenTool },
  { id: 'engineering', icon: Wrench },
  { id: 'bom', icon: ClipboardList },
  { id: 'catalog', icon: Library },
  { id: 'files', icon: Folder },
];

export function TitleBar() {
  const { state, dispatch } = useApp();
  const { data, activeWorkspace, theme, wizardPhase, isDirty } = state;

  const handleReturnToLanding = () => {
    if (isDirty && !data.isFinalized) {
      const choice = window.confirm(
        'You have unsaved changes.\n\nClick OK to save and leave, or Cancel to stay on this project.',
      );
      if (!choice) return;
      dispatch({ type: 'SAVE_PROJECT' });
    }
    dispatch({ type: 'RETURN_TO_LANDING' });
    window.location.hash = '#/app';
  };

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <BrandMark size={16} />
        {wizardPhase === 'workspace' ? (
          <>
            <a
              className={styles.breadcrumbLink}
              href="#/app"
              onClick={(e) => {
                e.preventDefault();
                handleReturnToLanding();
              }}
              aria-label="Return to project list"
              title="Return to project list"
            >
              <ChevronLeft size={11} aria-hidden="true" />
              Projects
            </a>
            <ChevronRight size={11} className={styles.sep} aria-hidden="true" />
            <span className={styles.projectName}>{data.projectName || 'Untitled Project'}</span>
            {data.isFinalized && <span className={styles.badge}>FINALIZED</span>}
            {!data.isFinalized && isConfiguratorWorkflowComplete(data) && (
              <span className={styles.badgeComplete} title="All configurator steps are done">
                CONFIG COMPLETE
              </span>
            )}
          </>
        ) : wizardPhase === 'landing' ? (
          <span className={styles.breadcrumbCurrent}>Projects</span>
        ) : (
          <>
            <ChevronRight size={11} className={styles.sep} aria-hidden="true" />
            <span className={styles.projectName}>{data.projectName || 'New Project'}</span>
          </>
        )}
      </div>

      {wizardPhase === 'workspace' && (
        <div className={styles.center}>
          <nav className={styles.workspaceTabs}>
            {WORKSPACES.map(({ id, icon: Icon }) => {
              const isActive = activeWorkspace === id;
              return (
                <button
                  key={id}
                  className={`${styles.wsTab} ${isActive ? styles.wsTabActive : ''}`}
                  onClick={() => dispatch({ type: 'SET_WORKSPACE', workspace: id })}
                >
                  <Icon size={12} />
                  <span>{WORKSPACE_LABELS[id]}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <div className={styles.right}>
        {wizardPhase === 'workspace' ? (
          <>
            <button className={styles.iconBtn} title="Templates" aria-label="Templates">
              <BookTemplate size={15} />
            </button>
            <button
              className={styles.iconBtn}
              title="Save"
              aria-label="Save project"
              onClick={() => dispatch({ type: 'SAVE_PROJECT' })}
            >
              <Save size={15} />
            </button>
            <VersionsPopover />
            <button
              className={`${styles.iconBtn} ${data.isFinalized ? styles.iconActive : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_FINALIZE' })}
              title={data.isFinalized ? 'Unlock project' : 'Finalize project'}
              aria-label={data.isFinalized ? 'Unlock project' : 'Finalize project'}
            >
              {data.isFinalized ? <Lock size={15} /> : <Unlock size={15} />}
            </button>
            <button className={styles.iconBtn} title="Share" aria-label="Share project">
              <Share2 size={15} />
            </button>
          </>
        ) : null}
        <button
          className={styles.iconBtn}
          onClick={() => dispatch({ type: 'SET_THEME', theme: theme === 'dark' ? 'light' : 'dark' })}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        {wizardPhase === 'workspace' && (
          <button className={styles.iconBtn} title="Settings" aria-label="Settings">
            <Settings size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
