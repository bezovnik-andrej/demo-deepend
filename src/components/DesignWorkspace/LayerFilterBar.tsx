import { useApp } from '../../store';
import { CANVAS_LAYER_LABELS } from '../../types';
import type { AuthoringMode, CanvasLayerView } from '../../types';
import styles from './LayerFilterBar.module.css';

const LAYER_VIEWS: CanvasLayerView[] = ['all', 'geometry', 'architecture', 'fixtures', 'plumbing'];

const MODE_MAP: Record<CanvasLayerView, AuthoringMode> = {
  all: 'geometry',
  geometry: 'geometry',
  architecture: 'architecture',
  fixtures: 'fixtures',
  plumbing: 'hydraulics',
};

export function LayerFilterBar() {
  const { state, dispatch } = useApp();

  return (
    <div className={styles.bar}>
      <div className={styles.tabs}>
        {LAYER_VIEWS.map((view) => (
          <button
            key={view}
            className={`${styles.tab} ${state.canvasLayerView === view ? styles.tabActive : ''}`}
            onClick={() => {
              dispatch({ type: 'SET_CANVAS_LAYER_VIEW', view });
              dispatch({ type: 'SET_AUTHORING_MODE', mode: MODE_MAP[view] });
            }}
          >
            {CANVAS_LAYER_LABELS[view]}
          </button>
        ))}
      </div>
    </div>
  );
}
