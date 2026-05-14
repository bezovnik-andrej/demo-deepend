import { Grid3x3, Magnet, ZoomIn, ZoomOut, Ruler } from 'lucide-react';
import { useApp } from '../../store';
import { STEP_DEFINITIONS, AUTHORING_MODE_LABELS } from '../../types';
import styles from './StatusBar.module.css';

export function StatusBar() {
  const { state, dispatch } = useApp();
  const { activeWorkspace, data, wizardPhase, activeStep } = state;

  const visibleSteps = STEP_DEFINITIONS.filter((s) => s.group !== 'Review' && s.isVisible(data));
  const completedSteps = visibleSteps.filter((s) => s.isComplete(data));

  const wizardVisibleSteps = STEP_DEFINITIONS.filter((s) => s.isVisible(data));
  const wizardStepIndex =
    activeStep != null ? Math.max(0, wizardVisibleSteps.findIndex((s) => s.id === activeStep)) : 0;

  if (wizardPhase === 'chat') {
    return (
      <div className={styles.bar}>
        <div className={styles.section} />
        <div className={styles.section}>
          <span className={styles.hintLabel}>Tell us about your project to get started</span>
        </div>
        <div className={styles.section} />
      </div>
    );
  }

  if (wizardPhase === 'template') {
    return (
      <div className={styles.bar}>
        <div className={styles.section} />
        <div className={styles.section}>
          <span className={styles.hintLabel}>Choose a template to get started</span>
        </div>
        <div className={styles.section} />
      </div>
    );
  }

  if (wizardPhase === 'wizard') {
    return (
      <div className={styles.bar}>
        <div className={styles.section} />
        <div className={styles.section}>
          <span className={styles.hintLabel}>
            Configuration wizard — Step {wizardStepIndex + 1} of {wizardVisibleSteps.length}
          </span>
        </div>
        <div className={styles.section} />
      </div>
    );
  }

  const isDesign = activeWorkspace === 'design';

  return (
    <div className={styles.bar}>
      <div className={styles.section}>
        {isDesign && (
          <>
            <span className={styles.modeLabel}>
              {AUTHORING_MODE_LABELS[state.authoringMode]}
            </span>
            <span className={styles.divider} />
            <span className={styles.toolLabel}>{state.activeTool}</span>
          </>
        )}
      </div>

      <div className={styles.section}>
        {isDesign && (
          <>
            <button
              className={`${styles.toggle} ${state.gridEnabled ? styles.toggleOn : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
            >
              <Grid3x3 size={11} />
              <span>Grid</span>
            </button>
            <button
              className={`${styles.toggle} ${state.snapEnabled ? styles.toggleOn : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
            >
              <Magnet size={11} />
              <span>Snap</span>
            </button>
            <button
              className={`${styles.toggle} ${state.showDimensions ? styles.toggleOn : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_DIMENSIONS' })}
            >
              <Ruler size={11} />
              <span>Dims</span>
            </button>
          </>
        )}
        {!isDesign && (
          <span className={styles.configLabel}>
            {completedSteps.length}/{visibleSteps.length} config
          </span>
        )}
        {data.isFinalized && (
          <>
            <span className={styles.divider} />
            <span className={styles.lockedLabel}>LOCKED</span>
          </>
        )}
      </div>

      <div className={styles.section}>
        {isDesign && (
          <>
            <span className={styles.configLabel}>
              {completedSteps.length}/{visibleSteps.length} config
            </span>
            <span className={styles.divider} />
            <button className={styles.zoomBtn} onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.zoom - 25 })}>
              <ZoomOut size={12} />
            </button>
            <span className={styles.zoomLabel}>{state.zoom}%</span>
            <button className={styles.zoomBtn} onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.zoom + 25 })}>
              <ZoomIn size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
