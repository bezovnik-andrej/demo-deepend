import { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import styles from './PriceRangeDual.module.css';

interface PriceRangeDualProps {
  minBound: number;
  maxBound: number;
  floor: number | '';
  ceil: number | '';
  onFloor: (v: number | '') => void;
  onCeil: (v: number | '') => void;
  disabled?: boolean;
}

function pct(value: number, minBound: number, maxBound: number): number {
  const span = maxBound - minBound;
  if (span <= 0) return 0;
  return ((value - minBound) / span) * 100;
}

function nearestThumb(
  clientX: number,
  rect: DOMRect,
  safeLo: number,
  safeHi: number,
  minBound: number,
  maxBound: number,
): 'min' | 'max' {
  const span = maxBound - minBound;
  if (span <= 0 || rect.width <= 0) return 'min';
  const clickPct = ((clientX - rect.left) / rect.width) * 100;
  const loPct = ((safeLo - minBound) / span) * 100;
  const hiPct = ((safeHi - minBound) / span) * 100;
  const dLo = Math.abs(clickPct - loPct);
  const dHi = Math.abs(clickPct - hiPct);
  return dLo <= dHi ? 'min' : 'max';
}

export function PriceRangeDual({
  minBound,
  maxBound,
  floor,
  ceil,
  onFloor,
  onCeil,
  disabled,
}: PriceRangeDualProps) {
  const [focusThumb, setFocusThumb] = useState<'min' | 'max'>('max');
  const sliderRef = useRef<HTMLDivElement>(null);

  const lo = floor === '' ? minBound : Math.min(Math.max(floor, minBound), maxBound);
  const hi = ceil === '' ? maxBound : Math.min(Math.max(ceil, minBound), maxBound);
  const safeLo = Math.min(lo, hi);
  const safeHi = Math.max(lo, hi);

  const fillStyle = useMemo(() => {
    const left = pct(safeLo, minBound, maxBound);
    const right = pct(safeHi, minBound, maxBound);
    return {
      left: `${left}%`,
      width: `${Math.max(0, right - left)}%`,
    };
  }, [safeLo, safeHi, minBound, maxBound]);

  return (
    <div className={styles.wrap} role="group" aria-label="Price range in dollars">
      <div className={styles.labels}>
        <span>Min ${safeLo.toLocaleString()}</span>
        <span>Max ${safeHi.toLocaleString()}</span>
      </div>
      <div
        ref={sliderRef}
        className={styles.slider}
        onPointerDownCapture={(e) => {
          if (disabled) return;
          const el = sliderRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const thumb = nearestThumb(e.clientX, rect, safeLo, safeHi, minBound, maxBound);
          flushSync(() => setFocusThumb(thumb));
        }}
      >
        <div className={styles.trackLine} aria-hidden />
        <div className={styles.trackFill} style={fillStyle} aria-hidden />
        <div className={styles.thumbsLayer}>
          <label
            className={styles.thumbLbl}
            style={{ zIndex: focusThumb === 'min' ? 5 : 3 }}
            onPointerDown={() => setFocusThumb('min')}
          >
            <span className={styles.srOnly}>Minimum price</span>
            <input
              type="range"
              min={minBound}
              max={maxBound}
              step={50}
              disabled={disabled}
              value={safeLo}
              onChange={(e) => {
                const v = Number(e.target.value);
                onFloor(v);
                if (safeHi < v) onCeil(v);
              }}
              className={styles.range}
            />
          </label>
          <label
            className={styles.thumbLbl}
            style={{ zIndex: focusThumb === 'max' ? 5 : 3 }}
            onPointerDown={() => setFocusThumb('max')}
          >
            <span className={styles.srOnly}>Maximum price</span>
            <input
              type="range"
              min={minBound}
              max={maxBound}
              step={50}
              disabled={disabled}
              value={safeHi}
              onChange={(e) => {
                const v = Number(e.target.value);
                onCeil(v);
                if (safeLo > v) onFloor(v);
              }}
              className={styles.range}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
