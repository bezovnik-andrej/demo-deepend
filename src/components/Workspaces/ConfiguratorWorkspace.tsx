import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, AlertTriangle, ChevronDown, ChevronRight, Info, Pencil } from 'lucide-react';
import { useApp } from '../../store';
import { ConfigStep } from '../../types';
import type { ConfigStep as ConfigStepType } from '../../types';
import { TURNOVER_STANDARDS, getTurnoverHoursForPoolType } from '../../data/engineering';
import {
  DEFAULT_DESIGN_RETURN_FPS,
  DEFAULT_DESIGN_SUCTION_FPS,
  estimateTotalDynamicHeadFt,
  requiredInnerDiameterInches,
  pickNominalPipe,
  velocityFromGpmAndIdIn,
} from '../../data/hydraulicsHead';
import { calculateVolumeTotals } from '../../data/poolSections';
import { planInlets } from '../../data/inletPlanning';
import {
  calculateHeaterSizing,
  compareHeaterSizes,
  type HeaterSizingInputs,
} from '../../data/heaterSizing';
import { getRecirculationLabels } from '../../data/recirculationOptions';
import { EquipmentOptionsPanel } from './EquipmentOptionsPanel';
import styles from './engineering.module.css';

type Status = 'ok' | 'warning' | 'info';
type RowTone = 'default' | 'code' | 'calculated' | 'adjustable' | 'selected';

interface RowProps {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: RowTone;
  isSelected?: boolean;
  onClick?: () => void;
}

interface SectionProps {
  title: string;
  status: Status;
  defaultOpen?: boolean;
  editStep?: ConfigStepType;
  children: React.ReactNode;
}

const DESIGN_SUCTION_FPS = DEFAULT_DESIGN_SUCTION_FPS;
const DESIGN_RETURN_FPS = DEFAULT_DESIGN_RETURN_FPS;
const CODE_MAX_SUCTION_FPS = 6;
const CODE_MAX_RETURN_FPS = 10;

function fmtFps(v: number): string {
  return `${v.toFixed(1)} ft/s`;
}

const ROW_TONE_CLASS: Record<RowTone, string | undefined> = {
  default: undefined,
  code: styles.rowToneCode,
  calculated: styles.rowToneCalculated,
  adjustable: styles.rowToneAdjustable,
  selected: styles.rowToneSelected,
};

function StatusIcon({ status }: { status: Status }) {
  switch (status) {
    case 'ok':
      return <span className={styles.statusOk}><Check size={12} /></span>;
    case 'warning':
      return <span className={styles.statusWarn}><AlertTriangle size={12} /></span>;
    case 'info':
      return <span className={styles.statusInfo}><Info size={12} /></span>;
  }
}

function Section({ title, status, defaultOpen = true, editStep, children }: SectionProps) {
  const { dispatch } = useApp();
  const [open, setOpen] = useState(defaultOpen);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editStep) {
      dispatch({ type: 'NAVIGATE_TO_STEP', step: editStep });
    }
  };

  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <div className={styles.headerLeft}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editStep && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(e as unknown as React.MouseEvent); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'color 0.15s, background 0.15s',
                background: 'transparent',
              }}
              title="Edit this section"
            >
              <Pencil size={12} />
            </span>
          )}
          <StatusIcon status={status} />
        </div>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

