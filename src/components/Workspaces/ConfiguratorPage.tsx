import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Check,
  AlertCircle,
  ExternalLink,
  Building2,
  User,
  MapPin,
  Link,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { useApp } from '../../store';
import { CONFIGURATOR_STEP_GROUPS, STEP_DEFINITIONS, ConfigStep, type StepGroup } from '../../types';
import { WIZARD_STEP_FORMS } from '../StepEditor/StepEditor';
import { isStepPrefilledFromTemplate } from '../../utils/stepPrefill';
import { getTurnoverHoursForPoolType } from '../../data/engineering';
import { estimateTotalDynamicHeadFt, pipesForDesignFlow } from '../../data/hydraulicsHead';
import { calculateVolumeTotals } from '../../data/poolSections';
import { flattenItems } from '../../data/projectItems';
import { inflationHintPctTotal, monthsFromToday } from '../../data/inflationHints';
import styles from './configuratorpage.module.css';

const INFLATION_DRIFT_TITLE =
  'Flat rate, UI only; not applied to line totals.';

const PROJECT_INFO_SEGMENTS: {
  id: 'contacts' | 'site';
  label: string;
  steps: ConfigStep[];
}[] = [
  { id: 'contacts', label: 'Contacts', steps: [ConfigStep.Customer] },
  {
    id: 'site',
    label: 'Project',
    steps: [ConfigStep.ProjectLocation, ConfigStep.ProjectType, ConfigStep.PoolUseType],
  },
];

interface GroupInfo {
  group: StepGroup;
  steps: (typeof STEP_DEFINITIONS)[number][];
  completed: number;
  total: number;
}

function fmtCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const COST_CATEGORY_ORDER = ['Structural', 'Plumbing', 'Fixtures', 'Mechanical', 'Finishes'];

