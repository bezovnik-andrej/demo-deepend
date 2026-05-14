import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../../store';
import { MultiSelect } from '../ui/MultiSelect';
import { OptionButton } from '../ui/OptionButton';
import { InfoHint } from '../ui/InfoHint';
import { getOptionCost } from '../../data/configCosts';
import { secondarySanitationRequiredByCodes } from '../../utils/codeFeatures';
import styles from './forms.module.css';

/** Travis Apr 24 — optional polishing systems on top of primary sanitation. */
const OPTIONS = [
  { value: 'Ozone System', label: 'Ozone System' },
  { value: 'Ultraviolet Light System', label: 'Ultraviolet Light System' },
].map((o) => ({ ...o, cost: getOptionCost('secondarySanitation', o.value)?.cost }));

export function SecondarySanitationForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;
  const mode = d.secondarySanitationMode ?? 'auto';

  const codeRequires = useMemo(() => secondarySanitationRequiredByCodes(d), [d]);

  const showSystems =
    mode === 'on' || (mode === 'auto' && codeRequires);

  const isComplete =
    mode === 'off' || (mode === 'auto' && !codeRequires) || (showSystems && d.secondarySanitation.length > 0);

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Secondary Sanitation</h2>
        <InfoHint
          contextLabel="Secondary Sanitation"
          text="Optional polishing systems that supplement the primary chemical sanitizer. Use Auto to follow the demo rule for MAHC / Texas public pools — the UI turns this section on when those codes apply."
        />
        {isComplete && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 500,
              color: '#2dbf72',
              padding: '2px 8px',
              borderRadius: 999,
              background: 'color-mix(in srgb, #2dbf72 12%, transparent)',
            }}
          >
            <CheckCircle2 size={13} aria-hidden />
            Complete
          </span>
        )}
      </div>

      <OptionButton
        label="Secondary sanitation"
        options={[
          { value: 'auto', label: 'Auto (follow codes)' },
          { value: 'on', label: 'On' },
          { value: 'off', label: 'Off' },
        ]}
        value={mode}
        onChange={(v) =>
          dispatch({
            type: 'UPDATE_DATA',
            payload: { secondarySanitationMode: v as 'auto' | 'on' | 'off' },
          })
        }
        disabled={disabled}
      />

      {mode === 'auto' && (
        <p className={styles.formDesc} style={{ marginTop: 8, fontSize: 13 }}>
          {codeRequires
            ? 'Selected codes and pool class suggest secondary sanitation is expected — add systems below.'
            : 'No automatic requirement from the current code + pool class pairing. Switch to On if you still want UV / ozone.'}
        </p>
      )}

      {showSystems ? (
        <MultiSelect
          label="Add-on Systems"
          options={OPTIONS}
          value={d.secondarySanitation}
          onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { secondarySanitation: v } })}
          disabled={disabled}
        />
      ) : (
        <p className={styles.formDesc} style={{ marginTop: 12, color: 'var(--text-muted)' }}>
          Multi-select is hidden while secondary sanitation is off. Your choices are kept if you
          turn it back on.
        </p>
      )}
    </div>
  );
}
