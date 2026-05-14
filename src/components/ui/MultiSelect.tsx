import styles from './ui.module.css';

function fmtCost(n: number): string {
  if (n === 0) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

interface Props {
  label: string;
  options: { value: string; label: string; cost?: number }[];
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}

export function MultiSelect({ label, options, value, onChange, disabled }: Props) {
  const toggle = (v: string) => {
    if (disabled) return;
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const hasCosts = options.some((o) => o.cost != null);

  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        <span className={styles.hint}>(select multiple)</span>
      </label>
      <div className={styles.optionGrid}>
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.optionBtn} ${value.includes(opt.value) ? styles.optionActive : ''}`}
            onClick={() => toggle(opt.value)}
            disabled={disabled}
            type="button"
          >
            <span className={styles.checkbox}>
              {value.includes(opt.value) && <span className={styles.checkmark}>✓</span>}
            </span>
            <span className={styles.optionLabel}>{opt.label}</span>
            {hasCosts && opt.cost != null && (
              <span className={styles.optionCost}>{fmtCost(opt.cost)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
