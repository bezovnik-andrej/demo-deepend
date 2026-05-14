import { useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../store';
import { STEP_DEFINITIONS } from '../../types';
import type { ConfigStep } from '../../types';
import { StepEditor } from '../StepEditor/StepEditor';
import styles from './ConfigDrawer.module.css';

export function ConfigDrawer() {
  const { state, dispatch } = useApp();

  const visibleSteps = useMemo(
    () => STEP_DEFINITIONS.filter((s) => s.isVisible(state.data)),
    [state.data],
  );

  const currentIndex = visibleSteps.findIndex((s) => s.id === state.activeStep);

  const goTo = useCallback(
    (step: ConfigStep) => dispatch({ type: 'OPEN_CONFIG_DRAWER', step }),
    [dispatch],
  );

  const goPrev = () => {
    if (currentIndex > 0) goTo(visibleSteps[currentIndex - 1].id);
  };

  const goNext = () => {
    if (currentIndex < visibleSteps.length - 1) goTo(visibleSteps[currentIndex + 1].id);
  };

  const stepMeta = state.activeStep
    ? STEP_DEFINITIONS.find((s) => s.id === state.activeStep)
    : null;

  return (
    <div className={`${styles.overlay} ${state.configDrawerOpen ? styles.open : ''}`}>
      {state.configDrawerOpen && (
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.headerLabel}>Configuration</span>
            {stepMeta && (
              <>
                <span className={styles.headerSep}>/</span>
                <span className={styles.headerStep}>{stepMeta.label}</span>
              </>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => dispatch({ type: 'CLOSE_CONFIG_DRAWER' })}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className={styles.body}>
          <StepEditor />
        </div>

        <div className={styles.footer}>
          <button
            className={styles.navBtn}
            onClick={goPrev}
            disabled={currentIndex <= 0}
          >
            <ChevronLeft size={14} />
            <span>Back</span>
          </button>

          <span className={styles.stepCounter}>
            {currentIndex + 1} / {visibleSteps.length}
          </span>

          <button
            className={`${styles.navBtn} ${styles.navBtnPrimary}`}
            onClick={goNext}
            disabled={currentIndex >= visibleSteps.length - 1}
          >
            <span>Continue</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
