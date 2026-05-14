import { Eye, Lock } from 'lucide-react';
import styles from './LeftPanel.module.css';

const LAYERS = [
  'Pool Shell',
  'Deck',
  'Equipment Pad',
  'Plumbing',
  'Electrical',
  'Landscaping',
];

export function LayersPanel() {
  return (
    <div>
      {LAYERS.map((name) => (
        <div key={name} className={styles.layerRow}>
          <Eye size={13} className={styles.layerIcon} />
          <Lock size={13} className={styles.layerIcon} />
          <span className={styles.layerName}>{name}</span>
        </div>
      ))}
    </div>
  );
}
