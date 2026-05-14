import { useMemo } from 'react';
import { Plus, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../store';
import { Select } from '../ui/Select';
import {
  POOL_SECTION_TYPE_OPTIONS,
  calculateVolumeTotals,
  makeEmptyPoolSection,
  sectionVolume,
  type PoolSection,
  type PoolSectionType,
} from '../../data/poolSections';
import { InfoHint } from '../ui/InfoHint';
import formStyles from './forms.module.css';
import styles from './VolumeForm.module.css';

function fmtNum(n: number, digits = 0): string {
  if (!Number.isFinite(n) || n === 0) return digits === 0 ? '0' : (0).toFixed(digits);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtCubic(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${fmtNum(n, 0)} cf`;
}

export function VolumeForm() {
  const { state, dispatch } = useApp();
  const sections = state.data.poolSections;
  const disabled = state.data.isFinalized;

  const totals = useMemo(() => calculateVolumeTotals(sections), [sections]);

  const update = (next: PoolSection[]) =>
    dispatch({ type: 'UPDATE_DATA', payload: { poolSections: next } });

  const patchRow = (id: string, patch: Partial<PoolSection>) =>
    update(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const removeRow = (id: string) => update(sections.filter((s) => s.id !== id));

  const addRow = () => update([...sections, makeEmptyPoolSection()]);

  const isComplete =
    sections.length > 0 &&
    sections.every((s) => s.label.trim().length > 0 && s.area > 0 && s.depth > 0);

  return (
    <div className={formStyles.form}>
      <div className={styles.titleRow}>
        <h2 className={`${formStyles.formTitle} ${styles.volumeTitle}`}>Volume Calculator</h2>
        <InfoHint
          contextLabel="Volume Calculator"
          text="Add a row for each distinct area of the pool. Volume and gallons are calculated automatically from area and average depth."
        />
        {isComplete && (
          <span className={styles.completeBadge}>
            <CheckCircle2 size={13} aria-hidden="true" />
            Complete
          </span>
        )}
      </div>

      <div className={styles.sectionLabel}>Pool Sections</div>

      <div className={styles.table} role="table" aria-label="Pool sections">
        <div className={styles.tableHead} role="row">
          <div className={styles.colLabel} role="columnheader">Label</div>
          <div className={styles.colType} role="columnheader">Type</div>
          <div className={styles.colArea} role="columnheader">Area</div>
          <div className={styles.colDepth} role="columnheader">Depth</div>
          <div className={styles.colVolume} role="columnheader">Volume</div>
          <div className={styles.colRemove} role="columnheader" aria-label="Remove" />
        </div>

        {sections.map((row) => (
          <div className={styles.row} role="row" key={row.id}>
            <div className={`${styles.cell} ${styles.colLabel}`} role="cell">
              <input
                type="text"
                className={styles.input}
                value={row.label}
                onChange={(e) => patchRow(row.id, { label: e.target.value })}
                placeholder="e.g. Shallow end"
                disabled={disabled}
                aria-label="Section label"
              />
            </div>

            <div className={`${styles.cell} ${styles.colType}`} role="cell">
              <Select<PoolSectionType>
                ariaLabel="Section type"
                options={POOL_SECTION_TYPE_OPTIONS}
                value={row.type}
                onChange={(v) => patchRow(row.id, { type: v })}
                disabled={disabled}
              />
            </div>

            <div className={`${styles.cell} ${styles.colArea}`} role="cell">
              <div className={styles.numWrap}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1}
                  className={`${styles.input} ${styles.inputNum}`}
                  value={row.area === 0 ? '' : row.area}
                  onChange={(e) =>
                    patchRow(row.id, { area: e.target.value === '' ? 0 : Number(e.target.value) })
                  }
                  placeholder="0"
                  disabled={disabled}
                  aria-label="Area in square feet"
                />
                <span className={styles.unit}>sf</span>
              </div>
            </div>

            <div className={`${styles.cell} ${styles.colDepth}`} role="cell">
              <div className={styles.numWrap}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  className={`${styles.input} ${styles.inputNum}`}
                  value={row.depth === 0 ? '' : row.depth}
                  onChange={(e) =>
                    patchRow(row.id, { depth: e.target.value === '' ? 0 : Number(e.target.value) })
                  }
                  placeholder="0"
                  disabled={disabled}
                  aria-label="Depth in feet"
                />
                <span className={styles.unit}>ft</span>
              </div>
            </div>

            <div className={`${styles.cell} ${styles.colVolume} ${styles.cellVolume}`} role="cell">
              {fmtCubic(sectionVolume(row))}
            </div>

            <div className={`${styles.cell} ${styles.colRemove}`} role="cell">
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeRow(row.id)}
                disabled={disabled || sections.length <= 1}
                aria-label={`Remove section ${row.label || 'row'}`}
                title={sections.length <= 1 ? 'At least one section is required' : 'Remove section'}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className={styles.addRow}
          onClick={addRow}
          disabled={disabled}
        >
          <Plus size={14} aria-hidden="true" />
          Add another row
        </button>
      </div>

      <div className={styles.totalsLabel}>Totals</div>

      <div className={styles.totals}>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Total area</div>
          <div className={styles.totalValueRow}>
            <span className={styles.totalValue}>{fmtNum(totals.totalArea, 0)}</span>
            <span className={styles.totalUnit}>sq ft</span>
          </div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Total gallons</div>
          <div className={styles.totalValueRow}>
            <span className={styles.totalValue}>{fmtNum(totals.totalGallons, 0)}</span>
            <span className={styles.totalUnit}>gal</span>
          </div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Average depth</div>
          <div className={styles.totalValueRow}>
            <span className={styles.totalValue}>
              {totals.totalArea > 0 ? fmtNum(totals.averageDepth, 2) : '—'}
            </span>
            <span className={styles.totalUnit}>ft</span>
          </div>
        </div>
      </div>
    </div>
  );
}
