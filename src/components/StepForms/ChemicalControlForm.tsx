import { useApp } from '../../store';
import { OptionButton } from '../ui/OptionButton';
import { InfoHint } from '../ui/InfoHint';
import { getOptionCost } from '../../data/configCosts';
import styles from './forms.module.css';

/** Travis Apr 24 — chemical controller tiers, named after CAT family for shorthand. */
const OPTIONS = [
  { value: 'No Chemical Control', label: 'No Chemical Control' },
  { value: 'Basic (CAT 2000)', label: 'Basic (CAT 2000)' },
  { value: 'Mid (CAT 3500/4000)', label: 'Mid (CAT 3500 / 4000)' },
  { value: 'Advanced (CAT 5000)', label: 'Advanced (CAT 5000)' },
].map((o) => ({ ...o, cost: getOptionCost('chemicalControl', o.value)?.cost }));

export function ChemicalControlForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Chemical Control</h2>
        <InfoHint
          contextLabel="Chemical Control"
          text="Automated chemistry controller. Pick a tier — controllers monitor pH/ORP (basic) up through full free-chlorine + dosing logic (advanced)."
        />
      </div>
      <OptionButton
        label="Controller Tier"
        options={OPTIONS}
        value={d.chemicalControl}
        onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { chemicalControl: v } })}
        disabled={disabled}
      />
    </div>
  );
}