function ConfiguratorSummary() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const [collapsed, setCollapsed] = useState(false);

  const m = useMemo(() => {
    const totals = calculateVolumeTotals(d.poolSections);
    const volume = totals.totalGallons;
    const surfaceArea = totals.totalArea;
    const averageDepth = totals.averageDepth;
    const poolUseType = d.poolUseType || null;
    const turnoverHours =
      poolUseType && volume > 0
        ? d.turnoverHoursOverride ?? getTurnoverHoursForPoolType(poolUseType, averageDepth)
        : d.turnoverHoursOverride ?? 0;
    const requiredGpm =
      volume > 0 && turnoverHours > 0 ? Math.round(volume / (turnoverHours * 60)) : 0;
    const defaultAddGpm = Math.max(0, Math.round(requiredGpm * 0.1));
    const addGpm = state.engineeringFlowAddGpm ?? defaultAddGpm;
    const designGpm = requiredGpm + addGpm;
    const batherLoadSqFtPerPerson = d.batherLoadSqFtPerPerson ?? 15;
    const usageMultiplier = d.batherLoadUsageMultiplier ?? 0.5;
    const maxBathers = surfaceArea > 0 ? Math.round(surfaceArea / batherLoadSqFtPerPerson) : 0;
    const designBathers = Math.round(maxBathers * usageMultiplier);
    const rows = flattenItems(state.projectItems);
    const totalCost = rows.reduce((sum, r) => sum + r.qty * r.price, 0);
    const totalWithMarkup = rows.reduce((sum, r) => sum + r.qty * (r.price + (r.markup ?? 0)), 0);
    const categoryTotals = rows.reduce<Map<string, number>>((map, r) => {
      const subtotal = r.qty * r.price;
      if (subtotal <= 0) return map;
      map.set(r.category, (map.get(r.category) ?? 0) + subtotal);
      return map;
    }, new Map());
    const costByCategory = Array.from(categoryTotals, ([category, subtotal]) => ({ category, subtotal }))
      .sort((a, b) => {
        const aIdx = COST_CATEGORY_ORDER.indexOf(a.category);
        const bIdx = COST_CATEGORY_ORDER.indexOf(b.category);
        if (aIdx === -1 && bIdx === -1) return a.category.localeCompare(b.category);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      });
    const pipes = pipesForDesignFlow(designGpm, d.designSuctionFps, d.designReturnFps);
    const tdhFt = estimateTotalDynamicHeadFt({
      designGpm,
      suctionIdIn: pipes.suction.idIn,
      returnIdIn: pipes.return.idIn,
      averageDepthFt: averageDepth,
      surfaceAreaSqFt: surfaceArea,
      filtrationType: d.filtrationType,
      hasHeater: d.heatingSystem.length > 0,
    });
    return {
      volume,
      surfaceArea,
      turnoverHours,
      requiredGpm,
      addGpm,
      designGpm,
      maxBathers,
      designBathers,
      totalCost,
      totalWithMarkup,
      costByCategory,
      tdhFt,
    };
  }, [
    d.poolSections,
    d.poolUseType,
    d.turnoverHoursOverride,
    d.batherLoadSqFtPerPerson,
    d.batherLoadUsageMultiplier,
    d.filtrationType,
    d.heatingSystem,
    d.designSuctionFps,
    d.designReturnFps,
    state.projectItems,
    state.engineeringFlowAddGpm,
  ]);

  const buildMonthValue = d.expectedBuildDate ? d.expectedBuildDate.slice(0, 7) : '';
  const buildHintPct = inflationHintPctTotal(d.expectedBuildDate);
  const buildMonths = d.expectedBuildDate ? monthsFromToday(d.expectedBuildDate) : 0;

  return (
    <aside
      className={`${styles.summaryPane} ${collapsed ? styles.summaryPaneCollapsed : ''}`}
      aria-label="Project summary"
    >
      {collapsed ? (
        <div className={styles.summaryRail}>
          <button
            type="button"
            className={styles.summaryToggle}
            onClick={() => setCollapsed(false)}
            aria-label="Show project summary"
            aria-expanded={false}
            title="Show project summary"
          >
            <PanelRightOpen size={15} aria-hidden />
          </button>
        </div>
      ) : (
        <div className={styles.summaryInner}>
          <div className={styles.summaryHeader}>
            <h2 className={styles.summaryTitle}>Summary</h2>
            <button
              type="button"
              className={styles.summaryToggle}
              onClick={() => setCollapsed(true)}
              aria-label="Hide project summary"
              aria-expanded={true}
              title="Hide project summary"
            >
              <PanelRightClose size={15} aria-hidden />
            </button>
          </div>

        <section className={styles.summarySection}>
          <div className={styles.summarySectionHead}>Project</div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Volume</span>
            <span className={styles.summaryValue}>
              {m.volume > 0 ? `${m.volume.toLocaleString()} gal` : '—'}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Surface area</span>
            <span className={styles.summaryValue}>
              {m.surfaceArea > 0 ? `${Math.round(m.surfaceArea).toLocaleString()} sq ft` : '—'}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Expected build</span>
            <div className={styles.summaryBuildCell}>
              <input
                type="month"
                className={styles.summaryMonthInput}
                value={buildMonthValue}
                disabled={d.isFinalized}
                onChange={(e) => {
                  const v = e.target.value;
                  dispatch({
                    type: 'UPDATE_DATA',
                    payload: { expectedBuildDate: v ? `${v}-01` : null },
                  });
                }}
                aria-label="Expected first month of construction"
              />
              {d.expectedBuildDate && buildHintPct != null && buildMonths > 0 && (
                <span className={styles.summaryHint} title={INFLATION_DRIFT_TITLE}>
                  ~+{buildHintPct}% drift ({buildMonths} mo)
                </span>
              )}
            </div>
          </div>
        </section>

        <section className={styles.summarySection}>
          <div className={styles.summarySectionHead}>Hydraulics</div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Required GPM</span>
            <span className={styles.summaryValue}>
              {m.requiredGpm > 0 ? `${m.requiredGpm} GPM` : '—'}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Engineering add</span>
            <span className={styles.summaryValue}>
              {m.requiredGpm > 0 ? `${m.addGpm} GPM` : '—'}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Design GPM</span>
            <span className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>
              {m.designGpm > 0 ? `${m.designGpm} GPM` : '—'}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>TDH (est.)</span>
            <span className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>
              {m.tdhFt > 0 ? `${m.tdhFt} ft` : '—'}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Turnover</span>
            <span className={styles.summaryValue}>
              {m.turnoverHours > 0 ? `${m.turnoverHours} h` : '—'}
            </span>
          </div>
        </section>

        <section className={styles.summarySection}>
          <div className={styles.summarySectionHead}>Bather load</div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Design load</span>
            <span className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>
              {m.surfaceArea > 0 ? `${m.designBathers}` : '—'}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Max capacity</span>
            <span className={styles.summaryValue}>
              {m.surfaceArea > 0 ? `${m.maxBathers}` : '—'}
            </span>
          </div>
        </section>

        <section className={styles.summarySection}>
          <div className={styles.summarySectionHead}>Cost</div>
          {m.costByCategory.map(({ category, subtotal }) => (
            <div key={category} className={styles.summaryRow}>
              <span className={styles.summaryLabel}>{category}</span>
              <span className={styles.summaryValue}>{fmtCurrency(subtotal)}</span>
            </div>
          ))}
          <div className={styles.summaryDivider} />
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Material cost</span>
            <span className={`${styles.summaryValue} ${styles.summaryCost}`}>{fmtCurrency(m.totalCost)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>With markup</span>
            <span className={`${styles.summaryValue} ${styles.summaryValueAccent}`}>
              {fmtCurrency(m.totalWithMarkup)}
            </span>
          </div>
          <p className={styles.summaryNote}>
            Category subtotals use qty x unit price. With-markup adds per-unit markup from the BOM.
          </p>
        </section>
        </div>
      )}
    </aside>
  );
}

