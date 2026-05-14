import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ui.module.css';

interface Props {
  title: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function PanelHeader({ title, collapsed, onToggle }: Props) {
  return (
    <div className={styles.panelHeader}>
      <span className={styles.panelTitle}>{title}</span>
      {onToggle && (
        <button className={styles.panelToggle} onClick={onToggle}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}
    </div>
  );
}
