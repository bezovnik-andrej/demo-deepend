import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  /** Pre-label shown inside the trigger (e.g. "Sort by"). Optional. */
  prefix?: string;
  /** Visually-hidden label for screen readers. */
  ariaLabel: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Compact 28px height to match filter chips. Defaults to "sm". */
  size?: 'sm' | 'md';
  /** Right-align the dropdown panel. Defaults to false. */
  alignEnd?: boolean;
  disabled?: boolean;
}

export function Select<T extends string>({
  prefix,
  ariaLabel,
  options,
  value,
  onChange,
  size = 'sm',
  alignEnd = false,
  disabled,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value);
    const t = window.setTimeout(() => setHighlightIdx(idx >= 0 ? idx : 0), 0);
    return () => window.clearTimeout(t);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (v: T) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[highlightIdx];
      if (opt) handleSelect(opt.value);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHighlightIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHighlightIdx(options.length - 1);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${size === 'md' ? styles.rootMd : ''}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <span className={styles.value}>{selected?.label ?? '—'}</span>
        <ChevronDown size={12} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>
      {open && (
        <ul
          className={`${styles.menu} ${alignEnd ? styles.menuEnd : ''}`}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHighlight = i === highlightIdx;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${isHighlight ? styles.optionHighlight : ''} ${
                    isSelected ? styles.optionSelected : ''
                  }`}
                  onMouseEnter={() => setHighlightIdx(i)}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className={styles.optionLabel}>{opt.label}</span>
                  {isSelected && <Check size={12} className={styles.optionCheck} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
