import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X, Sparkles } from 'lucide-react';
import { getBrandByValue, type Brand } from '../../data/brands';
import styles from './BrandSelect.module.css';

interface Props {
  /** Display label above the picker. Defaults to "Preferred Brand". */
  label?: string;
  /** Available brands for this picker (filtered for the relevant category). */
  brands: Brand[];
  /** Currently selected brand value (null = "any"). */
  value: string | null;
  /** Called with the selected brand value (or null on clear). */
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function BrandSelect({ label = 'Preferred Brand', brands, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = getBrandByValue(value);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? brands.filter(
        (b) => b.label.toLowerCase().includes(q) || b.dealer.toLowerCase().includes(q),
      )
    : brands;

  // Options list: brands first, then "Any / no preference" as the trailing option.
  const totalOptions = filtered.length + 1; // +1 for "Any"

  const handleSelect = (brandValue: string | null) => {
    onChange(brandValue);
    setOpen(false);
    setQuery('');
    setHighlightIdx(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, totalOptions - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx < filtered.length) {
        handleSelect(filtered[highlightIdx].value);
      } else {
        handleSelect(null);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <div ref={rootRef} className={styles.root} onKeyDown={handleKeyDown}>
        {selected && !open ? (
          <button
            type="button"
            className={`${styles.trigger} ${styles.triggerSelected}`}
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
          >
            <span
              className={styles.brandAvatar}
              style={{ background: selected.avatarColor }}
              aria-hidden="true"
            >
              {selected.initial}
            </span>
            <span className={styles.brandLabel}>{selected.label}</span>
            <span className={styles.brandDealer}>· {selected.dealer}</span>
            <span
              role="button"
              aria-label="Clear brand"
              tabIndex={disabled ? -1 : 0}
              className={styles.clearBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) handleSelect(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!disabled) handleSelect(null);
                }
              }}
            >
              <X size={12} />
            </span>
          </button>
        ) : (
          <button
            type="button"
            className={styles.trigger}
            onClick={() => !disabled && setOpen((o) => !o)}
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            {open ? (
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search brands..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightIdx(0);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={styles.placeholder}>Any / no preference</span>
            )}
            <ChevronDown size={14} className={styles.chevron} />
          </button>
        )}

        {open && (
          <div className={styles.dropdown} role="listbox" aria-label={label}>
            {filtered.length === 0 && (
              <div className={styles.noResults}>No matching brands.</div>
            )}
            {filtered.map((b, i) => {
              const isHighlight = i === highlightIdx;
              const isSelected = b.value === value;
              return (
                <button
                  key={b.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${isHighlight ? styles.optionHighlight : ''} ${isSelected ? styles.optionSelected : ''}`}
                  onMouseEnter={() => setHighlightIdx(i)}
                  onClick={() => handleSelect(b.value)}
                >
                  <span
                    className={styles.brandAvatar}
                    style={{ background: b.avatarColor }}
                    aria-hidden="true"
                  >
                    {b.initial}
                  </span>
                  <span className={styles.brandLabel}>{b.label}</span>
                  <span className={styles.brandDealer}>· {b.dealer}</span>
                </button>
              );
            })}
            <button
              type="button"
              role="option"
              aria-selected={value === null}
              className={`${styles.option} ${styles.optionAny} ${highlightIdx === filtered.length ? styles.optionHighlight : ''} ${value === null ? styles.optionSelected : ''}`}
              onMouseEnter={() => setHighlightIdx(filtered.length)}
              onClick={() => handleSelect(null)}
            >
              <span className={styles.anyIcon} aria-hidden="true">
                <Sparkles size={14} />
              </span>
              <span className={styles.brandLabel}>Any / no preference</span>
              <span className={styles.brandDealer}>· auto-select</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
