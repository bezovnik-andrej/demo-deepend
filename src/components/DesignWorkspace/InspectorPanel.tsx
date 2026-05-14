import styles from './InspectorPanel.module.css';

const MOCK_POINTS = [
  { x: 0, y: 0 },
  { x: 380, y: 0 },
  { x: 400, y: 20 },
  { x: 400, y: 100 },
  { x: 520, y: 100 },
  { x: 520, y: 300 },
  { x: 500, y: 320 },
  { x: 20, y: 320 },
  { x: 0, y: 300 },
];

export function InspectorPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>Inspector</div>

      <div className={styles.body}>
        {/* ── Selection ── */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>Selection</div>
          <div className={styles.selectionCard}>
            <div className={styles.selectionTop}>
              <span className={styles.selectionSwatch} />
              <span className={styles.selectionName}>Pool Shell</span>
            </div>
            <div className={styles.selectionBottom}>
              <span className={styles.selectionMeta}>Polygon, 9 pts</span>
              <span className={styles.selectionDot} />
              <span className={styles.selectionMeta}>Geometry</span>
            </div>
          </div>
        </section>

        {/* ── Points ── */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>Points</div>
          <div className={styles.pointsGrid}>
            <div className={styles.pointsHeader}>
              <span className={styles.pointsHeaderIdx}>#</span>
              <span className={styles.pointsHeaderVal}>X</span>
              <span className={styles.pointsHeaderVal}>Y</span>
            </div>
            {MOCK_POINTS.map((pt, i) => (
              <div key={i} className={styles.pointsRow}>
                <span className={styles.pointIdx}>{i}</span>
                <span className={styles.pointCell}>{pt.x}</span>
                <span className={styles.pointCell}>{pt.y}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Dimensions ── */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>Dimensions</div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Width</span>
            <span className={styles.propValue}>43&prime;-4&Prime;</span>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Length</span>
            <span className={styles.propValue}>26&prime;-8&Prime;</span>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Perimeter</span>
            <span className={styles.propValue}>162 ft</span>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Area</span>
            <span className={styles.propValue}>1,480 sq ft</span>
          </div>
        </section>

        {/* ── Depth ── */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>Depth</div>
          <div className={styles.depthInputs}>
            <div className={styles.depthField}>
              <span className={styles.depthLabel}>Min</span>
              <input className={styles.depthInput} defaultValue={"3\u2032-0\u2033"} readOnly />
            </div>
            <div className={styles.depthField}>
              <span className={styles.depthLabel}>Max</span>
              <input className={styles.depthInput} defaultValue={"8\u2032-0\u2033"} readOnly />
            </div>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Average</span>
            <span className={styles.propValue}>5&prime;-6&Prime;</span>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Volume</span>
            <span className={styles.propValue}>28,052 gal</span>
          </div>
        </section>

        {/* ── Appearance ── */}
        <section className={styles.sectionLast}>
          <div className={styles.sectionLabel}>Appearance</div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Fill</span>
            <span className={styles.appearanceValue}>
              <span className={styles.colorSwatch} style={{ background: 'rgba(74,158,255,.04)' }} />
              <span className={styles.monoValue}>rgba(74,158,255,.04)</span>
            </span>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Stroke</span>
            <span className={styles.appearanceValue}>
              <span className={styles.colorSwatch} style={{ background: '#4a9eff' }} />
              <span className={styles.monoValue}>#4a9eff</span>
            </span>
          </div>
          <div className={styles.propRow}>
            <span className={styles.propLabel}>Weight</span>
            <span className={styles.appearanceValue}>
              <span className={styles.colorSwatch} style={{ background: '#4a9eff' }} />
              <span className={styles.monoValue}>1.5px</span>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
