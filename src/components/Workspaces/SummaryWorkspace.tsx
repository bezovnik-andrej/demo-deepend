import { useApp } from '../../store';
import { STEP_DEFINITIONS, ConfigStep } from '../../types';
import { isTileDetailsStepComplete, isWaterlineTileSegmentComplete } from '../../utils/finishTileSpec';
import styles from './workspaces.module.css';

export function SummaryWorkspace() {
  const { state, dispatch } = useApp();
  const d = state.data;

  const visibleSteps = STEP_DEFINITIONS.filter((s) => s.group !== 'Review' && s.isVisible(d));
  const completedSteps = visibleSteps.filter((s) => s.isComplete(d));
  const incompleteSteps = visibleSteps.length - completedSteps.length;

  const sections = [
    {
      title: 'Hydraulics & Circulation',
      required: 1,
      items: [
        {
          label: 'Water Circulation System',
          value: d.filtrationType ? `Recirculation Type: ${d.filtrationType}` : 'Recirculation Type: Not set',
          stepId: ConfigStep.Filtration,
          complete: !!d.filtrationType,
        },
      ],
    },
    {
      title: 'Finishes',
      required: 3,
      items: [
        {
          label: 'Interior Finish',
          value: d.finishType ? d.finishType : 'Not selected',
          complete: !!d.finishType,
          stepId: ConfigStep.InteriorFinish,
        },
        {
          label: 'Tile details',
          value: (() => {
            if (d.finishType !== 'Tile') return '—';
            const parts = [
              d.stairNosingDetail,
              d.waterlineBandInches != null ? `${d.waterlineBandInches}" band` : '',
              d.waterlineTileSizeLabel ?? '',
              d.applyWaterlineTileToBody ? 'Field matches waterline' : 'Field tile separate',
            ].filter(Boolean);
            return parts.length ? parts.join(' · ') : 'Not configured';
          })(),
          complete: d.finishType === 'Tile' ? isTileDetailsStepComplete(d) : true,
          stepId: ConfigStep.TileDetails,
        },
        {
          label: 'Waterline tile band',
          value:
            d.finishType === 'Plaster' || d.finishType === 'Pebble'
              ? d.waterlineTileEnabled
                ? [d.waterlineBandInches != null && `${d.waterlineBandInches}"`, d.waterlineTileSizeLabel].filter(Boolean).join(' · ') ||
                  'In progress'
                : 'Not applicable'
              : '—',
          complete:
            d.finishType === 'Plaster' || d.finishType === 'Pebble'
              ? isWaterlineTileSegmentComplete(d)
              : true,
          stepId: ConfigStep.InteriorFinish,
        },
      ],
    },
    {
      title: 'Mechanical System Design',
      required: 4,
      items: [
        {
          label: 'Equipment & Systems',
          value: d.filtrationType ? `Filtration: ${d.filtrationType}` : 'Filtration: Not set',
          complete: !!d.filtrationType,
        },
        {
          label: 'Primary Sanitation',
          value: d.sanitationType ? d.sanitationType : 'Not set',
          complete: !!d.sanitationType,
        },
        {
          label: 'Heating',
          value: d.heatingSystem.length
            ? `${d.heatingSystem.join(', ')} · ${d.heaterTargetWaterTempF}°F target`
            : 'Not set',
          complete: d.heatingSystem.length > 0,
        },
        {
          label: 'Heater Sizing',
          value: d.selectedHeaterBtu
            ? `${d.selectedHeaterBtu >= 1_000_000 ? `${(d.selectedHeaterBtu / 1_000_000).toFixed(1)}M` : `${Math.round(d.selectedHeaterBtu / 1000)}k`} BTU · ${d.poolEnvironment} · ${d.heaterHeatUpDays}-day heat-up`
            : `${d.poolEnvironment} · ${d.heaterHeatUpDays}-day heat-up (auto-size)`,
          complete: d.heatingSystem.length > 0 && d.heaterTargetWaterTempF > 0,
        },
        {
          label: 'Brand Preferences',
          value: d.mechanicalBrandPreference ? d.mechanicalBrandPreference : 'Not set',
          complete: !!d.mechanicalBrandPreference,
        },
      ],
      footer: 'Company standard equipment – sized by engineering team',
      complete: !!(d.filtrationType && d.sanitationType),
    },
    {
      title: 'Pipe Specifications',
      required: 3,
      items: [
        { label: 'Below Grade Pipe', value: 'Not set', complete: false },
        { label: 'Above Grade Pipe', value: 'Not set', complete: false },
        { label: 'Heater Loop Pipe', value: 'Not set', complete: false },
      ],
    },
  ];

  return (
    <div className={styles.workspace}>
      {/* Header */}
      <div className={styles.configHeader}>
        <div>
          <div className={styles.configTitle}>Pool Design Configuration</div>
          <div className={styles.configMeta}>
            <span className={styles.configComplete}>Complete</span>
            <span className={styles.configDivider}>•</span>
            <span className={styles.configIncomplete}>Incomplete</span>
          </div>
        </div>
        <div className={styles.configStats}>
          <div><span className={styles.statLabel}>Pool Area:</span> 450 sq ft</div>
          <div><span className={styles.statLabel}>Estimated Total:</span> $70,524</div>
        </div>
      </div>

      {/* Summary row */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Complete</span>
          <span className={styles.summaryValue}>{completedSteps.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Incomplete</span>
          <span className={styles.summaryValue}>{incompleteSteps}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Project</span>
          <span className={styles.summaryValue}>{d.projectName || 'Untitled Pool Project'}</span>
        </div>
      </div>

      {/* Sections */}
      <div className={styles.configList}>
        {sections.map((section) => {
          const done = section.items.filter((i) => i.complete).length;
          const required = section.required;
          const requiredLeft = Math.max(required - done, 0);
          const isComplete = done >= required && required > 0;

          return (
            <div key={section.title} className={`${styles.configCard} ${isComplete ? styles.cardComplete : styles.cardIncomplete}`}>
              <div className={styles.cardHeaderRow}>
                <div className={styles.cardTitle}>{section.title}</div>
                <div className={styles.cardStatus}>
                  {isComplete ? (
                    <span className={styles.badgeComplete}>✓ Complete</span>
                  ) : (
                    <span className={styles.badgeRequired}>Required</span>
                  )}
                  <span className={styles.cardCount}>{done}/{required}</span>
                  <span className={styles.cardReq}>{requiredLeft} required</span>
                </div>
              </div>

              <div className={styles.cardBody}>
                {section.items.map((item) => (
                  <div key={item.label} className={styles.cardItem}>
                    <div>
                      <div className={styles.itemLabel}>{item.label}</div>
                      <div className={item.complete ? styles.itemValue : styles.itemValueMuted}>
                        {item.value}
                      </div>
                    </div>
                    {item.complete && <div className={styles.itemCheck}>✓</div>}
                    {!item.complete && 'stepId' in item && item.stepId && (
                      <button
                        className={styles.itemAdd}
                        onClick={() => {
                          dispatch({ type: 'NAVIGATE_TO_STEP', step: item.stepId });
                        }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                ))}
                {section.footer && <div className={styles.cardFooter}>{section.footer}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
