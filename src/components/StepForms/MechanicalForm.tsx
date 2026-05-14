import { useApp } from '../../store';
import { flattenItems } from '../../data/projectItems';
import type { InletStrategy } from '../../types';
import { OptionButton } from '../ui/OptionButton';
import { MultiSelect } from '../ui/MultiSelect';
import { InfoHint } from '../ui/InfoHint';
import styles from './forms.module.css';

export function MechanicalForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;
  const update = (payload: Record<string, unknown>) => dispatch({ type: 'UPDATE_DATA', payload });
  const leaves = flattenItems(state.projectItems);
  const wallFrozen = leaves.find((i) => i.id === 'wallReturns')?.autoEngineeringFrozen;
  const floorFrozen = leaves.find((i) => i.id === 'floorReturns')?.autoEngineeringFrozen;

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Mechanical Systems</h2>
        <InfoHint
          contextLabel="Mechanical Systems"
          text="Choose how to specify your mechanical equipment. 'I know my system' lets you pick brands directly in each equipment step. 'Help me choose' uses your priorities to guide recommendations across Filtration, Sanitation, and Heating."
        />
      </div>
      <OptionButton
        label="System Knowledge"
        options={[
          { value: 'know', label: 'I know my system' },
          { value: 'help', label: 'Help me choose' },
        ]}
        value={d.mechanicalKnowledge}
        onChange={(v) => update({ mechanicalKnowledge: v })}
        disabled={disabled}
      />
      {d.mechanicalKnowledge === 'help' && (
        <div className={styles.conditional}>
          <MultiSelect
            label="Priorities"
            options={[
              { value: 'Energy Efficiency', label: 'Energy Efficiency' },
              { value: 'Low Maintenance', label: 'Low Maintenance' },
              { value: 'Budget', label: 'Budget Friendly' },
              { value: 'Performance', label: 'Performance' },
              { value: 'Quiet Operation', label: 'Quiet Operation' },
            ]}
            value={d.mechanicalPriorities}
            onChange={(v) => update({ mechanicalPriorities: v })}
            disabled={disabled}
          />
        </div>
      )}
      <div className={styles.conditional}>
        <OptionButton
          label="Inlet placement (returns)"
          options={[
            { value: 'wall-only', label: 'Wall only' },
            { value: 'auto-shelf', label: 'Auto on shelves' },
            { value: 'floor-only', label: 'Floor only' },
          ]}
          value={d.inletStrategy}
          onChange={(v) => update({ inletStrategy: v as InletStrategy })}
          disabled={disabled}
        />
        <p className={styles.formDesc} style={{ marginTop: '8px', marginBottom: 0 }}>
          Drives wall vs floor return counts from design GPM and pool sections (shallow shelf share).
        </p>
        {(wallFrozen || floorFrozen) && (
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={disabled}
            onClick={() => dispatch({ type: 'RESYNC_INLET_COUNTS' })}
          >
            Re-apply auto inlet counts
          </button>
        )}
      </div>
    </div>
  );
}
