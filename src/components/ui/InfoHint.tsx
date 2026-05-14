import { Info } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ui.module.css';

interface InfoHintProps {
  text: string;
  /** Short name for aria-label, e.g. option label or "Class A / B / C". */
  contextLabel: string;
  disabled?: boolean;
}

interface FlyoutPos {
  top: number;
  left: number;
}

const FLYOUT_WIDTH = 300;
const FLYOUT_GAP = 8;
const VIEWPORT_PAD = 8;
/** Used only for viewport flip/clamp before we know real scroll height. */
const FLYOUT_EST_H = 200;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Prefer opening just below / beside the trigger; on hover use pointer so it sits near the cursor. */
function computePos(
  btn: HTMLButtonElement,
  pointer: { x: number; y: number } | null,
): FlyoutPos {
  const r = btn.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left: number;
  let top: number;

  if (pointer) {
    const gap = 10;
    left = pointer.x + gap;
    top = pointer.y + gap;
    if (left + FLYOUT_WIDTH > vw - VIEWPORT_PAD) {
      left = pointer.x - FLYOUT_WIDTH - gap;
    }
    left = clamp(left, VIEWPORT_PAD, vw - FLYOUT_WIDTH - VIEWPORT_PAD);
    if (top + FLYOUT_EST_H > vh - VIEWPORT_PAD) {
      top = pointer.y - FLYOUT_EST_H - gap;
    }
    top = clamp(top, VIEWPORT_PAD, vh - FLYOUT_EST_H - VIEWPORT_PAD);
    return { top, left };
  }

  left = r.left;
  top = r.bottom + FLYOUT_GAP;
  left = clamp(left, VIEWPORT_PAD, vw - FLYOUT_WIDTH - VIEWPORT_PAD);
  if (top + FLYOUT_EST_H > vh - VIEWPORT_PAD) {
    top = r.top - FLYOUT_EST_H - FLYOUT_GAP;
  }
  top = clamp(top, VIEWPORT_PAD, vh - FLYOUT_EST_H - VIEWPORT_PAD);
  return { top, left };
}

/** Hover / keyboard-focus / click tooltip; renders via portal so it escapes any overflow ancestor. */
export function InfoHint({ text, contextLabel, disabled }: InfoHintProps) {
  const tipId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<FlyoutPos>({ top: 0, left: 0 });

  const show = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>) => {
      if (!btnRef.current || disabled) return;
      const ptr =
        e && 'clientX' in e && typeof e.clientX === 'number'
          ? { x: e.clientX, y: e.clientY }
          : null;
      setPos(computePos(btnRef.current, ptr));
      setVisible(true);
    },
    [disabled],
  );

  const hide = useCallback(() => setVisible(false), []);

  const toggle = useCallback(() => {
    if (visible) hide();
    else show();
  }, [visible, show, hide]);

  // Recompute on scroll / resize while visible
  useEffect(() => {
    if (!visible) return;
    const update = () => {
      if (btnRef.current) setPos(computePos(btnRef.current, null));
    };
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, [visible]);

  // Hide on outside click
  useEffect(() => {
    if (!visible) return;
    const onDown = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [visible, hide]);

  const flyout = visible && !disabled
    ? createPortal(
        <span
          id={tipId}
          role="tooltip"
          className={styles.infoHintFlyout}
          style={{ top: pos.top, left: pos.left }}
        >
          {text}
        </span>,
        document.body,
      )
    : null;

  return (
    <span className={styles.infoHintWrap}>
      <button
        ref={btnRef}
        type="button"
        className={styles.infoHintBtnGhost}
        aria-label={`More about ${contextLabel}`}
        aria-describedby={tipId}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        onMouseEnter={show}
        onMouseMove={(e) => {
          if (visible && btnRef.current) {
            setPos(computePos(btnRef.current, { x: e.clientX, y: e.clientY }));
          }
        }}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info size={15} strokeWidth={2} aria-hidden />
      </button>
      {flyout}
    </span>
  );
}
