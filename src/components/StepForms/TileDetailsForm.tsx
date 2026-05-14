import { useState } from 'react';
import { useApp } from '../../store';
import { OptionButton } from '../ui/OptionButton';
import { TextInput } from '../ui/TextInput';
import styles from './forms.module.css';

const BAND_OPTIONS = [
  { value: '6 inches', label: '6 inches' },
  { value: '12 inches', label: '12 inches' },
  { value: 'Custom', label: 'Custom height' },
];

const NOSING_OPTIONS = [
  { value: 'Square edge', label: 'Square edge' },
  { value: 'Bullnose', label: 'Bullnose' },
  { value: 'Mitered edge', label: 'Mitered edge' },
  { value: 'Custom detail', label: 'Custom detail' },
];

export function TileDetailsForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const [showCustom, setShowCustom] = useState(d.tileBandHeight === 'Custom');

  const handleBandChange = (v: string) => {
    dispatch({ type: 'UPDATE_DATA', payload: { tileBandHeight: v } });
    setShowCustom(v === 'Custom');
  };

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>Tile Details</h2>
      <p className={styles.formDesc}>Configure your tile band and stair nosing preferences.</p>
      <OptionButton
        label="Tile band height"
        options={BAND_OPTIONS}
        value={d.tileBandHeight}
        onChange={handleBandChange}
        disabled={d.isFinalized}
      />
      {showCustom && (
        <TextInput
          label="Custom height (inches)"
          value={d.customTileHeight}
          onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { customTileHeight: v } })}
          placeholder="e.g. 18"
          disabled={d.isFinalized}
        />
      )}
      <OptionButton
        label="Stair nosing detail"
        options={NOSING_OPTIONS}
        value={d.stairNosingDetail}
        onChange={(v) => dispatch({ type: 'UPDATE_DATA', payload: { stairNosingDetail: v } })}
        disabled={d.isFinalized}
      />
    </div>
  );
}
