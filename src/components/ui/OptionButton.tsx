import styles from './ui.module.css';

function fmtCost(n: number): string {
  if (n === 0) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

interface Props {
  label?: string;
  options: { value: string; label: string; cost?: number }[];
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function OptionButton({ label, options, value, onChange, disabled }: Props) {
  const hasCosts = options.some((o) => o.cost != null);

  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.optionGrid}>
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.optionBtn} ${value === opt.value ? styles.optionActive : ''}`}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            type="button"
          >
            <span className={styles.optionDot}>
              {value === opt.value && <span className={styles.optionDotInner} />}
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
