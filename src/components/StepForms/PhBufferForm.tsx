import { useApp } from '../../store';
import { OptionButton } from '../ui/OptionButton';
import { InfoHint } from '../ui/InfoHint';
import { getOptionCost } from '../../data/configCosts';
import styles from './forms.module.css';

/** Travis Apr 24 — pH buffer / acid feed system. */
const OPTIONS = [
  { value: 'No pH Buffer', label: 'No pH Buffer' },
  { value: 'CO2', label: 'CO₂' },
  { value: 'Liquid muriatic acid', label: 'Liquid muriatic acid' },
  { value: 'Tablet acid', label: 'Tablet acid' },
].map((o) => ({ ...o, cost: getOptionCost('phBuffer', o.value)?.cost }));

export function PhBufferForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>pH Buffer</h2>
        <InfoHint
          contextLabel="pH Buffer"
          text="How the pool keeps pH from drifting up. CO₂ is gentler and tank-fed; acid systems are cheaper to install but require regular replenishment."
        />
      </div>
      <OptionButton
        label="System"
        options={OPTIONS}
        value={d.phBuffer}
        onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { phBuffer: v } })}
        disabled={disabled}
      />
    </div>
  );
}
