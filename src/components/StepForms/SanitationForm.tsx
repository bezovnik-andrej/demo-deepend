import { useApp } from '../../store';
import { OptionButton } from '../ui/OptionButton';
import { BrandSelect } from '../ui/BrandSelect';
import { InfoHint } from '../ui/InfoHint';
import { getOptionCost } from '../../data/configCosts';
import { getBrandsForCategory } from '../../data/brands';
import styles from './forms.module.css';

/** Travis Apr 24 — primary sanitizer chemistry options. */
const OPTIONS = [
  { value: 'Liquid Chlorine', label: 'Liquid Chlorine' },
  { value: 'Chlorine Tablets', label: 'Chlorine Tablets' },
  { value: 'Bromine Tablets', label: 'Bromine Tablets' },
  { value: 'Saltwater Chlorine Generator', label: 'Saltwater Chlorine Generator' },
].map((o) => ({ ...o, cost: getOptionCost('sanitationType', o.value)?.cost }));

const SANITATION_BRANDS = getBrandsForCategory('sanitation');

export function SanitationForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const update = (payload: Record<string, unknown>) => dispatch({ type: 'UPDATE_DATA', payload });

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Primary Sanitation</h2>
        <InfoHint
          contextLabel="Primary Sanitation"
          text="The main chemical system keeping the water safe. Choose a preferred equipment brand first, then pick the sanitizer chemistry — from liquid chlorine and salt systems to bromine."
        />
      </div>
      <BrandSelect
        brands={SANITATION_BRANDS}
        value={d.brandPreferences.sanitation}
        onChange={(v) => update({
          brandPreferences: { ...d.brandPreferences, sanitation: v },
        })}
        disabled={d.isFinalized}
      />
      <OptionButton
        label="System"
        options={OPTIONS}
        value={d.sanitationType}
        onChange={(v) => update({ sanitationType: v })}
        disabled={d.isFinalized}
      />
    </div>
  );
}
