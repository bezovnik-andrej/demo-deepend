import { useMemo } from 'react';
import { CheckCircle2, Flame, Thermometer } from 'lucide-react';
import { useApp } from '../../store';
import { MultiSelect } from '../ui/MultiSelect';
import { OptionButton } from '../ui/OptionButton';
import { BrandSelect } from '../ui/BrandSelect';
import { InfoHint } from '../ui/InfoHint';
import { getOptionCost } from '../../data/configCosts';
import { getBrandsForCategory } from '../../data/brands';
import {
  calculateHeaterSizing,
  compareHeaterSizes,
  type HeaterSizingInputs,
} from '../../data/heaterSizing';
import { calculateVolumeTotals } from '../../data/poolSections';
import { ConfigStep } from '../../types';
import formStyles from './forms.module.css';
import styles from './HeatingForm.module.css';

const SYSTEM_OPTIONS = [
  { value: 'Gas Heater', label: 'Gas Heater' },
  { value: 'Heat Pump', label: 'Heat Pump' },
  { value: 'Solar', label: 'Solar' },
  { value: 'Electric', label: 'Electric' },
  { value: 'None', label: 'None / Unheated' },
].map((o) => ({ ...o, cost: getOptionCost('heatingSystem', o.value)?.cost }));

const HEATING_BRANDS = getBrandsForCategory('heating');

