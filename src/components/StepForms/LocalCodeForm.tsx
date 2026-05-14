import { useState, type KeyboardEvent, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { useApp } from '../../store';
import { OptionButton } from '../ui/OptionButton';
import { MultiSelect } from '../ui/MultiSelect';
import { InfoHint } from '../ui/InfoHint';
import { CODE_STANDARDS } from '../../data/codeStandards';
import { suggestedCodesForState } from '../../data/codeJurisdiction';
import formStyles from './forms.module.css';
import styles from './LocalCodeForm.module.css';

const CODE_OPTIONS = CODE_STANDARDS.map((c) => ({
  value: c.id,
  label: c.label,
}));

export function LocalCodeAwarenessForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;

  const update = (payload: Record<string, unknown>) =>
    dispatch({ type: 'UPDATE_DATA', payload });

  return (
    <div className={formStyles.form}>
      <div className={formStyles.formTitleRow}>
        <h2 className={formStyles.formTitle}>Local Code Awareness</h2>
        <InfoHint
          contextLabel="Local Code Awareness"
          text="Are you familiar with the local building codes that apply to this project? Codes will autopopulate from project location in a future release."
        />
      </div>

      <OptionButton
        label="Awareness"
        options={[
          { value: 'yes', label: 'Yes, I know the codes' },
          { value: 'no', label: 'No, not familiar' },
          { value: 'help', label: 'Need help identifying' },
        ]}
        value={d.localCodeAwareness}
        onChange={(v) => update({ localCodeAwareness: v })}
        disabled={disabled}
      />
    </div>
  );
}

export function LocalCodeDetailsForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;

  const [draft, setDraft] = useState('');

  const update = (payload: Record<string, unknown>) =>
    dispatch({ type: 'UPDATE_DATA', payload });

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    if (d.customCodes.includes(trimmed)) {
      setDraft('');
      return;
    }
    update({ customCodes: [...d.customCodes, trimmed] });
    setDraft('');
  };

  const removeCustom = (code: string) =>
    update({ customCodes: d.customCodes.filter((c) => c !== code) });

  const onDraftKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    }
  };

  const suggested = useMemo(
    () => suggestedCodesForState(d.projectState),
    [d.projectState],
  );

  const adopt = (id: string) => {
    if (d.codeStandards.includes(id)) return;
    update({ codeStandards: [...d.codeStandards, id] });
  };

  if (d.localCodeAwareness !== 'yes') {
    return (
      <div className={formStyles.form}>
        <div className={formStyles.formTitleRow}>
        <h2 className={formStyles.formTitle}>Code Standards</h2>
        <InfoHint
          contextLabel="Code Standards"
          text='Set Code Awareness to "Yes, I know the codes" before selecting standards here.'
        />
      </div>
      </div>
    );
  }

  return (
    <div className={formStyles.form}>
      <div className={formStyles.formTitleRow}>
        <h2 className={formStyles.formTitle}>Code Standards</h2>
        <InfoHint
          contextLabel="Code Standards"
          text="Select every model code or state rule that governs this pool. Use the suggestion panel as a starting point only — confirm with the local AHJ. One option can mark Deck and Diving Board as not applicable unless you use the wizard override on those steps."
        />
      </div>

      <div className={styles.suggestedPanel}>
        <div className={styles.suggestedHeader}>
          <span className={styles.suggestedTitle}>Suggested codes for your jurisdiction</span>
          <span className={styles.previewPill}>Preview — confirm with local AHJ</span>
        </div>
        <p className={styles.suggestedHint}>
          Based on project state <strong>{d.projectState?.trim() || '—'}</strong> (set on the project
          address step). One tap adds a code to your selection; it does not replace engineering
          judgment.
        </p>
        <ul className={styles.suggestedList}>
          {suggested.map((c) => (
            <li key={c.id} className={styles.suggestedRow}>
              <div>
                <div className={styles.suggestedShort}>{c.short}</div>
                <div className={styles.suggestedLabel}>{c.label}</div>
              </div>
              <button
                type="button"
                className={styles.adoptBtn}
                disabled={disabled || d.codeStandards.includes(c.id)}
                onClick={() => adopt(c.id)}
              >
                {d.codeStandards.includes(c.id) ? 'Added' : 'Add to selection'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <MultiSelect
        label="Applicable Codes"
        options={CODE_OPTIONS}
        value={d.codeStandards}
        onChange={(v) => update({ codeStandards: v })}
        disabled={disabled}
      />

      <div className={styles.customSection}>
        <div className={styles.customLabel}>Custom Codes</div>
        <p className={styles.customHint}>
          Add any project-specific or local codes not in the list above.
        </p>

        {d.customCodes.length > 0 && (
          <ul className={styles.chipList}>
            {d.customCodes.map((code) => (
              <li key={code} className={styles.chip}>
                <span className={styles.chipText}>{code}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => removeCustom(code)}
                  disabled={disabled}
                  aria-label={`Remove ${code}`}
                  title="Remove"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.addRow}>
          <input
            type="text"
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onDraftKey}
            placeholder="e.g. City of Dallas Pool Ordinance §12.4"
            disabled={disabled}
            aria-label="Custom code"
          />
          <button
            type="button"
            className={styles.addBtn}
            onClick={addCustom}
            disabled={disabled || draft.trim().length === 0}
          >
            <Plus size={14} aria-hidden="true" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
