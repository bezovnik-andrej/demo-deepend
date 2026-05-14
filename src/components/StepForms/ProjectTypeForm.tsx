import { useApp } from '../../store';
import { OptionButton } from '../ui/OptionButton';
import { InfoHint } from '../ui/InfoHint';
import styles from './forms.module.css';

export function ProjectTypeForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Project Type</h2>
        <InfoHint
          contextLabel="Project Type"
          text="Whether this is a new build, a renovation of an existing pool, or an addition to an existing facility. Affects scope assumptions throughout the configuration."
        />
      </div>
      <OptionButton
        label="Type"
        options={[
          { value: 'New Construction', label: 'New Construction' },
          { value: 'Renovation', label: 'Renovation' },
          { value: 'Addition', label: 'Addition' },
        ]}
        value={d.projectType}
        onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { projectType: v } })}
        disabled={disabled}
      />

      <div className={styles.blockTitleRow}>
        <h3 className={styles.blockTitle}>Pool environment</h3>
        <InfoHint
          contextLabel="Pool environment"
          text="Indoor vs outdoor affects heater surface-loss assumptions and is summarized on the Heating step as read-only context."
        />
      </div>
      <OptionButton
        label=""
        options={[
          { value: 'outdoor', label: 'Outdoor' },
          { value: 'indoor', label: 'Indoor' },
        ]}
        value={d.poolEnvironment}
        onChange={(v) =>
          dispatch({
            type: 'UPDATE_DATA',
            payload: { poolEnvironment: v as 'indoor' | 'outdoor' },
          })
        }
        disabled={disabled}
      />
    </div>
  );
}
