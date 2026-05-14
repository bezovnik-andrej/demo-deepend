import type { ProjectData } from '../types';
import { getTurnoverHoursForPoolType } from './engineering';
import { calculateVolumeTotals } from './poolSections';

/** Required + engineering add-on GPM (matches Engineering / KPI bar). */
export function computeDesignGpm(
  data: ProjectData,
  engineeringFlowAddGpm: number | null,
): { requiredGpm: number; designGpm: number } {
  const volumeTotals = calculateVolumeTotals(data.poolSections);
  const volume = volumeTotals.totalGallons;
  const poolUseType = data.poolUseType || null;
  const turnoverHours =
    data.turnoverHoursOverride ?? getTurnoverHoursForPoolType(poolUseType, volumeTotals.averageDepth);
  const requiredGpm = Math.round(volume / Math.max(turnoverHours * 60, 1));
  const defaultAddGpm = Math.max(0, Math.round(requiredGpm * 0.1));
  const addGpm = engineeringFlowAddGpm ?? defaultAddGpm;
  const designGpm = requiredGpm + addGpm;
  return { requiredGpm, designGpm };
}