function ProgressRing({ completed, total, size = 32 }: { completed: number; total: number; size?: number }) {
  const pct = total > 0 ? completed / total : 0;
  const strokeW = Math.max(1.25, Math.min(2.1, size / 16));
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const allDone = completed === total && total > 0;
  const half = size / 2;
  const checkSize = size * 0.58;
  const checkPos = (size - checkSize) / 2;
  const checkStroke = Math.max(1.65, Math.min(2.35, size * 0.095));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.ring}>
      <circle
        cx={half} cy={half} r={r}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={strokeW}
        opacity={0.25}
      />
      <circle
        cx={half} cy={half} r={r}
        fill="none"
        stroke={allDone ? 'var(--success)' : 'var(--accent)'}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${half} ${half})`}
        className={styles.ringProgress}
      />
      {allDone && (
        <Check
          size={checkSize}
          x={checkPos}
          y={checkPos}
          stroke="var(--success)"
          strokeWidth={checkStroke}
        />
      )}
    </svg>
  );
}

function ProjectInfoBanner() {
  const { state } = useApp();
  const d = state.data;
  const address = [d.projectAddress, d.projectCity, d.projectState, d.projectZip]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={styles.banner}>
      <div className={styles.bannerFields}>
        <div className={styles.bannerField}>
          <Building2 size={12} className={styles.bannerIcon} />
          <span className={styles.bannerLabel}>Client</span>
          <span className={styles.bannerValue}>{d.clientCompanyName || '—'}</span>
        </div>
        <div className={styles.bannerField}>
          <User size={12} className={styles.bannerIcon} />
          <span className={styles.bannerLabel}>Owner</span>
          <span className={styles.bannerValue}>{d.ownerName || '—'}</span>
        </div>
        <div className={styles.bannerField}>
          <MapPin size={12} className={styles.bannerIcon} />
          <span className={styles.bannerLabel}>Site</span>
          <span className={styles.bannerValue}>{address || '—'}</span>
        </div>
        {d.ownerCrmLink && (
          <div className={styles.bannerField}>
            <Link size={12} className={styles.bannerIcon} />
            <span className={styles.bannerLabel}>CRM</span>
            <span className={styles.bannerValue}>{d.ownerCrmLink}</span>
          </div>
        )}
      </div>
      <span className={styles.bannerAction}>
        <ExternalLink size={12} aria-hidden />
        <span>Edit in Admin</span>
      </span>
    </div>
  );
}

function ConfiguratorPage() {
  const { state, dispatch } = useApp();
  const d = state.data;

  const groupData: GroupInfo[] = useMemo(() => {
    return CONFIGURATOR_STEP_GROUPS.map((group) => {
      const steps = STEP_DEFINITIONS.filter(
        (s) => s.group === group && s.isVisible(d),
      );
      const completed = steps.filter((s) => s.isComplete(d)).length;
      return { group, steps, completed, total: steps.length };
    });
  }, [d]);

  const [activeGroup, setActiveGroup] = useState<StepGroup | null>(() => (
    groupData.find((g) => g.completed < g.total)?.group ?? groupData[0]?.group ?? null
  ));
  const [highlightStep, setHighlightStep] = useState<ConfigStep | null>(null);
  /** Mechanical Systems: which single step is shown in the main pane. */
  const [mechanicalStepFocus, setMechanicalStepFocus] = useState<ConfigStep | null>(null);
  const [projectInfoSegment, setProjectInfoSegment] = useState<'contacts' | 'site'>('contacts');
  const stepBlockRefs = useRef<Map<ConfigStep, HTMLDivElement>>(new Map());

  // Honor an external `state.activeStep` request (e.g. clicking a row in
  // Engineering → NAVIGATE_TO_STEP). Switch to the step's group, scroll its
  // block into view, briefly highlight it, then clear the activeStep so
  // re-clicking the same row works.
  useEffect(() => {
    const target = state.activeStep;
    if (!target) return;
    const stepDef = STEP_DEFINITIONS.find((s) => s.id === target);
    if (!stepDef) return;
    const stateTid = window.setTimeout(() => {
      setActiveGroup(stepDef.group);
      setHighlightStep(target);
      if (stepDef.group === 'Mechanical Systems') {
        setMechanicalStepFocus(target);
      }
      if (stepDef.group === 'Project Information') {
        const seg = PROJECT_INFO_SEGMENTS.find((s) => s.steps.includes(target));
        if (seg) setProjectInfoSegment(seg.id);
      }
    }, 0);

    const scrollTid = window.setTimeout(() => {
      stepBlockRefs.current
        .get(target)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Clear the navigation request after we've consumed it.
      dispatch({ type: 'SET_STEP', step: null });
    }, 60);

    const highlightTid = window.setTimeout(() => setHighlightStep(null), 1800);

    return () => {
      window.clearTimeout(stateTid);
      window.clearTimeout(scrollTid);
      window.clearTimeout(highlightTid);
    };
  }, [state.activeStep, dispatch]);

  const selectedGroup = activeGroup && groupData.some((g) => g.group === activeGroup)
    ? activeGroup
    : groupData.find((g) => g.completed < g.total)?.group ?? groupData[0]?.group;

  useEffect(() => {
    if (selectedGroup !== 'Mechanical Systems') {
      setMechanicalStepFocus(null);
    }
    if (selectedGroup !== 'Project Information') {
      setProjectInfoSegment('contacts');
    }
  }, [selectedGroup]);

  const totalSteps = groupData.reduce((sum, g) => sum + g.total, 0);
  const totalCompleted = groupData.reduce((sum, g) => sum + g.completed, 0);
  const overallPct = totalSteps > 0 ? Math.round((totalCompleted / totalSteps) * 100) : 0;

  const renderedForms = useMemo(() => {
    const seen = new Set<React.FC>();
    const map = new Map<ConfigStep, React.FC>();
    for (const { steps } of groupData) {
      for (const step of steps) {
        const Form = WIZARD_STEP_FORMS[step.id];
        if (Form && !seen.has(Form)) {
          seen.add(Form);
          map.set(step.id, Form);
        }
      }
    }
    return map;
  }, [groupData]);

  const active = groupData.find((g) => g.group === selectedGroup);

  const jumpNavSteps = useMemo(() => {
    if (!active) return [];
    return active.steps.filter((s) => renderedForms.has(s.id));
  }, [active, renderedForms]);

  const paneRenderSteps = useMemo(() => {
    if (!active) return [];
    const base = active.steps.filter((s) => renderedForms.has(s.id));
    if (active.group === 'Mechanical Systems') {
      const focus =
        mechanicalStepFocus ??
        base.find((s) => !s.isComplete(d))?.id ??
        base[0]?.id ??
        null;
      return focus ? base.filter((s) => s.id === focus) : base;
    }
    if (active.group === 'Project Information') {
      const seg = PROJECT_INFO_SEGMENTS.find((s) => s.id === projectInfoSegment);
      if (!seg) return base;
      return base.filter((s) => seg.steps.includes(s.id));
    }
    return base;
  }, [active, mechanicalStepFocus, projectInfoSegment, renderedForms, d]);

  return (
    <div className={styles.outer}>
      <ProjectInfoBanner />
      {d.isFinalized && (
        <div className={styles.readOnlyBanner}>
          This project is finalized. Unlock it from the title bar before changing configuration or procurement data.
        </div>
      )}
      <div className={styles.body}>
        {/* Left: group nav */}
        <nav className={styles.groupNav}>
          <div className={styles.progressHeader}>
            <div className={styles.progressMeta}>
              <span className={styles.progressLabelRow}>
                <span className={styles.progressLabel}>Configuration</span>
                {totalCompleted === totalSteps && totalSteps > 0 && (
                  <span className={styles.progressCompleteBadge}>Complete</span>
                )}
              </span>
              <span className={styles.progressFraction}>{totalCompleted}/{totalSteps}</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          {groupData.map(({ group, steps, completed, total }) => {
            const allDone = completed === total && total > 0;
            const isActive = group === selectedGroup;

            const subSteps = steps.filter((s) => renderedForms.has(s.id));
            const mechFocusId =
              group === 'Mechanical Systems'
                ? (mechanicalStepFocus ??
                    subSteps.find((s) => !s.isComplete(d))?.id ??
                    subSteps[0]?.id)
                : null;

            return (
              <div key={group} className={styles.navGroup}>
                <button
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${allDone ? styles.navItemDone : ''}`}
                  onClick={() => setActiveGroup(group)}
                >
                  <div className={styles.navTop}>
                    <span className={styles.navName}>{group}</span>
                    <span className={`${styles.navCount} ${allDone ? styles.navCountDone : ''}`}>
                      {completed}/{total}
                    </span>
                  </div>
                </button>

                {group === 'Project Information' ? (
                  <div className={styles.navSubItems}>
                    {PROJECT_INFO_SEGMENTS.map((seg) => {
                      const segDone = seg.steps.every((id) => {
                        const def = STEP_DEFINITIONS.find((x) => x.id === id);
                        return def ? def.isComplete(d) : false;
                      });
                      const isCurrent = isActive && projectInfoSegment === seg.id;
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          className={`${styles.navSubItem} ${segDone ? styles.navSubItemDone : ''} ${isCurrent ? styles.navSubItemCurrent : ''}`}
                          onClick={() => {
                            setActiveGroup(group);
                            setProjectInfoSegment(seg.id);
                          }}
                        >
                          <span className={`${styles.navSubDot} ${segDone ? styles.navSubDotDone : ''}`} />
                          <span className={styles.navSubLabel}>{seg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : subSteps.length > 0 ? (
                  <div className={styles.navSubItems}>
                    {subSteps.map((s) => {
                      const done = s.isComplete(d);
                      const isCurrent =
                        isActive &&
                        (group === 'Mechanical Systems'
                          ? mechFocusId === s.id
                          : false);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`${styles.navSubItem} ${done ? styles.navSubItemDone : ''} ${isCurrent ? styles.navSubItemCurrent : ''}`}
                          onClick={() => {
                            setActiveGroup(group);
                            if (group === 'Mechanical Systems') {
                              setMechanicalStepFocus(s.id);
                            } else {
                              window.setTimeout(() => {
                                stepBlockRefs.current
                                  .get(s.id)
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                setHighlightStep(s.id);
                                window.setTimeout(() => setHighlightStep(null), 1400);
                              }, 0);
                            }
                          }}
                        >
                          <span className={`${styles.navSubDot} ${done ? styles.navSubDotDone : ''}`} />
                          <span className={styles.navSubLabel}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {/* Right: active group content */}
        <div className={styles.groupPane}>
          {active && (
            <>
              <div className={styles.paneHeader}>
                <div className={styles.paneTitle}>
                  <div className={styles.paneTitleLeft}>
                    <ProgressRing completed={active.completed} total={active.total} size={22} />
                    <span className={styles.paneTitleText}>{active.group}</span>
                  </div>
                  <div className={styles.paneHeaderRight}>
                    {active.completed < active.total && (
                      <div className={styles.incompleteHint}>
                        <AlertCircle size={12} aria-hidden />
                        <span>
                          {active.total - active.completed} field
                          {active.total - active.completed !== 1 ? 's' : ''} remaining
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {active.group === 'Project Information' ? (
                <div
                  className={styles.stepSubNav}
                  role="navigation"
                  aria-label="Project information sections"
                >
                  <span className={styles.stepSubNavLabel}>Section</span>
                  <div className={styles.stepSubNavChips}>
                    {PROJECT_INFO_SEGMENTS.map((seg) => {
                      const done = seg.steps.every((id) => {
                        const def = STEP_DEFINITIONS.find((x) => x.id === id);
                        return def ? def.isComplete(d) : false;
                      });
                      const isCurrent = projectInfoSegment === seg.id;
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          className={`${styles.stepSubNavChip} ${done ? styles.stepSubNavChipDone : ''} ${isCurrent ? styles.stepSubNavChipCurrent : ''}`}
                          onClick={() => setProjectInfoSegment(seg.id)}
                        >
                          {seg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : jumpNavSteps.length > 1 ? (
                <div
                  className={styles.stepSubNav}
                  role="navigation"
                  aria-label={`${active.group} — jump to step`}
                >
                  <span className={styles.stepSubNavLabel}>
                    {active.group === 'Mechanical Systems' ? 'Mechanical step' : 'Jump to'}
                  </span>
                  <div className={styles.stepSubNavChips}>
                    {jumpNavSteps.map((s) => {
                      const done = s.isComplete(d);
                      const isMech = active.group === 'Mechanical Systems';
                      const focusId =
                        mechanicalStepFocus ??
                        jumpNavSteps.find((x) => !x.isComplete(d))?.id ??
                        jumpNavSteps[0]?.id;
                      const isCurrent = isMech && focusId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`${styles.stepSubNavChip} ${done ? styles.stepSubNavChipDone : ''} ${isCurrent ? styles.stepSubNavChipCurrent : ''}`}
                          onClick={() => {
                            if (isMech) {
                              setMechanicalStepFocus(s.id);
                            } else {
                              stepBlockRefs.current
                                .get(s.id)
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              setHighlightStep(s.id);
                              window.setTimeout(() => setHighlightStep(null), 1400);
                            }
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div className={styles.paneBody}>
                {paneRenderSteps.map((s) => {
                    const Form = renderedForms.get(s.id)!;
                    const isDone = s.isComplete(d);
                    const isHighlight = highlightStep === s.id;
                    const isPrefilled = isStepPrefilledFromTemplate(s.id, state.appliedTemplatePreset);
                    return (
                      <div
                        key={s.id}
                        ref={(el) => {
                          if (el) stepBlockRefs.current.set(s.id, el);
                          else stepBlockRefs.current.delete(s.id);
                        }}
                        className={`${styles.stepBlock} ${isDone ? styles.stepBlockDone : ''} ${isHighlight ? styles.stepBlockHighlight : ''}`}
                      >
                        {isPrefilled && (
                          <span className={styles.prefillBadge}>Pre-filled by template</span>
                        )}
                        <Form />
                      </div>
                    );
                  })}
                {active.completed === active.total && active.total > 0 && (
                  <div className={styles.allDoneMsg}>
                    <Check size={14} />
                    <span>All steps in {active.group} are complete</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <ConfiguratorSummary />
      </div>
    </div>
  );
}

export { ConfiguratorPage };
