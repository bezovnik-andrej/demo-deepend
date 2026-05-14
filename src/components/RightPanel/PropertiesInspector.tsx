import { useApp } from '../../store';
import { AUTHORING_MODE_LABELS } from '../../types';
import { calculateVolumeTotals } from '../../data/poolSections';
import styles from './RightPanel.module.css';

export function PropertiesInspector() {
  const { state } = useApp();
  const { authoringMode, activeWorkspace, data } = state;

  if (activeWorkspace === 'design') {
    return (
      <div className={styles.inspector}>
        <div className={styles.inspectorSection}>
          <div className={styles.inspectorLabel}>Authoring Mode</div>
          <div className={styles.inspectorValue}>{AUTHORING_MODE_LABELS[authoringMode]}</div>
        </div>
        <div className={styles.inspectorSection}>
          <div className={styles.inspectorLabel}>Selection</div>
          <div className={styles.inspectorValue}>No object selected</div>
        </div>
      </div>
    );
  }

  if (activeWorkspace === 'engineering') {
    const totals = calculateVolumeTotals(data.poolSections);
    const rows: { label: string; value: string }[] = [
      { label: 'Project', value: data.projectName || '—' },
      { label: 'Address', value: data.projectAddress || '—' },
      { label: 'Pool use', value: data.poolUseType || '—' },
      { label: 'Sections', value: `${data.poolSections.length}` },
      { label: 'Volume', value: totals.totalGallons > 0 ? `${totals.totalGallons.toLocaleString()} gal` : '—' },
      { label: 'Surface area', value: totals.totalArea > 0 ? `${totals.totalArea.toLocaleString()} sq ft` : '—' },
      { label: 'Inlet strategy', value: data.inletStrategy ?? 'auto-shelf' },
      {
        label: 'Expected build',
        value: data.expectedBuildDate
          ? new Date(`${data.expectedBuildDate}T12:00:00`).toLocaleString('en-US', {
              month: 'short',
              year: 'numeric',
            })
          : '—',
      },
    ];

    return (
      <div className={styles.inspector}>
        {rows.map((r) => (
          <div key={r.label} className={styles.inspectorRow}>
            <span className={styles.inspectorRowLabel}>{r.label}</span>
            <span className={styles.inspectorRowValue}>{r.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return <div className={styles.empty}>Select a canvas object to inspect.</div>;
}
