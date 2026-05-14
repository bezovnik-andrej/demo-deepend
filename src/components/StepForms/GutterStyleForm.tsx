import { useApp } from '../../store';
import { NestedOptionButton } from '../ui/NestedOptionButton';
import { InfoHint } from '../ui/InfoHint';
import { RECIRCULATION_GROUPS } from '../../data/recirculationOptions';
import styles from './forms.module.css';

export function GutterStyleForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Pool Recirculation</h2>
        <InfoHint
          contextLabel="Pool Recirculation"
          text="The edge and overflow system that returns water to the filtration loop. Options range from standard skimmer systems to fully recessed perimeter gutters and deck-level designs."
        />
      </div>
      <NestedOptionButton
        mode="single"
        label="Family"
        groups={RECIRCULATION_GROUPS as import('../ui/NestedOptionButton').NestedGroup[]}
        value={d.gutterStyle}
        onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { gutterStyle: v } })}
        disabled={disabled}
      />
    </div>
  );
}
