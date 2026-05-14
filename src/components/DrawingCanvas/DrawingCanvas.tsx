import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../store';
import type { CanvasLayerView } from '../../types';
import styles from './DrawingCanvas.module.css';

function isLayerVisible(view: CanvasLayerView, layer: string): boolean {
  return view === 'all' || view === layer;
}

const CTX_MENU_GROUPS = [
  {
    label: 'Fixtures',
    items: [
      { label: 'Wall Return', id: 'wall-return' },
      { label: 'Main Drain', id: 'main-drain' },
      { label: 'Light', id: 'light' },
      { label: 'Skimmer', id: 'skimmer' },
      { label: 'Water Level Controller', id: 'wlc' },
    ],
  },
  {
    label: 'Architecture',
    items: [
      { label: 'Step', id: 'step' },
      { label: 'Bench', id: 'bench' },
      { label: 'Sun Shelf', id: 'sun-shelf' },
    ],
  },
  {
    label: 'Water Features',
    items: [
      { label: 'Bubbler', id: 'bubbler' },
      { label: 'Deck Jet', id: 'deck-jet' },
    ],
  },
];

export function DrawingCanvas() {
  const { state, dispatch } = useApp();
  const { gridEnabled, showDimensions, activeTool, canvasLayerView, authoringMode } = state;
  const svgRef = useRef<SVGSVGElement>(null);
  const planMsgTimerRef = useRef<number | null>(null);
  const show = (layer: string) => isLayerVisible(canvasLayerView, layer);
  const underlay = state.data.pdfUnderlay;
  const showUnderlay =
    authoringMode === 'geometry' && activeTool === 'estimating' && underlay !== null;

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [planDropMessage, setPlanDropMessage] = useState<string | null>(null);

  const flashPlanMessage = useCallback((msg: string) => {
    setPlanDropMessage(msg);
    if (planMsgTimerRef.current != null) window.clearTimeout(planMsgTimerRef.current);
    planMsgTimerRef.current = window.setTimeout(() => {
      setPlanDropMessage(null);
      planMsgTimerRef.current = null;
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (planMsgTimerRef.current != null) window.clearTimeout(planMsgTimerRef.current);
    };
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDismiss = useCallback(() => {
    setCtxMenu(null);
  }, []);

  const loadImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        flashPlanMessage('PNG, JPG, or WebP only in v1.');
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => flashPlanMessage('Could not read that file.');
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) {
          flashPlanMessage('Could not read that file.');
          return;
        }
        setPlanDropMessage(null);
        if (planMsgTimerRef.current != null) {
          window.clearTimeout(planMsgTimerRef.current);
          planMsgTimerRef.current = null;
        }
        dispatch({
          type: 'UPDATE_DATA',
          payload: {
            pdfUnderlay: {
              dataUrl,
              widthIn: 44,
              heightIn: 34,
              opacity: 0.38,
            },
            estimatingMode: true,
          },
        });
      };
      reader.readAsDataURL(file);
    },
    [dispatch, flashPlanMessage],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (authoringMode !== 'geometry') return;
      const f = e.dataTransfer.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) {
        flashPlanMessage('PNG, JPG, or WebP only in v1.');
        return;
      }
      dispatch({ type: 'SET_ACTIVE_TOOL', tool: 'estimating' });
      loadImageFile(f);
    },
    [authoringMode, dispatch, flashPlanMessage, loadImageFile],
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (authoringMode === 'geometry') e.preventDefault();
    },
    [authoringMode],
  );

  useEffect(() => {
    if (!ctxMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(`.${styles.ctxMenu}`)) setCtxMenu(null);
    };
    const onCtx = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(`.${styles.ctxMenu}`)) setCtxMenu(null);
    };
    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('contextmenu', onCtx, true);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('contextmenu', onCtx, true);
    };
  }, [ctxMenu]);

  const poolPath = `
    M400,200
    L1000,200
    Q1040,200 1040,240
    L1040,600
    Q1040,640 1000,640
    L700,640
    Q680,640 680,620
    L680,520
    Q680,500 660,500
    L500,500
    Q480,500 480,520
    L480,640
    Q480,660 460,660
    L400,660
    Q360,660 360,640
    L360,240
    Q360,200 400,200 Z`;

  const deckPath = `
    M280,120
    L1120,120
    Q1140,120 1140,140
    L1140,740
    Q1140,760 1120,760
    L280,760
    Q260,760 260,740
    L260,140
    Q260,120 280,120 Z`;

  const spaPath = `
    M680,520
    L680,640
    Q680,660 660,660
    L500,660
    Q480,660 480,640
    L480,520
    Q480,500 500,500
    L660,500
    Q680,500 680,520 Z`;

  const equipPadPath = `
    M140,300
    L260,300
    L260,560
    L140,560
    L140,300 Z`;

  const estimatingDimmed = activeTool === 'estimating';

  return (
    <div
      className={styles.container}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {planDropMessage && (
        <div className={styles.planDropMessage} role="status">
          {planDropMessage}
        </div>
      )}
      {authoringMode === 'geometry' && activeTool === 'estimating' && (
        <div className={styles.estimatingBar}>
          <span className={styles.estimatingHint}>
            Drop a PNG/JPG to trace. Pool outline stays the demo path in v1.
          </span>
          <label className={styles.estimatingFile}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={styles.estimatingFileInput}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadImageFile(f);
                e.target.value = '';
              }}
            />
            Load image
          </label>
          {underlay && (
            <button
              type="button"
              className={styles.estimatingClear}
              onClick={() => {
                setPlanDropMessage(null);
                if (planMsgTimerRef.current != null) {
                  window.clearTimeout(planMsgTimerRef.current);
                  planMsgTimerRef.current = null;
                }
                dispatch({ type: 'UPDATE_DATA', payload: { pdfUnderlay: null, estimatingMode: false } });
              }}
            >
              Clear underlay
            </button>
          )}
        </div>
      )}
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox="0 0 1440 900"
        onContextMenu={handleContextMenu}
      >
        {showUnderlay && underlay && (
          <image
            href={underlay.dataUrl}
            x={0}
            y={0}
            width={1440}
            height={900}
            opacity={underlay.opacity}
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: 'none' }}
          />
        )}
        {gridEnabled && (
          <g opacity={0.06}>
            {Array.from({ length: 37 }).map((_, i) => (
              <line key={`gv${i}`} x1={i * 40} y1={0} x2={i * 40} y2={900} stroke="currentColor" strokeWidth={0.5} />
            ))}
            {Array.from({ length: 23 }).map((_, i) => (
              <line key={`gh${i}`} x1={0} y1={i * 40} x2={1440} y2={i * 40} stroke="currentColor" strokeWidth={0.5} />
            ))}
          </g>
        )}

        {show('geometry') && (
          <g style={{ opacity: estimatingDimmed ? 0.92 : 1 }}>
            <path d={deckPath} className={styles.deckShape} />
            <path d={poolPath} className={styles.poolShape} />
            <path d={spaPath} className={styles.poolShape} style={{ opacity: 0.7 }} />

            {showDimensions && (
              <g>
                <text x={700} y={185} textAnchor="middle" className={styles.dimLabel}>50&apos;-0&quot;</text>
                <text x={345} y={430} textAnchor="middle" className={styles.dimLabel} transform="rotate(-90,345,430)">30&apos;-0&quot;</text>
                <text x={580} y={590} textAnchor="middle" className={styles.dimLabelSpa}>Spa 12&apos; × 10&apos;</text>
                <text x={700} y={420} textAnchor="middle" className={styles.depthLabel}>5&apos;-0&quot; avg</text>
                <text x={580} y={555} textAnchor="middle" className={styles.depthLabel}>3&apos;-6&quot;</text>
                <text x={700} y={260} textAnchor="middle" className={styles.dimLabelSmall}>Shallow 3&apos;-6&quot;</text>
                <text x={700} y={620} textAnchor="middle" className={styles.dimLabelSmall}>Deep 6&apos;-0&quot;</text>
              </g>
            )}

            {[
              [400, 200], [1000, 200], [1040, 240], [1040, 600],
              [1040, 640], [1000, 640], [700, 640], [680, 620],
              [680, 520], [660, 500], [500, 500], [480, 520],
              [480, 640], [460, 660], [400, 660], [360, 640],
              [360, 240], [360, 200],
            ].map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={activeTool === 'select' || activeTool === 'estimating' ? 5 : 3}
                fill="var(--accent)"
                stroke="var(--bg-base)"
                strokeWidth={1.5}
                className={styles.controlPoint}
              />
            ))}
          </g>
        )}

        {show('fixtures') && (
          <g style={{ pointerEvents: estimatingDimmed ? 'none' : undefined, opacity: estimatingDimmed ? 0.25 : 1 }}>
            {[[420, 200], [600, 200], [800, 200], [950, 200]].map(([cx, cy], i) => (
              <g key={`wr${i}`}>
                <circle cx={cx} cy={cy} r={6} fill="rgba(78, 201, 176, 0.35)" stroke="#4ec9b0" strokeWidth={1} />
                {showDimensions && <text x={cx} y={cy - 12} textAnchor="middle" className={styles.labelTiny}>WR</text>}
              </g>
            ))}
            {[[560, 640], [840, 640]].map(([cx, cy], i) => (
              <g key={`sk${i}`}>
                <rect x={cx - 10} y={cy - 5} width={20} height={10} rx={2} fill="rgba(129, 199, 132, 0.3)" stroke="#81c784" strokeWidth={1} />
                {showDimensions && <text x={cx} y={cy - 12} textAnchor="middle" className={styles.labelTiny}>SK</text>}
              </g>
            ))}
            {[[650, 580], [750, 580]].map(([cx, cy], i) => (
              <g key={`md${i}`}>
                <rect x={cx - 8} y={cy - 8} width={16} height={16} rx={2} fill="rgba(165, 214, 167, 0.3)" stroke="#a5d6a7" strokeWidth={1} />
                {showDimensions && <text x={cx} y={cy - 14} textAnchor="middle" className={styles.labelTiny}>MD</text>}
              </g>
            ))}
            {[[1040, 350], [1040, 500], [360, 420]].map(([cx, cy], i) => (
              <g key={`lt${i}`}>
                <circle cx={cx} cy={cy} r={5} fill="rgba(220, 220, 170, 0.4)" stroke="#dcdcaa" strokeWidth={1} />
                {showDimensions && <text x={cx + (cx > 700 ? 14 : -14)} y={cy + 4} textAnchor={cx > 700 ? 'start' : 'end'} className={styles.labelTiny}>LT</text>}
              </g>
            ))}
          </g>
        )}

        {show('plumbing') && (
          <g style={{ opacity: estimatingDimmed ? 0.2 : 1 }}>
            <line x1={360} y1={420} x2={200} y2={420} stroke="#c586c0" strokeWidth={1} strokeDasharray="3,2" opacity={0.5} />
            <line x1={200} y1={420} x2={200} y2={340} stroke="#c586c0" strokeWidth={1} strokeDasharray="3,2" opacity={0.5} />
            {showDimensions && <text x={280} y={412} className={styles.labelSmall}>2&quot; suction</text>}

            <line x1={360} y1={300} x2={200} y2={300} stroke="#b39ddb" strokeWidth={1} strokeDasharray="3,2" opacity={0.4} />
            {showDimensions && <text x={280} y={292} className={styles.labelSmall}>2&quot; return</text>}
          </g>
        )}

        {show('geometry') && (
          <g style={{ opacity: estimatingDimmed ? 0.85 : 1 }}>
            <path d={equipPadPath} className={styles.equipShape} />
            {showDimensions && (
              <text x={200} y={288} textAnchor="middle" className={styles.equipPadLabel}>EQUIP PAD</text>
            )}
            <rect x={155} y={320} width={36} height={36} rx={4} className={styles.equipPump} />
            <text x={173} y={342} textAnchor="middle" className={styles.equipLabel}>P</text>
            <rect x={155} y={375} width={36} height={36} rx={18} className={styles.equipFilter} />
            <text x={173} y={397} textAnchor="middle" className={styles.equipLabel}>F</text>
            <rect x={155} y={430} width={36} height={44} rx={4} className={styles.equipHeater} />
            <text x={173} y={456} textAnchor="middle" className={styles.equipLabel}>H</text>
            <rect x={155} y={492} width={36} height={30} rx={4} className={styles.equipChlor} />
            <text x={173} y={511} textAnchor="middle" className={styles.equipLabel}>CL</text>

            {showDimensions && (
              <g>
                <text x={210} y={342} className={styles.labelSmall}>Pump</text>
                <text x={210} y={397} className={styles.labelSmall}>Filter</text>
                <text x={210} y={456} className={styles.labelSmall}>Heater</text>
                <text x={210} y={511} className={styles.labelSmall}>Salt Cell</text>
              </g>
            )}
          </g>
        )}
      </svg>

      {ctxMenu && (
        <div
          className={styles.ctxMenu}
          style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y }}
        >
          <div className={styles.ctxHeader}>Add to plan</div>
          <div className={styles.ctxHint}>Click an item to place it on the drawing</div>
          {CTX_MENU_GROUPS.map((group) => (
            <div key={group.label} className={styles.ctxGroup}>
              <div className={styles.ctxGroupLabel}>{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={styles.ctxItem}
                  onClick={handleDismiss}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