function DataRow({ label, value, highlight, tone = 'default', isSelected, onClick }: RowProps) {
  const toneClass = ROW_TONE_CLASS[tone];
  return (
    <div
      className={`${styles.row} ${isSelected ? styles.rowSelected : ''} ${toneClass ?? ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowRight}>
        <span className={highlight ? styles.rowValueHighlight : styles.rowValue}>{value}</span>
        {tone === 'selected' && <Pencil size={10} className={styles.rowEditHint} />}
      </span>
    </div>
  );
}

function FlowAddRow({
  addGpm,
  defaultAddGpm,
  requiredGpm,
  usingDefault,
  disabled,
  onChange,
  onResetDefault,
}: {
  addGpm: number;
  defaultAddGpm: number;
  requiredGpm: number;
  usingDefault: boolean;
  disabled?: boolean;
  onChange: (gpm: number) => void;
  onResetDefault: () => void;
}) {
  return (
    <div className={`${styles.row} ${styles.rowToneAdjustable} ${styles.rowWithFlowControl}`}>
      <span className={styles.rowLabel}>Engineering add (GPM)</span>
      <div className={styles.flowAddRight}>
        <div className={styles.flowAddTop}>
          <input
            type="number"
            min={0}
            step={1}
            className={styles.flowAddInput}
            value={addGpm}
            disabled={disabled}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (Number.isNaN(n)) return;
              onChange(Math.max(0, n));
            }}
          />
          <span className={styles.rowValue}>GPM</span>
        </div>
        <div className={styles.flowAddHint}>
          Default 10% of required ({defaultAddGpm} GPM at {requiredGpm} GPM required)
          {!usingDefault && (
            <>
              {' · '}
              <button type="button" className={styles.flowAddReset} onClick={onResetDefault}>
                Use default
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdjustableRow({
  label,
  value,
  defaultValue,
  unit,
  disabled,
  onChange,
  onReset,
  isOverridden,
}: {
  label: string;
  value: number;
  defaultValue: number;
  unit: string;
  disabled?: boolean;
  onChange: (v: number) => void;
  onReset: () => void;
  isOverridden: boolean;
}) {
  return (
    <div className={`${styles.row} ${styles.rowToneAdjustable} ${styles.rowWithFlowControl}`}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.flowAddRight}>
        <div className={styles.flowAddTop}>
          <input
            type="number"
            min={0}
            step={1}
            className={styles.flowAddInput}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              if (Number.isNaN(n)) return;
              onChange(Math.max(0, n));
            }}
          />
          <span className={styles.rowValue}>{unit}</span>
        </div>
        {isOverridden && (
          <div className={styles.flowAddHint}>
            Default: {defaultValue} {unit}
            {' · '}
            <button type="button" className={styles.flowAddReset} onClick={onReset}>
              Use default
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className={styles.note}>{children}</div>;
}

export function EngineeringWorkspace() {
  const { state, dispatch } = useApp();
  const d = state.data;

  const volumeTotals = calculateVolumeTotals(d.poolSections);
  const volume = volumeTotals.totalGallons;
  const averageDepth = volumeTotals.averageDepth;
  const poolUseType = d.poolUseType || null;
  const activeStandard = TURNOVER_STANDARDS.find((s) => s.types.includes(poolUseType));
  const turnoverHours =
    d.turnoverHoursOverride ?? getTurnoverHoursForPoolType(poolUseType, averageDepth);
  const hasTurnoverOverride = d.turnoverHoursOverride !== null;
  const requiredGpm = Math.round(volume / (turnoverHours * 60));
  const defaultAddGpm = Math.max(0, Math.round(requiredGpm * 0.1));
  const addGpm = state.engineeringFlowAddGpm ?? defaultAddGpm;
  const designGpm = requiredGpm + addGpm;
  const surfaceArea = volumeTotals.totalArea;
  const batherLoadSqFtPerPerson = d.batherLoadSqFtPerPerson ?? 15;
  const usageMultiplier = d.batherLoadUsageMultiplier ?? 0.5;
  const maxBathers = surfaceArea > 0 ? Math.round(surfaceArea / batherLoadSqFtPerPerson) : 0;
  const designBathers = Math.round(maxBathers * usageMultiplier);

  const hasHeating = d.heatingSystem.length > 0;

  const heaterInputs: HeaterSizingInputs = useMemo(() => ({
    volumeGallons: volume,
    surfaceAreaSf: surfaceArea,
    startTempF: d.heaterStartWaterTempF,
    targetTempF: d.heaterTargetWaterTempF,
    ambientTempF: d.heaterAmbientTempF,
    windMph: d.heaterWindMph,
    heatUpDays: d.heaterHeatUpDays,
    efficiencyPct: d.heaterEfficiencyPct,
    environment: d.poolEnvironment,
  }), [volume, surfaceArea, d.heaterStartWaterTempF, d.heaterTargetWaterTempF,
       d.heaterAmbientTempF, d.heaterWindMph, d.heaterHeatUpDays,
       d.heaterEfficiencyPct, d.poolEnvironment]);

  const heaterSizing = useMemo(() => calculateHeaterSizing(heaterInputs), [heaterInputs]);
  const heaterComparisons = useMemo(() => compareHeaterSizes(heaterInputs), [heaterInputs]);

  const designSuctionFps = d.designSuctionFps ?? DESIGN_SUCTION_FPS;
  const designReturnFps = d.designReturnFps ?? DESIGN_RETURN_FPS;
  const reqSuctionId = requiredInnerDiameterInches(designGpm, designSuctionFps);
  const reqReturnId = requiredInnerDiameterInches(designGpm, designReturnFps);
  const suctionPipe = pickNominalPipe(reqSuctionId);
  const returnPipe = pickNominalPipe(reqReturnId);
  const actualSuctionFps = velocityFromGpmAndIdIn(designGpm, suctionPipe.idIn);
  const actualReturnFps = velocityFromGpmAndIdIn(designGpm, returnPipe.idIn);
  const tdhFt = estimateTotalDynamicHeadFt({
    designGpm,
    suctionIdIn: suctionPipe.idIn,
    returnIdIn: returnPipe.idIn,
    averageDepthFt: averageDepth,
    surfaceAreaSqFt: surfaceArea,
    filtrationType: d.filtrationType,
    hasHeater: d.heatingSystem.length > 0,
  });

  const skimmerCount = 2;
  const mainDrainCount = 2;
  const inletPlan = planInlets(d.poolSections, d.inletStrategy ?? 'auto-shelf', designGpm);
  const wallReturnCount = inletPlan.wallReturns;
  const floorReturnCount = inletPlan.floorReturns;
  const totalSuctionOutlets = skimmerCount + mainDrainCount;
  const totalReturnOutlets = Math.max(1, wallReturnCount + floorReturnCount);
  const gpmPerSkimmer = Math.round((designGpm * 0.5) / skimmerCount);
  const gpmPerMainDrain = Math.round((designGpm * 0.5) / mainDrainCount);

  const engScrollRef = useRef<HTMLDivElement>(null);
  const engScrollKey = useMemo(
    () =>
      `norveo-eng-scroll:${[d.projectName, d.projectAddress, d.projectCity].join('|').slice(0, 220)}`,
    [d.projectName, d.projectAddress, d.projectCity],
  );

  useEffect(() => {
    const el = engScrollRef.current;
    if (!el) return;
    const raw = sessionStorage.getItem(engScrollKey);
    if (raw == null) return;
    const y = Number(raw);
    if (!Number.isFinite(y)) return;
    requestAnimationFrame(() => {
      el.scrollTop = y;
    });
  }, [engScrollKey]);

  useEffect(() => {
    const el = engScrollRef.current;
    if (!el) return;
    let debounce: number;
    const save = () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        sessionStorage.setItem(engScrollKey, String(el.scrollTop));
      }, 200);
    };
    el.addEventListener('scroll', save, { passive: true });
    return () => {
      window.clearTimeout(debounce);
      sessionStorage.setItem(engScrollKey, String(el.scrollTop));
      el.removeEventListener('scroll', save);
    };
  }, [engScrollKey]);

  return (
    <div ref={engScrollRef} className={styles.outer}>
      <div className={styles.legendStrip} aria-label="Row color key">
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchCode}`} />
          Code / fixed reference
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchCalc}`} />
          Calculated
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchAdj}`} />
          Adjustable
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchSel}`} />
          Selected in configurator — click to edit
        </span>
      </div>

      <div className={styles.container}>
        <Section title="Pool Specifications" status="ok" editStep={ConfigStep.PoolUseType}>
          <DataRow label="Dimensions" value="50' × 25'" tone="code" />
          <DataRow
            label="Average Depth"
            value={averageDepth > 0 ? `${averageDepth.toFixed(2)}'` : '—'}
            tone="calculated"
          />
          <DataRow label="Surface Area" value={`${surfaceArea.toLocaleString()} sq ft`} tone="calculated" />
          <DataRow label="Volume" value={`${volume.toLocaleString()} gallons`} tone="calculated" />
          <DataRow
            label="Pool Use Type"
            value={d.poolUseType || 'Not Specified'}
            tone={d.poolUseType ? 'selected' : 'default'}
            isSelected={!!d.poolUseType}
            onClick={() => dispatch({ type: 'NAVIGATE_TO_STEP', step: ConfigStep.PoolUseType })}
          />
          <DataRow
            label="Pool Recirculation"
            value={getRecirculationLabels(d.gutterStyle).join(', ') || 'Not Specified'}
            tone={d.gutterStyle ? 'selected' : 'default'}
            isSelected={!!d.gutterStyle}
            onClick={() => dispatch({ type: 'NAVIGATE_TO_STEP', step: ConfigStep.GutterStyle })}
          />
        </Section>

        <Section title="Bather Load Analysis" status="ok">
          <DataRow label="Surface Area" value={`${surfaceArea.toLocaleString()} sq ft`} tone="calculated" />
          <AdjustableRow
            label="Design Standard (sq ft / bather)"
            value={batherLoadSqFtPerPerson}
            defaultValue={15}
            unit="sq ft"
            disabled={d.isFinalized}
            onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { batherLoadSqFtPerPerson: v } })}
            onReset={() => dispatch({ type: 'UPDATE_DATA', payload: { batherLoadSqFtPerPerson: null } })}
            isOverridden={d.batherLoadSqFtPerPerson !== null}
          />
          <DataRow label="Maximum Bather Load" value={`${maxBathers} bathers`} tone="calculated" />
          <AdjustableRow
            label="Usage Multiplier"
            value={Math.round(usageMultiplier * 100)}
            defaultValue={50}
            unit="%"
            disabled={d.isFinalized}
            onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { batherLoadUsageMultiplier: Math.max(0.01, Math.min(1, v / 100)) } })}
            onReset={() => dispatch({ type: 'UPDATE_DATA', payload: { batherLoadUsageMultiplier: null } })}
            isOverridden={d.batherLoadUsageMultiplier !== null}
          />
          <DataRow label="Design Bather Load" value={`${designBathers} bathers`} highlight tone="calculated" />
          <Note>
            <strong>Note:</strong> Regional codes may vary. Adjust the design standard and usage multiplier to match local requirements (e.g. Georgia vs Texas standards). Values can be pre-filled via project templates.
          </Note>
        </Section>

        <Section title="Turnover & Flow Rate" status={poolUseType ? 'ok' : 'warning'} editStep={ConfigStep.PoolUseType}>
          <DataRow label="Pool Volume" value={`${volume.toLocaleString()} gallons`} tone="calculated" />
          <AdjustableRow
            label="Required Turnover Time"
            value={turnoverHours}
            defaultValue={activeStandard ? activeStandard.hours : 6}
            unit="hours"
            disabled={d.isFinalized}
            onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { turnoverHoursOverride: v } })}
            onReset={() => dispatch({ type: 'UPDATE_DATA', payload: { turnoverHoursOverride: null } })}
            isOverridden={hasTurnoverOverride}
          />
          <DataRow label="Required GPM" value={`${requiredGpm} GPM`} tone="calculated" />
          <FlowAddRow
            addGpm={addGpm}
            defaultAddGpm={defaultAddGpm}
            requiredGpm={requiredGpm}
            usingDefault={state.engineeringFlowAddGpm === null}
            disabled={d.isFinalized}
            onChange={(gpm) => dispatch({ type: 'SET_ENGINEERING_FLOW_ADD_GPM', gpm })}
            onResetDefault={() => dispatch({ type: 'SET_ENGINEERING_FLOW_ADD_GPM', gpm: null })}
          />
          <DataRow label="Design GPM" value={`${designGpm} GPM`} highlight tone="calculated" />
          <div className={styles.subBlock}>
            <div className={styles.subTitle}>Turnover Standards:</div>
            {TURNOVER_STANDARDS.map((std) => {
              const isActive = activeStandard === std;
              return (
                <div
                  key={std.label}
                  className={`${styles.subItem} ${isActive ? styles.subItemActive : ''}`}
                >
                  {isActive && <Check size={10} className={styles.subItemCheck} />}
                  {std.label}: {std.hours} hours
                </div>
              );
            })}
            {!activeStandard && (
              <div className={styles.subItemWarn}>
                <AlertTriangle size={10} /> Pool use type not specified — defaulting to Commercial (6h)
              </div>
            )}
          </div>
        </Section>

        <Section title="Heater Sizing" status={hasHeating ? 'ok' : 'warning'} editStep={ConfigStep.Heating}>
          <div className={styles.eqGroup}>
            <div className={styles.eqGroupLabel}>Assumptions</div>
            <DataRow label="Environment" value={d.poolEnvironment === 'indoor' ? 'Indoor' : 'Outdoor'} tone="selected"
              onClick={() => dispatch({ type: 'NAVIGATE_TO_STEP', step: ConfigStep.ProjectType })} isSelected />
            <DataRow label="Scenario" value={d.heaterScenario === 'coldest-month' ? 'Coldest Month' : 'Shoulder Season'} tone="selected"
              onClick={() => dispatch({ type: 'NAVIGATE_TO_STEP', step: ConfigStep.Heating })} isSelected />
            <DataRow label="Target Water Temp" value={`${d.heaterTargetWaterTempF}°F`} tone="adjustable" />
            <DataRow label="Starting Water Temp" value={`${d.heaterStartWaterTempF}°F`} tone="adjustable" />
            <DataRow label="Ambient Air Temp" value={`${d.heaterAmbientTempF}°F`} tone="adjustable" />
            <DataRow label="Wind Speed" value={`${d.heaterWindMph} mph`} tone="adjustable" />
            <DataRow label="Heat-Up Target" value={`${d.heaterHeatUpDays} days`} tone="adjustable" />
            <DataRow label="Heater Efficiency" value={`${d.heaterEfficiencyPct}%`} tone="adjustable" />
          </div>
          <div className={styles.eqDivider} />
          <div className={styles.eqGroup}>
            <div className={styles.eqGroupLabel}>Calculated</div>
            <DataRow label="Pool Volume" value={`${volume.toLocaleString()} gallons`} tone="calculated" />
            <DataRow
              label={`Heat-Up Load${heaterSizing.grossBtuHr >= heaterSizing.surfaceLossBtuHr ? ' (governing)' : ''}`}
              value={`${Math.round(heaterSizing.grossBtuHr).toLocaleString()} BTU/hr`}
              tone="calculated"
            />
            <DataRow
              label={`Surface Loss${heaterSizing.surfaceLossBtuHr > heaterSizing.grossBtuHr ? ' (governing)' : ''}`}
              value={`${Math.round(heaterSizing.surfaceLossBtuHr).toLocaleString()} BTU/hr`}
              tone="calculated"
            />
            <DataRow label="Required Heater Output" value={`${Math.round(heaterSizing.requiredBtuHr).toLocaleString()} BTU/hr`} highlight tone="calculated" />
          </div>
          <div className={styles.eqDivider} />
          <div className={styles.eqGroup}>
            <div className={styles.eqGroupLabel}>Standard heater comparison</div>
            {heaterComparisons.map((c) => (
              <DataRow
                key={c.sizeBtu}
                label={c.label}
                value={`${Number.isFinite(c.heatUpDays) ? `${c.heatUpDays} days` : '—'} · ${c.verdict}`}
                highlight={c.meetsTarget}
                tone={d.selectedHeaterBtu === c.sizeBtu ? 'selected' : c.meetsTarget ? 'calculated' : 'default'}
                isSelected={d.selectedHeaterBtu === c.sizeBtu}
                onClick={() => dispatch({ type: 'UPDATE_DATA', payload: { selectedHeaterBtu: c.sizeBtu } })}
              />
            ))}
          </div>
          <Note>
            <strong>Heater sizing:</strong> Heat-up load ({d.heaterHeatUpDays}-day target, {d.heaterStartWaterTempF}°F → {d.heaterTargetWaterTempF}°F) and surface loss at {d.heaterAmbientTempF}°F ambient are calculated independently. Required output = <strong>whichever is greater</strong> — the two are <strong>not</strong> added together. The governing value is labeled above.
          </Note>
        </Section>

        <Section title="Pipe Sizing" status="ok">
          <AdjustableRow
            label="Design velocity (suction)"
            value={designSuctionFps}
            defaultValue={DESIGN_SUCTION_FPS}
            unit="ft/s"
            disabled={d.isFinalized}
            onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { designSuctionFps: v } })}
            onReset={() => dispatch({ type: 'UPDATE_DATA', payload: { designSuctionFps: null } })}
            isOverridden={d.designSuctionFps !== null}
          />
          <AdjustableRow
            label="Design velocity (return)"
            value={designReturnFps}
            defaultValue={DESIGN_RETURN_FPS}
            unit="ft/s"
            disabled={d.isFinalized}
            onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { designReturnFps: v } })}
            onReset={() => dispatch({ type: 'UPDATE_DATA', payload: { designReturnFps: null } })}
            isOverridden={d.designReturnFps !== null}
          />
          <DataRow label="Code max velocity (suction)" value={`${CODE_MAX_SUCTION_FPS} ft/s`} tone="code" />
          <DataRow label="Code max velocity (return)" value={`${CODE_MAX_RETURN_FPS} ft/s`} tone="code" />
          <DataRow label="Suction line size" value={`${suctionPipe.nominal} (Sch. 40)`} tone="calculated" />
          <DataRow label="Return line size" value={`${returnPipe.nominal} (Sch. 40)`} tone="calculated" />
          <DataRow label="Actual velocity @ GPM (suction)" value={`${fmtFps(actualSuctionFps)} (≤ ${CODE_MAX_SUCTION_FPS} code)`} highlight tone="calculated" />
          <DataRow label="Actual velocity @ GPM (return)" value={`${fmtFps(actualReturnFps)} (≤ ${CODE_MAX_RETURN_FPS} code)`} highlight tone="calculated" />
          <DataRow
            label="Total Dynamic Head (TDH)"
            value={tdhFt > 0 ? `${tdhFt} ft est.` : '—'}
            highlight
            tone="calculated"
          />
          <Note>
            <strong>Pipe sizing:</strong> Nominal diameter is chosen from required ID at the design velocities ({designSuctionFps} / {designReturnFps} ft/s), under code maximums ({CODE_MAX_SUCTION_FPS} / {CODE_MAX_RETURN_FPS} ft/s), using <strong>design GPM</strong> (required + engineering add). Other equipment choices stay in the configurator. <strong>TDH</strong> is an order-of-magnitude estimate (static + friction + filter/heater allowances); validate with vendor curves and as-built lengths.
          </Note>
        </Section>

        <Section title="Hydraulic Summary" status="info">
          <DataRow label="Main drains" value={`${mainDrainCount} × anti-vortex`} />
          <DataRow label="Skimmers" value={`${skimmerCount}`} />
          <DataRow label="Total suction outlets" value={`${totalSuctionOutlets}`} tone="calculated" />
          <DataRow label="Wall returns" value={`${wallReturnCount}`} />
          <DataRow label="Floor returns" value={`${floorReturnCount}`} />
          <DataRow label="Spa / therapy returns" value="0" />
          <DataRow label="Total return outlets" value={`${totalReturnOutlets}`} tone="calculated" />
          <DataRow label="GPM per return (avg.)" value={`~${Math.round(designGpm / totalReturnOutlets)} GPM`} tone="calculated" />
          <DataRow label="GPM per skimmer (est.)" value={`~${gpmPerSkimmer} GPM`} tone="calculated" />
          <DataRow label="GPM per main drain (est.)" value={`~${gpmPerMainDrain} GPM`} tone="calculated" />
          <DataRow label="Water feature flow" value="—" />
        </Section>
        <EquipmentOptionsPanel
          designGpm={designGpm}
          requiredBtuHr={heaterSizing.requiredBtuHr}
        />
      </div>
    </div>
  );
}
