import {
  MousePointer2, Hand, Plus, Minus, CopyPlus, Ruler, Footprints, Armchair,
  AlignVerticalSpaceAround, RectangleHorizontal, ArrowUpFromDot, CircleDot,
  Lightbulb, Filter, Route, Disc, GitBranch, Layers, ScanLine, Grid3x3, Box,
  Image,
} from 'lucide-react';
import { useApp } from '../../store';
import { TOOLS_BY_MODE } from '../../types';
import type { AuthoringMode } from '../../types';
import styles from './ToolStrip.module.css';

const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  MousePointer2, Hand, Plus, Minus, CopyPlus, Ruler, Footprints, Armchair,
  AlignVerticalSpaceAround, RectangleHorizontal, ArrowUpFromDot, CircleDot,
  Lightbulb, Filter, Route, Disc, GitBranch, Layers, ScanLine, Grid3x3, Box,
  Image,
};

export function ToolStrip() {
  const { state, dispatch } = useApp();
  const tools = TOOLS_BY_MODE[state.authoringMode as AuthoringMode] ?? [];

  return (
    <div className={styles.strip}>
      {tools.map((tool) => {
        if (tool.id.startsWith('divider')) {
          return <div key={tool.id} className={styles.divider} />;
        }
        const Icon = ICON_MAP[tool.icon];
        const isActive = state.activeTool === tool.id;
        return (
          <button
            key={tool.id}
            className={`${styles.tool} ${isActive ? styles.toolActive : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TOOL', tool: tool.id })}
            title={tool.label + (tool.shortcut ? ` (${tool.shortcut})` : '')}
            aria-label={tool.label}
            aria-pressed={isActive}
          >
            {Icon ? <Icon size={16} /> : null}
          </button>
        );
      })}
    </div>
  );
}