function fmtBtu(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

function NumField({
  label,
  value,
  unit,
  infoHint,
  disabled,
  onChange,
  min = 0,
  step = 1,
}: {
  label: string;
  value: number;
  unit: string;
  infoHint?: string;
  disabled?: boolean;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {infoHint && (
          <InfoHint contextLabel={label} text={infoHint} />
        )}
      </span>
      <div className={styles.numWrap}>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          className={`${styles.input} ${styles.inputNum}`}
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          placeholder="0"
          disabled={disabled}
          aria-label={label}
        />
        <span className={styles.unit}>{unit}</span>
      </div>
    </label>
  );
}

export function HeatingForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;
  const update = (payload: Record<string, unknown>) =>
    dispatch({ type: 'UPDATE_DATA', payload });

  const totals = useMemo(() => calculateVolumeTotals(d.poolSections), [d.poolSections]);

  const sizingInputs: HeaterSizingInputs = useMemo(() => ({
    volumeGallons: totals.totalGallons,
    surfaceAreaSf: totals.totalArea,
    startTempF: d.heaterStartWaterTempF,
    targetTempF: d.heaterTargetWaterTempF,
    ambientTempF: d.heaterAmbientTempF,
    windMph: d.heaterWindMph,
    heatUpDays: d.heaterHeatUpDays,
    efficiencyPct: d.heaterEfficiencyPct,
    environment: d.poolEnvironment,
  }), [totals, d.heaterStartWaterTempF, d.heaterTargetWaterTempF, d.heaterAmbientTempF,
       d.heaterWindMph, d.heaterHeatUpDays, d.heaterEfficiencyPct, d.poolEnvironment]);

  const sizing = useMemo(() => calculateHeaterSizing(sizingInputs), [sizingInputs]);
  const comparisons = useMemo(() => compareHeaterSizes(sizingInputs), [sizingInputs]);

  const isComplete = d.heatingSystem.length > 0 && d.heaterTargetWaterTempF > 0;

  return (
    <div className={formStyles.form}>
      <div className={styles.titleRow}>
        <h2 className={formStyles.formTitle}>Heating &amp; Heater Sizing</h2>
        <InfoHint
          contextLabel="Heating and Heater Sizing"
          text="Confirm the job inputs first, then review the required output and pick a heater size from the comparison table."
        />
        {isComplete && (
          <span className={styles.completeBadge}>
            <CheckCircle2 size={13} aria-hidden="true" />
            Complete
          </span>
        )}
      </div>

      {/* ── Heating System ── */}
      <div className={styles.sectionLabel}>Heating System — Preferred Brand</div>
      <BrandSelect
        label=""
        brands={HEATING_BRANDS}
        value={d.brandPreferences.heating}
        onChange={(v) => update({ brandPreferences: { ...d.brandPreferences, heating: v } })}
        disabled={disabled}
      />
      <MultiSelect
        label="System Type"
        options={SYSTEM_OPTIONS}
        value={d.heatingSystem}
        onChange={(v) => update({ heatingSystem: v })}
        disabled={disabled}
      />

      {/* ── Pool environment (read-only; edit under Project Information) ── */}
      <div className={styles.sectionLabel}>
        Pool environment
        <InfoHint
          contextLabel="Pool environment"
          text="Pulled from Project Information. Indoor pools use higher surface-loss assumptions in the sizing math."
        />
      </div>
      <div className={styles.envRow}>
        <span className={styles.envChip}>
          {d.poolEnvironment === 'indoor' ? 'Indoor pool' : 'Outdoor pool'}
        </span>
        <button
          type="button"
          className={styles.envEditLink}
          disabled={disabled}
          onClick={() => dispatch({ type: 'NAVIGATE_TO_STEP', step: ConfigStep.ProjectType })}
        >
          Edit in Project Info
        </button>
      </div>

      {/* ── Design Weather Scenario ── */}
      <div className={styles.sectionLabel}>
        Design Weather Scenario
        <InfoHint
          contextLabel="Design weather scenario"
          text="Coldest month is worst-case heater sizing; shoulder season is a milder design point for comparing first cost vs. operating margin."
        />
      </div>
      <OptionButton
        options={[
          { value: 'coldest-month', label: 'Coldest Month' },
          { value: 'shoulder-season', label: 'Shoulder Season' },
        ]}
        value={d.heaterScenario}
        onChange={(v) => update({ heaterScenario: v })}
        disabled={disabled}
      />

      {/* ── Climate Assumptions ── */}
      <div className={styles.sectionLabel}>
        Climate Assumptions
        <InfoHint
          contextLabel="Climate assumptions"
          text="Defaults lean on project location when we have it. Confirm against local weather data for permit packages."
        />
      </div>
      <div className={styles.fieldGrid}>
        <NumField label="Ambient air temp" value={d.heaterAmbientTempF} unit="°F" disabled={disabled}
          onChange={(v) => update({ heaterAmbientTempF: v })} />
        <NumField label="Wind speed" value={d.heaterWindMph} unit="mph" disabled={disabled}
          onChange={(v) => update({ heaterWindMph: v })} />
        <NumField
          label="Fill / groundwater temp"
          value={d.heaterFillWaterTempF}
          unit="°F"
          infoHint="When geocoding fills this in, treat it as a starting point—not a survey."
          disabled={disabled}
          onChange={(v) => update({ heaterFillWaterTempF: v })}
        />
      </div>

      {/* ── Heat-Up Target ── */}
      <div className={styles.sectionLabel}>Heat-Up Target</div>
      <div className={styles.fieldGrid}>
        <NumField label="Target water temp" value={d.heaterTargetWaterTempF} unit="°F"
          disabled={disabled} onChange={(v) => update({ heaterTargetWaterTempF: v })} />
        <NumField label="Starting water temp" value={d.heaterStartWaterTempF} unit="°F"
          disabled={disabled} onChange={(v) => update({ heaterStartWaterTempF: v })} />
        <NumField
          label="Heat-up time"
          value={d.heaterHeatUpDays}
          unit="days"
          infoHint="Residential pools are often sized around ~2 days to reach setpoint from a cold start."
          step={0.5}
          disabled={disabled}
          onChange={(v) => update({ heaterHeatUpDays: v })}
        />
        <NumField
          label="Heater efficiency"
          value={d.heaterEfficiencyPct}
          unit="%"
          infoHint="Rough gas-fired default ≈84% AFUE-class; heat pumps use COP elsewhere in the tool."
          disabled={disabled}
          onChange={(v) => update({ heaterEfficiencyPct: v })}
        />
      </div>

      {/* ── Sizing Summary ── */}
      <div className={styles.sectionLabel}>
        <Flame size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} />{' '}
        Required Output
        <InfoHint
          contextLabel="Required output"
          text="Required heater output is whichever is greater — heat-up load or surface loss. The two loads are NOT added together."
        />
      </div>
      {(() => {
        const heatUpGoverns = sizing.grossBtuHr >= sizing.surfaceLossBtuHr;
        return (
          <div className={styles.requiredOutputStrip}>
            <div className={`${styles.summaryCard} ${heatUpGoverns ? styles.routGoverning : styles.routLoser}`}>
              <div className={styles.summaryLabel}>
                Heat-up load
                {heatUpGoverns && <span className={styles.routTag}>Governing</span>}
              </div>
              <div className={styles.summaryValue}>{fmtBtu(sizing.grossBtuHr)} BTU/hr</div>
            </div>
            <div className={`${styles.summaryCard} ${!heatUpGoverns ? styles.routGoverning : styles.routLoser}`}>
              <div className={styles.summaryLabel}>
                Surface loss
                {!heatUpGoverns && <span className={styles.routTag}>Governing</span>}
              </div>
              <div className={styles.summaryValue}>{fmtBtu(sizing.surfaceLossBtuHr)} BTU/hr</div>
            </div>
          </div>
        );
      })()}

      {/* ── Heater Size Comparison ── */}
      <div className={styles.sectionLabel}>
        <Thermometer size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} />{' '}
        Heater Size Comparison
        <InfoHint
          contextLabel="Heater size comparison"
          text="Pick one nominal size row for BOM and summaries. Heat-up days and verdict compare each row to your heat-up target; cost column is a coarse operating band."
        />
      </div>
      <div className={styles.compTable} role="table" aria-label="Heater size comparison">
        <div className={styles.compHead} role="row">
          <div
            role="columnheader"
            className={styles.compHeadRadio}
            aria-label="Selection"
          />
          <div role="columnheader">Heater</div>
          <div role="columnheader">Heat-Up</div>
          <div role="columnheader">Verdict</div>
          <div role="columnheader" className={styles.compHeadCost}>
            Cost
          </div>
        </div>
        {comparisons.map((c) => {
          const isSelected = d.selectedHeaterBtu === c.sizeBtu;
          return (
            <button
              key={c.sizeBtu}
              type="button"
              role="row"
              className={`${styles.compRow} ${c.meetsTarget ? styles.compRowPass : styles.compRowFail} ${isSelected ? styles.compRowSelected : ''}`}
              onClick={() => update({ selectedHeaterBtu: c.sizeBtu })}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`${c.label}, ${c.relativeCost} relative cost${isSelected ? ', selected' : ''}`}
            >
              <div className={styles.compSelectCell} role="cell">
                <span className={styles.compRadio} aria-hidden="true">
                  {isSelected && <span className={styles.compRadioInner} />}
                </span>
              </div>
              <div className={styles.compCell} role="cell">{c.label}</div>
              <div className={styles.compCell} role="cell">
                {Number.isFinite(c.heatUpDays) ? `${c.heatUpDays} days` : '—'}
              </div>
              <div className={`${styles.compCell} ${c.meetsTarget ? styles.verdictPass : styles.verdictFail}`} role="cell">
                {c.verdict}
              </div>
              <div className={`${styles.compCell} ${styles.compCost}`} role="cell">{c.relativeCost}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
