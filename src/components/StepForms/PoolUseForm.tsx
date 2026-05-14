import { useApp } from '../../store';
import { NestedOptionButton, type NestedGroup } from '../ui/NestedOptionButton';
import { InfoHint } from '../ui/InfoHint';
import { POOL_TYPE_GROUPS, getPoolType, getPoolTypeHelpBlurb } from '../../data/poolTypes';
import { getOptionCost } from '../../data/configCosts';
import styles from './forms.module.css';
import poolTypeStyles from './PoolUseForm.module.css';

/** Map data-layer pool-type groups to NestedOptionButton's NestedGroup shape. */
const NESTED_GROUPS: NestedGroup[] = POOL_TYPE_GROUPS.map((g) => ({
  family: g.family,
  label: g.label,
  familyHelp: g.familyHelp,
  options: g.options.map((p) => ({
    value: p.id,
    label: p.label,
    cost: getOptionCost('poolUseType', p.id)?.cost,
    helpText: getPoolTypeHelpBlurb(p),
  })),
}));

export function PoolUseForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;

  const selected = getPoolType(d.poolUseType);

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Pool Use Type</h2>
        <InfoHint
          contextLabel="Pool use type"
          text="Pick the ISPSC classification that best matches the project. Each option controls turnover time, bather-load defaults, and which mechanical steps apply. Class A/B/C use a depth-based turnover formula; everything else uses a fixed value. Use the 'i' on each row for plain-language descriptions."
        />
      </div>

      <NestedOptionButton
        mode="single"
        label="Type"
        variantLabel="Pool"
        groups={NESTED_GROUPS}
        value={d.poolUseType}
        onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { poolUseType: v } })}
        disabled={disabled}
      />

      {selected && (
        <div className={poolTypeStyles.metaCard}>
          <div className={poolTypeStyles.metaRow}>
            <span className={poolTypeStyles.metaLabel}>ISPSC Class</span>
            <span className={poolTypeStyles.metaValue}>{selected.ispscClass}</span>
          </div>
          <div className={poolTypeStyles.metaRow}>
            <span className={poolTypeStyles.metaLabel}>Turnover</span>
            <span className={poolTypeStyles.metaValue}>
              {selected.turnoverHours === 'depth-based'
                ? 'Depth-based (min(1.5 × avg depth, 6h))'
                : `${selected.turnoverHours} hr`}
            </span>
          </div>
          {selected.description && (
            <p className={poolTypeStyles.metaDesc}>{selected.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
