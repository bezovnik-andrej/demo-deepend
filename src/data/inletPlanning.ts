import type { InletStrategy } from '../types';
import type { PoolSection } from './poolSections';
import { isSuperShallowPoolSection } from './poolSections';

/** GPM capacity assumed per return fitting (oversized is OK per Brett). */
export const FLOW_PER_INLET_GPM = 15;

export interface InletPlan {
  wallReturns: number;
  floorReturns: number;
}

/**
 * Fractional shelf area rule: each super-shallow section gets a share of design GPM;
 * floor fitting count from that share; wall fittings take the remainder.
 */
export function planInlets(
  sections: PoolSection[],
  strategy: InletStrategy,
  designGpm: number,
): InletPlan {
  const gpm = Math.max(0, designGpm);

  if (strategy === 'wall-only') {
    return {
      wallReturns: gpm <= 0 ? 0 : Math.ceil(gpm / FLOW_PER_INLET_GPM),
      floorReturns: 0,
    };
  }

  if (strategy === 'floor-only') {
    return {
      wallReturns: 0,
      floorReturns: gpm <= 0 ? 0 : Math.ceil(gpm / FLOW_PER_INLET_GPM),
    };
  }

  const totalArea = sections.reduce((s, sec) => s + Math.max(0, sec.area), 0);
  if (totalArea <= 0 || gpm <= 0) {
    return { wallReturns: 0, floorReturns: 0 };
  }

  let floorGpmShareSum = 0;
  let floorReturns = 0;

  for (const sec of sections) {
    if (!isSuperShallowPoolSection(sec)) continue;
    const area = Math.max(0, sec.area);
    const share = area / totalArea;
    const floorGpmShare = share * gpm;
    floorGpmShareSum += floorGpmShare;
    floorReturns += Math.ceil(floorGpmShare / FLOW_PER_INLET_GPM);
  }

  const wallGpm = Math.max(0, gpm - floorGpmShareSum);
  const wallReturns = wallGpm <= 0 ? 0 : Math.ceil(wallGpm / FLOW_PER_INLET_GPM);

  return { wallReturns, floorReturns };
}

/** Dev-only sanity: 25% shelf @ 1.5 ft in a 50k-gal-style flow budget. */
export function runPlanInletsDevSanityChecks(): void {
  if (!import.meta.env.DEV) return;

  const sections: PoolSection[] = [
    { id: 'a', label: 'Shelf', type: 'open-area', area: 750, depth: 1.5 },
    { id: 'b', label: 'Main', type: 'open-area', area: 2250, depth: 4.5 },
  ];
  const designGpm = 140;
  const plan = planInlets(sections, 'auto-shelf', designGpm);
  const shelfShareGpm = (750 / 3000) * designGpm;
  const expectedFloor = Math.ceil(shelfShareGpm / FLOW_PER_INLET_GPM);
  if (plan.floorReturns !== expectedFloor) {
    throw new Error(
      `planInlets sanity: floorReturns expected ${expectedFloor}, got ${plan.floorReturns}`,
    );
  }
  const expectedWallGpm = designGpm - shelfShareGpm;
  const expectedWall = Math.ceil(expectedWallGpm / FLOW_PER_INLET_GPM);
  if (plan.wallReturns !== expectedWall) {
    throw new Error(
      `planInlets sanity: wallReturns expected ${expectedWall}, got ${plan.wallReturns}`,
    );
  }
}

runPlanInletsDevSanityChecks();
