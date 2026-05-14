import { useMemo } from 'react';
import { Ban, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../store';
import { calculateVolumeTotals } from '../../data/poolSections';
import { isDeckStepVisible, deckDivingSuppressedByLocalCode } from '../../utils/codeFeatures';
import { InfoHint } from '../ui/InfoHint';
import formStyles from './forms.module.css';
import styles from './DeckForm.module.css';

const DECK_INFO_TEXT = 'Total deck surface area surrounding the pool. The deck-to-pool ratio drives the bather-load category used downstream in engineering.';

function fmtNum(n: number, digits = 0): string {
  if (!Number.isFinite(n) || n === 0) return digits === 0 ? '0' : (0).toFixed(digits);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Brett spec — bather-load deck-ratio category. */
function deckCategory(deckSf: number, waterSurfaceArea: number):
  | { key: 'minimum' | 'equal' | 'double'; label: string; ratio: number }
  | null {
  if (deckSf <= 0 || waterSurfaceArea <= 0) return null;
  const ratio = deckSf / waterSurfaceArea;
  if (deckSf < waterSurfaceArea) return { key: 'minimum', label: 'Minimum Deck', ratio };
  if (deckSf < 2 * waterSurfaceArea) return { key: 'equal', label: 'Equal Deck', ratio };
  return { key: 'double', label: 'Double Deck', ratio };
}

export function DeckForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;

  const volumeTotals = useMemo(() => calculateVolumeTotals(d.poolSections), [d.poolSections]);
  const waterSurfaceArea = volumeTotals.totalArea;
  const category = deckCategory(d.deckSf, waterSurfaceArea);

  const setDeckSf = (v: number) =>
    dispatch({ type: 'UPDATE_DATA', payload: { deckSf: Math.max(0, v) } });

  const showInputs = isDeckStepVisible(d);
  const suppressedByCode = deckDivingSuppressedByLocalCode(d);

  if (!showInputs && suppressedByCode) {
    return (
      <div className={formStyles.form}>
        <div className={styles.titleRow}>
          <h2 className={formStyles.formTitle}>Deck</h2>
          <InfoHint contextLabel="Deck" text={DECK_INFO_TEXT} />
          <span className={styles.codeUnavailableBadge}>
            <Ban size={13} aria-hidden="true" />
            Due to local code this option is unavailable
          </span>
        </div>
        <div className={styles.naPanel}>
          <p className={styles.naTitle}>Not applicable under selected code standards</p>
          <p className={styles.naBody}>
            You selected a model code that marks deck data as out of scope for this configuration
            path. Remove that code on <strong>Code Standards</strong> or use the override if an
            exception still requires deck square footage.
          </p>
          <div className={styles.naActions}>
            <button
              type="button"
              className={styles.naBtn}
              disabled={disabled}
              onClick={() =>
                dispatch({ type: 'UPDATE_DATA', payload: { deckDivingWizardOverride: true } })
              }
            >
              Configure deck anyway
            </button>
            <span className={styles.naGhost}>Also restores the Diving Board step when it was hidden by code or pool class.</span>
          </div>
        </div>
      </div>
    );
  }

  if (!showInputs) {
    return (
      <div className={formStyles.form}>
        <div className={styles.titleRow}>
          <h2 className={formStyles.formTitle}>Deck</h2>
          <InfoHint contextLabel="Deck" text={DECK_INFO_TEXT} />
        </div>
        <div className={styles.naPanel}>
          <p className={styles.naTitle}>Not applicable for the selected pool class</p>
          <p className={styles.naBody}>
            For fountains, splash pads, and similar vessels we usually skip deck sizing in this
            wizard. If your jurisdiction or contract still needs deck square footage, enable the
            override below.
          </p>
          <div className={styles.naActions}>
            <button
              type="button"
              className={styles.naBtn}
              disabled={disabled}
              onClick={() =>
                dispatch({ type: 'UPDATE_DATA', payload: { deckDivingWizardOverride: true } })
              }
            >
              Configure deck anyway
            </button>
            <span className={styles.naGhost}>Also shows the Diving Board step when it was hidden.</span>
          </div>
        </div>
      </div>
    );
  }

  const isComplete = d.deckSf > 0;

  return (
    <div className={formStyles.form}>
      <div className={styles.titleRow}>
        <h2 className={formStyles.formTitle}>Deck</h2>
        <InfoHint contextLabel="Deck" text={DECK_INFO_TEXT} />
        {isComplete && (
          <span className={styles.completeBadge}>
            <CheckCircle2 size={13} aria-hidden="true" />
            Complete
          </span>
        )}
      </div>

      <div className={styles.sectionLabel}>Deck Area</div>

      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Total deck area</span>
          <div className={styles.numWrap}>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={50}
              className={`${styles.input} ${styles.inputNum}`}
              value={d.deckSf === 0 ? '' : d.deckSf}
              onChange={(e) => setDeckSf(e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder="0"
              disabled={disabled}
              aria-label="Deck area in square feet"
            />
            <span className={styles.unit}>sf</span>
          </div>
        </label>
      </div>

      <div className={styles.totalsLabel}>Bather-Load Impact</div>

      <div className={styles.totals}>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Deck-to-pool ratio</div>
          <div className={styles.totalValueRow}>
            <span className={styles.totalValue}>
              {category ? fmtNum(category.ratio, 2) : '—'}
            </span>
            <span className={styles.totalUnit}>×</span>
          </div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Category</div>
          <div className={styles.totalValueRow}>
            <span className={`${styles.totalValue} ${styles.totalValueText}`}>
              {category ? category.label : '—'}
            </span>
          </div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Water surface area</div>
          <div className={styles.totalValueRow}>
            <span className={styles.totalValue}>{fmtNum(waterSurfaceArea, 0)}</span>
            <span className={styles.totalUnit}>sq ft</span>
          </div>
        </div>
      </div>
    </div>
  );
}
