import { useState } from 'react';
import { InfoHint } from './InfoHint';
import styles from './ui.module.css';

function fmtCost(n: number): string {
  if (n === 0) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export interface NestedGroup {
  family: string;
  label: string;
  /** Optional overview copy for the family (info popover). */
  familyHelp?: string;
  options: {
    value: string;
    label: string;
    cost?: number;
    /** Suffix appended to the cost chip (e.g. "/LF"). */
    costSuffix?: string;
    /** Optional small badge shown next to the label (e.g. coping width "12\""). */
    badge?: string;
    helpText?: string;
  }[];
}

interface BaseProps {
  label: string;
  groups: NestedGroup[];
  disabled?: boolean;
  /** Optional label for the variant row. Defaults to "Style". */
  variantLabel?: string;
}

interface SingleProps extends BaseProps {
  mode?: 'single';
  value: string | null;
  onChange: (value: string | null) => void;
}

interface MultiProps extends BaseProps {
  mode: 'multi';
  value: string[];
  onChange: (value: string[]) => void;
}

type Props = SingleProps | MultiProps;

function findFamilyByValue(groups: NestedGroup[], value: string | null): string | null {
  if (!value) return null;
  return groups.find((g) => g.options.some((o) => o.value === value))?.family ?? null;
}

function findValueInFamily(groups: NestedGroup[], values: string[], family: string): string | null {
  const group = groups.find((g) => g.family === family);
  if (!group) return null;
  return values.find((value) => group.options.some((o) => o.value === value)) ?? null;
}

function removeFamilyValue(groups: NestedGroup[], values: string[], family: string): string[] {
  const group = groups.find((g) => g.family === family);
  if (!group) return values;
  const familyValues = new Set(group.options.map((o) => o.value));
  return values.filter((value) => !familyValues.has(value));
}

export function NestedOptionButton({
  mode = 'single',
  label,
  groups,
  value,
  onChange,
  disabled,
  variantLabel = 'Style',
}: Props) {
  const isMulti = mode === 'multi';
  const singleValue = isMulti ? null : (value as string | null);
  const multiValues = isMulti ? (value as string[]) : [];
  const onChangeSingle = onChange as (value: string | null) => void;
  const onChangeMulti = onChange as (value: string[]) => void;
  const valueFamily = findFamilyByValue(groups, singleValue);
  const [familyOverride, setFamilyOverride] = useState<string | null>(null);
  const expandedFamily = familyOverride ?? valueFamily;
  const singleActiveGroup = !isMulti
    ? groups.find((g) => g.family === expandedFamily) ?? null
    : null;
  const multiActiveGroups = isMulti
    ? groups.filter((g) => findValueInFamily(groups, multiValues, g.family))
    : [];
  const hasCosts = groups.some((g) => g.options.some((o) => o.cost != null));

  const handleFamilyClick = (group: NestedGroup) => {
    if (disabled) return;
    if (!isMulti) {
      setFamilyOverride(group.family);
      return;
    }

    const existing = findValueInFamily(groups, multiValues, group.family);
    if (existing) {
      onChangeMulti(removeFamilyValue(groups, multiValues, group.family));
      return;
    }

    const first = group.options[0];
    if (!first) return;
    onChangeMulti([...multiValues, first.value]);
  };

  const handleVariantClick = (group: NestedGroup, variantValue: string) => {
    if (disabled) return;
    if (!isMulti) {
      if (singleValue === variantValue) {
        onChangeSingle(null);
      } else {
        onChangeSingle(variantValue);
      }
      setFamilyOverride(null);
      return;
    }

    onChangeMulti([...removeFamilyValue(groups, multiValues, group.family), variantValue]);
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>

      <div role="group" aria-label={`${label} — family`} className={styles.familyRow}>
        {groups.map((group) => {
          const isExpanded = !isMulti && group.family === expandedFamily;
          const containsValue = !isMulti
            ? group.family === valueFamily
            : Boolean(findValueInFamily(groups, multiValues, group.family));
          return (
            <span key={group.family} className={styles.familyChipWrap}>
              <button
                type="button"
                className={`${styles.familyChip} ${disabled ? styles.familyChipDisabled : ''} ${isExpanded ? styles.familyChipActive : ''} ${containsValue ? styles.familyChipSelected : ''}`}
                aria-expanded={!isMulti ? isExpanded : containsValue}
                aria-pressed={containsValue}
                onClick={() => handleFamilyClick(group)}
                disabled={disabled}
              >
                <span className={styles.familyIndicatorWrap}>
                  <span
                    className={`${!isMulti ? styles.familyRadioFace : styles.checkbox} ${styles.familyCheckboxFace}`}
                    aria-hidden
                  >
                    {!isMulti
                      ? containsValue && <span className={styles.familyRadioInner} />
                      : containsValue && <span className={styles.checkmark}>✓</span>}
                  </span>
                </span>
                <span className={styles.familyLabel}>{group.label}</span>
              </button>
              {group.familyHelp && (
                <InfoHint contextLabel={group.label} text={group.familyHelp} disabled={disabled} />
              )}
            </span>
          );
        })}
      </div>

      {(!isMulti ? (singleActiveGroup ? [singleActiveGroup] : []) : multiActiveGroups).map((group) => (
        <div
          key={group.family}
          className={`${styles.variantRow} ${styles.variantRowOpen}`}
          aria-live="polite"
        >
          <div className={styles.variantLabel}>
            {variantLabel} · {group.label}
          </div>
          <div
            role="radiogroup"
            aria-label={`${label} — ${group.label}`}
            className={styles.optionGrid}
          >
            {group.options.map((opt) => {
              const isSelected = !isMulti
                ? singleValue === opt.value
                : multiValues.includes(opt.value);
              return (
                <div key={opt.value} className={styles.optionHintRow}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`${styles.optionBtn} ${isSelected ? styles.optionActive : ''}`}
                    onClick={() => handleVariantClick(group, opt.value)}
                    disabled={disabled}
                  >
                    <span className={styles.optionDot}>
                      {isSelected && <span className={styles.optionDotInner} />}
                    </span>
                    <span className={styles.optionLabel}>
                      {opt.label}
                      {opt.badge && <span className={styles.optionBadge}>{opt.badge}</span>}
                    </span>
                    {hasCosts && opt.cost != null && (
                      <span className={styles.optionCost}>
                        {fmtCost(opt.cost)}
                        {opt.costSuffix && (
                          <span className={styles.optionCostSuffix}>{opt.costSuffix}</span>
                        )}
                      </span>
                    )}
                  </button>
                  {opt.helpText && (
                    <InfoHint contextLabel={opt.label} text={opt.helpText} disabled={disabled} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
