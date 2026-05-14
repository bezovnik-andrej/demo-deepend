import { FileText, Clock } from 'lucide-react';
import type { Workspace } from '../../types';
import styles from './workspaces.module.css';

const CONFIG: Record<string, { title: string; sub: string; Icon: React.FC<{ size?: number }> }> = {
  deliverables: {
    title: 'Deliverables',
    sub: 'Shop drawings, submittal packages, and exportable documents will appear here.',
    Icon: FileText,
  },
  history: {
    title: 'Project History',
    sub: 'Revision history, change log, and audit trail will appear here.',
    Icon: Clock,
  },
};

export function PlaceholderWorkspace({ workspace }: { workspace: Workspace }) {
  const config = CONFIG[workspace];
  if (!config) return null;
  const { title, sub, Icon } = config;

  return (
    <div className={styles.placeholder}>
      <Icon size={36} />
      <div className={styles.placeholderTitle}>{title}</div>
      <div className={styles.placeholderSub}>{sub}</div>
    </div>
  );
}
