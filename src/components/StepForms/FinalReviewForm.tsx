import { useApp } from '../../store';
import { STEP_DEFINITIONS } from '../../types';
import { InfoHint } from '../ui/InfoHint';
import styles from './forms.module.css';

export function FinalReviewForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const visibleSteps = STEP_DEFINITIONS.filter((s) => s.isVisible(d) && s.id !== 'finalReview');

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Final Review</h2>
        <InfoHint
          contextLabel="Final Review"
          text="Review all configuration choices before finalizing. Click any item to edit."
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {visibleSteps.map((step) => {
            const complete = step.isComplete(d);
            const value = step.getValue(d);
            return (
              <tr
                key={step.id}
                style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                onClick={() => {
                  if (state.wizardPhase === 'wizard') {
                    dispatch({ type: 'SET_STEP', step: step.id });
                  } else {
                    dispatch({ type: 'NAVIGATE_TO_STEP', step: step.id });
                  }
                }}
              >
                <td style={{ padding: '4px 8px', fontSize: 'var(--fs-xs)', color: complete ? 'var(--success)' : 'var(--text-muted)' }}>
                  {complete ? '●' : '○'}
                </td>
                <td style={{ padding: '4px 8px', fontSize: 'var(--fs-xs)', color: 'var(--text-primary)' }}>
                  {step.label}
                </td>
                <td style={{ padding: '4px 8px', fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {value || '---'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
