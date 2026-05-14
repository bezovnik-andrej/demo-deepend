import type { ActivityEvent, ProjectFile } from './projectHistory';
import { DEFAULT_PROJECT_ITEMS, cloneProjectItems } from './projectItems';
import { mockProjectToPreset } from './projectTemplates';
import type { MockProject } from '../components/BackOffice/mockProjects';
import { MOCK_PROJECTS } from '../components/BackOffice/mockProjects';
import type { ItemStatus, ProjectData, ProjectItem } from '../types';

export interface ProjectProfile {
  preset: Partial<ProjectData>;
  projectItems: ProjectItem[];
  projectFiles: ProjectFile[];
  activityLog: ActivityEvent[];
  engineeringFlowAddGpm: number | null;
}

type ProfileSeed = {
  preset: Partial<ProjectData>;
  costMultiplier: number;
  qtyMultiplier: number;
  defaultStatus: ItemStatus;
  statusById?: Record<string, ItemStatus>;
  overrides?: Record<string, Partial<ProjectItem>>;
  engineeringFlowAddGpm?: number | null;
  filePrefix: string;
  saveVersions: string[];
  activity: { kind: ActivityEvent['kind']; title: string; detail?: string; target?: string }[];
};

const CONTACTS: Record<string, Pick<ProjectData, 'clientContactName' | 'clientContactEmail' | 'ownerName' | 'ownerAddress' | 'ownerCrmLink'>> = {
  'smith-residence-pool': {
    clientContactName: 'Morgan Smith',
    clientContactEmail: 'morgan.smith@aquabuild.com',
    ownerName: 'Morgan Smith',
    ownerAddress: '742 Evergreen Terrace, Springfield, IL 62704',
    ownerCrmLink: 'aquabuild-smith-gpl-13',
  },
  'johnson-commercial-spa': {
    clientContactName: 'Pat Johnson',
    clientContactEmail: 'pat.johnson@johnsonhg.com',
    ownerName: 'Johnson Hospitality Group',
    ownerAddress: '1200 Marina Blvd, San Diego, CA 92101',
    ownerCrmLink: 'johnsonhg-spa-gpl-14',
  },
  'riverside-estate': {
    clientContactName: 'Rachel Chen',
    clientContactEmail: 'rachel.chen@aquabuild.com',
    ownerName: 'Rachel Chen',
    ownerAddress: '88 River Road, Austin, TX 78704',
    ownerCrmLink: 'aquabuild-riverside-gpl-15',
  },
  'oak-hills-club': {
    clientContactName: 'Dana Morrison',
    clientContactEmail: 'dmorrison@oakhillsgcc.com',
    ownerName: 'Oak Hills Golf & Country Club',
    ownerAddress: '1 Clubhouse Dr, Scottsdale, AZ 85255',
    ownerCrmLink: 'oak-hills-reno-gpl-16',
  },
  'meyer-backyard': {
    clientContactName: 'Taylor Meyer',
    clientContactEmail: 'taylor.meyer@example.com',
    ownerName: 'Taylor Meyer',
    ownerAddress: '45 Birch Ln, Denver, CO 80206',
    ownerCrmLink: 'homeowner-meyer-gpl-17',
  },
  'sunrise-wellness': {
    clientContactName: 'Lina Patel',
    clientContactEmail: 'lina.patel@sunrisehealth.com',
    ownerName: 'Sunrise Health Partners',
    ownerAddress: '900 Wellness Way, Naples, FL 34102',
    ownerCrmLink: 'sunrise-wellness-gpl-18',
  },
};

const PROJECTS_BY_ID = new Map(MOCK_PROJECTS.map((project) => [project.id, project]));

function scaleQty(qty: number, unit: string, multiplier: number): number {
  if (qty <= 0) return qty;
  if (unit === 'LS') return qty;
  if (unit === 'EA') return Math.max(1, Math.round(qty * multiplier));
  return Math.max(1, Math.round(qty * multiplier));
}

function remixItems(items: ProjectItem[], seed: ProfileSeed): ProjectItem[] {
  return items.map((item) => {
    const override = seed.overrides?.[item.id] ?? {};
    const children = item.children ? remixItems(item.children, seed) : undefined;
    const isLeaf = !children?.length && !!item.partNo;
    const price = isLeaf ? Math.max(1, Math.round(item.price * seed.costMultiplier)) : item.price;
    const status = isLeaf ? seed.statusById?.[item.id] ?? seed.defaultStatus : item.status;
    return {
      ...item,
      ...(isLeaf
        ? {
            qty: scaleQty(item.qty, item.unit, seed.qtyMultiplier),
            price,
            markup: Math.max(1, Math.round(price * 0.22)),
            status,
          }
        : {}),
      ...override,
      ...(children ? { children } : {}),
    };
  });
}

function projectFiles(project: MockProject, prefix: string, versions: string[]): ProjectFile[] {
  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const dates = ['2025-04-28T15:10:00Z', '2025-04-17T19:35:00Z', '2025-04-02T12:20:00Z'];
  return [
    ...versions.map((version, idx) => ({
      id: `${project.id}-plan-${version}`,
      folderId: 'plan-sets' as const,
      filename: `${slug}-plan-${version}.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 1800000 + idx * 410000 + project.lifecycleIndex * 120000,
      version,
      savedBy: idx === 0 ? 'jordan' : idx === 1 ? 'casey' : 'sam',
      savedAt: dates[idx] ?? dates[dates.length - 1],
      notes: idx === 0 ? `${project.name} latest demo set.` : `${project.name} working snapshot.`,
    })),
    {
      id: `${project.id}-bom`,
      folderId: 'specifications',
      filename: `${prefix}_BOM_${versions[0] ?? 'v1.0'}.xlsx`,
      mimeType: 'application/vnd.ms-excel',
      sizeBytes: 142000 + project.lifecycleIndex * 9000,
      version: versions[0] ?? 'v1.0',
      savedBy: 'mia',
      savedAt: '2025-04-28T15:12:00Z',
      notes: 'BOM export aligned to current procurement state.',
    },
    {
      id: `${project.id}-drawings`,
      folderId: 'drawings',
      filename: `${prefix}_Shop-Drawings.pdf`,
      mimeType: 'application/pdf',
      sizeBytes: 980000 + project.lifecycleIndex * 180000,
      version: versions[0] ?? 'v1.0',
      savedBy: 'sam',
      savedAt: '2025-04-27T10:18:00Z',
      notes: 'Current drawing package for demo review.',
    },
  ];
}

function projectActivity(project: MockProject, activity: ProfileSeed['activity']): ActivityEvent[] {
  const dates = ['2025-04-28T15:12:00Z', '2025-04-27T10:18:00Z', '2025-04-24T16:04:00Z', '2025-04-18T09:45:00Z'];
  return [
    {
      id: `${project.id}-created`,
      kind: 'created',
      authorId: 'alex',
      at: '2025-03-20T08:22:00Z',
      title: 'Project created',
      detail: `${project.name} · ${project.code} · ${project.client}`,
    },
    ...activity.map((entry, idx) => ({
      id: `${project.id}-activity-${idx}`,
      authorId: idx % 2 === 0 ? 'jordan' : 'mia',
      at: dates[idx] ?? dates[dates.length - 1],
      ...entry,
    })),
    {
      id: `${project.id}-saved-latest`,
      kind: 'saved' as const,
      authorId: 'jordan',
      at: '2025-04-28T15:10:00Z',
      title: 'Saved latest plan set',
      detail: 'Plan set, BOM, and shop drawings refreshed.',
      fileId: `${project.id}-plan-v${project.lifecycleIndex + 1}.0`,
    },
  ];
}

function presetFor(project: MockProject, preset: Partial<ProjectData>): Partial<ProjectData> {
  return {
    ...mockProjectToPreset(project),
    ...CONTACTS[project.id],
    ...preset,
    projectName: project.name,
    clientCompanyName: project.client,
    projectAddress: project.address,
    projectCity: project.cityState.split(',')[0]?.trim() ?? '',
    projectState: project.cityState.split(',')[1]?.trim() ?? '',
    projectZip: project.zip,
  };
}

function makeProfile(projectId: MockProject['id'], seed: ProfileSeed): ProjectProfile {
  const project = PROJECTS_BY_ID.get(projectId);
  if (!project) throw new Error(`Missing mock project ${projectId}`);
  return {
    preset: presetFor(project, seed.preset),
    projectItems: remixItems(cloneProjectItems(DEFAULT_PROJECT_ITEMS), seed),
    projectFiles: projectFiles(project, seed.filePrefix, seed.saveVersions),
    activityLog: projectActivity(project, seed.activity),
    engineeringFlowAddGpm: seed.engineeringFlowAddGpm ?? null,
  };
}

export const MOCK_PROJECT_PROFILES: Record<MockProject['id'], ProjectProfile> = {
  'smith-residence-pool': makeProfile('smith-residence-pool', {
    filePrefix: 'Smith_Residence',
    saveVersions: ['v2.3', 'v2.2', 'v2.0'],
    costMultiplier: 0.92,
    qtyMultiplier: 0.78,
    defaultStatus: 'purchased',
    statusById: {
      filter: 'to-purchase',
      pump: 'to-purchase',
      heater: 'to-purchase',
      sanitizer: 'on-order',
      tileBand: 'to-purchase',
      coping: 'to-purchase',
    },
    engineeringFlowAddGpm: 12,
    preset: {
      expectedBuildDate: '2026-09-01',
      localCodeAwareness: 'yes',
      codeStandards: ['ispsc-2021'],
      customCodes: ['Springfield residential setback review'],
      projectType: 'New Construction',
      poolUseType: 'Residential',
      poolSections: [
        { id: 'smith-shallow', label: 'Shallow lounge', type: 'open-area', area: 185, depth: 3.5 },
        { id: 'smith-main', label: 'Main swim lane', type: 'open-area', area: 235, depth: 5 },
        { id: 'smith-steps', label: 'Entry steps', type: 'stairs', area: 60, depth: 2.5 },
      ],
      deckSf: 620,
      gutterStyle: 'skimmer-12-coping',
      copingStyle: 'Bull Nose',
      mechanicalKnowledge: 'know',
      filtrationType: 'Sand',
      selectedFilterModelIds: ['flt-pen-tr100'],
      filterCount: 2,
      sanitationType: 'Saltwater Chlorine Generator',
      chemicalControl: 'Basic (CAT 2000)',
      phBuffer: 'No pH Buffer',
      heatingSystem: ['Gas Heater'],
      finishType: 'Plaster',
    },
    activity: [
      { kind: 'bom', title: 'Created pending equipment order', detail: 'Pump, filter, heater, and tile band queued.', target: 'Procurement' },
      { kind: 'config', title: 'Adjusted pool volume', detail: 'Main swim lane resized after client review.', target: 'Pool Volumes' },
    ],
  }),
  'johnson-commercial-spa': makeProfile('johnson-commercial-spa', {
    filePrefix: 'Johnson_Spa',
    saveVersions: ['v0.4', 'v0.3'],
    costMultiplier: 0.62,
    qtyMultiplier: 0.45,
    defaultStatus: 'to-purchase',
    engineeringFlowAddGpm: 18,
    preset: {
      expectedBuildDate: '2026-12-01',
      localCodeAwareness: 'help',
      codeStandards: [],
      customCodes: ['San Diego hotel spa plan-check pending'],
      projectType: 'New Construction',
      poolUseType: 'Spa / Hot Tub',
      poolSections: [
        { id: 'johnson-spa-main', label: 'Spa vessel', type: 'open-area', area: 180, depth: 4.2 },
        { id: 'johnson-spa-bench', label: 'Therapy bench', type: 'bench', area: 40, depth: 2.6 },
      ],
      deckSf: 380,
      gutterStyle: 'ss-deck-level',
      copingStyle: 'Flat',
      mechanicalKnowledge: 'help',
      filtrationType: 'Cartridge',
      filterCount: 3,
      sanitationType: 'Bromine Tablets',
      chemicalControl: 'Mid (CAT 3500/4000)',
      phBuffer: 'Liquid muriatic acid',
      heatingSystem: ['Gas Heater'],
      poolEnvironment: 'indoor',
      heaterScenario: 'shoulder-season',
      heaterTargetWaterTempF: 104,
      finishType: 'Tile',
      tileBandHeight: 'Full',
      stairNosingDetail: 'Contrasting',
    },
    activity: [
      { kind: 'created', title: 'Imported hospitality spa brief', detail: 'Draft scope with code review flagged.' },
      { kind: 'config', title: 'Selected indoor spa baseline', detail: 'Therapy bench and full tile finish added.', target: 'Pool Design' },
    ],
  }),
  'riverside-estate': makeProfile('riverside-estate', {
    filePrefix: 'Riverside_Estate',
    saveVersions: ['v3.0', 'v2.8', 'v2.1'],
    costMultiplier: 1.28,
    qtyMultiplier: 1.18,
    defaultStatus: 'on-order',
    statusById: {
      shell: 'purchased',
      rebar: 'purchased',
      belowGrade: 'purchased',
      tileBand: 'to-purchase',
      coping: 'to-purchase',
      wallLights: 'to-purchase',
    },
    engineeringFlowAddGpm: 24,
    preset: {
      expectedBuildDate: '2026-08-01',
      localCodeAwareness: 'yes',
      codeStandards: ['ispsc-2021'],
      customCodes: ['Austin vanishing-edge lot drainage note'],
      projectType: 'New Construction',
      poolUseType: 'Residential',
      poolSections: [
        { id: 'riverside-lounge', label: 'Sun shelf', type: 'wet-deck', area: 90, depth: 0.75 },
        { id: 'riverside-main', label: 'Main pool', type: 'open-area', area: 410, depth: 5.3 },
        { id: 'riverside-deep', label: 'Deep end', type: 'open-area', area: 120, depth: 7 },
      ],
      deckSf: 980,
      gutterStyle: 'ss-deck-level-weirs',
      copingStyle: 'Flat',
      mechanicalKnowledge: 'know',
      filtrationType: 'DE',
      selectedFilterModelIds: ['flt-pen-de72'],
      filterCount: 3,
      sanitationType: 'Saltwater Chlorine Generator',
      chemicalControl: 'Advanced (CAT 5000)',
      secondarySanitation: ['Ultraviolet Light System'],
      phBuffer: 'CO2',
      heatingSystem: ['Gas Heater', 'Heat Pump'],
      finishType: 'Pebble',
      waterFeatures: ['Vanishing Edge', 'Bubbler'],
      poolFeatures: ['Auto Cover'],
    },
    activity: [
      { kind: 'estimate', title: 'Estimate ready for review', detail: 'Premium finish package and dual heat source included.' },
      { kind: 'bom', title: 'Placed structural orders', detail: 'Shell, rebar, and below-grade plumbing moved to ordered.', target: 'Procurement' },
    ],
  }),
  'oak-hills-club': makeProfile('oak-hills-club', {
    filePrefix: 'Oak_Hills',
    saveVersions: ['v4.1', 'v4.0', 'v3.6'],
    costMultiplier: 2.55,
    qtyMultiplier: 2.1,
    defaultStatus: 'on-order',
    statusById: {
      shell: 'purchased',
      rebar: 'purchased',
      drains: 'purchased',
      wallReturns: 'purchased',
      deckJets: 'not-required',
    },
    engineeringFlowAddGpm: 42,
    preset: {
      expectedBuildDate: '2026-07-01',
      localCodeAwareness: 'yes',
      codeStandards: ['ispsc-2021', 'az-maricopa-health'],
      customCodes: ['Scottsdale renovation phasing requirement'],
      projectType: 'Renovation',
      poolUseType: 'Competition Pool',
      poolSections: [
        { id: 'oak-lanes', label: 'Competition lanes', type: 'open-area', area: 960, depth: 5.5 },
        { id: 'oak-start', label: 'Start-end deep zone', type: 'open-area', area: 240, depth: 6.5 },
      ],
      deckSf: 2600,
      numDivingBoards: 2,
      gutterStyle: 'ss-deck-level-weirs',
      copingStyle: 'Flat',
      mechanicalKnowledge: 'know',
      filtrationType: 'Sand',
      selectedFilterModelIds: ['flt-hay-hcf434'],
      filterCount: 6,
      sanitationType: 'Liquid Chlorine',
      chemicalControl: 'Advanced (CAT 5000)',
      secondarySanitation: ['Ozone System', 'Ultraviolet Light System'],
      phBuffer: 'CO2',
      heatingSystem: ['Gas Heater', 'Solar'],
      poolEnvironment: 'outdoor',
      finishType: 'Tile',
      tileBandHeight: 'Full',
      stairNosingDetail: 'Contrasting',
      poolFeatures: ['ADA Pool Lift', 'Hand Rails'],
      waterFeatures: ['Laminar Jets'],
    },
    activity: [
      { kind: 'export', title: 'Sent customer package', detail: 'Renovation package sent to club board.' },
      { kind: 'bom', title: 'Major equipment orders active', detail: 'Filters, controllers, and plumbing are on order.', target: 'Procurement' },
    ],
  }),
  'meyer-backyard': makeProfile('meyer-backyard', {
    filePrefix: 'Meyer_Plunge',
    saveVersions: ['v1.6', 'v1.5'],
    costMultiplier: 0.38,
    qtyMultiplier: 0.28,
    defaultStatus: 'purchased',
    engineeringFlowAddGpm: 4,
    preset: {
      expectedBuildDate: '2026-05-01',
      localCodeAwareness: 'yes',
      codeStandards: ['ispsc-2021'],
      customCodes: ['Denver residential setback confirmed'],
      projectType: 'New Construction',
      poolUseType: 'Residential',
      poolSections: [
        { id: 'meyer-plunge', label: 'Plunge body', type: 'open-area', area: 78, depth: 4.2 },
        { id: 'meyer-bench', label: 'Bench', type: 'bench', area: 18, depth: 2.2 },
      ],
      deckSf: 180,
      gutterStyle: 'skimmer-12-coping',
      copingStyle: 'Bull Nose',
      mechanicalKnowledge: 'know',
      filtrationType: 'Cartridge',
      selectedFilterModelIds: ['flt-pen-cc420'],
      filterCount: 1,
      sanitationType: 'Saltwater Chlorine Generator',
      chemicalControl: 'No Chemical Control',
      phBuffer: 'No pH Buffer',
      heatingSystem: ['Heat Pump'],
      finishType: 'Plaster',
      waterFeatures: ['Bubbler'],
      isFinalized: true,
    },
    activity: [
      { kind: 'saved', title: 'Final package saved', detail: 'All procurement items received and archived.' },
      { kind: 'bom', title: 'Procurement completed', detail: 'All project orders received.', target: 'Procurement' },
    ],
  }),
  'sunrise-wellness': makeProfile('sunrise-wellness', {
    filePrefix: 'Sunrise_Wellness',
    saveVersions: ['v1.2', 'v1.1'],
    costMultiplier: 1.05,
    qtyMultiplier: 0.9,
    defaultStatus: 'to-purchase',
    statusById: {
      shell: 'purchased',
      rebar: 'purchased',
      filter: 'on-order',
      pump: 'on-order',
      heater: 'on-order',
      chemController: 'on-order',
      tileBand: 'to-purchase',
    },
    engineeringFlowAddGpm: 16,
    preset: {
      expectedBuildDate: '2026-10-01',
      localCodeAwareness: 'no',
      codeStandards: [],
      customCodes: [],
      projectType: 'Addition',
      poolUseType: 'Therapeutic Small',
      poolSections: [
        { id: 'sunrise-lap', label: 'Lap lane', type: 'open-area', area: 250, depth: 4.4 },
        { id: 'sunrise-spa', label: 'Recovery spa', type: 'open-area', area: 70, depth: 3.6 },
        { id: 'sunrise-steps', label: 'Therapy steps', type: 'stairs', area: 20, depth: 2.2 },
      ],
      deckSf: 700,
      gutterStyle: 'concrete-deck-level',
      copingStyle: 'Flat',
      mechanicalKnowledge: 'help',
      mechanicalPriorities: ['Budget', 'Low Maintenance'],
      filtrationType: 'Cartridge',
      selectedFilterModelIds: ['flt-pen-cc520'],
      filterCount: 2,
      sanitationType: 'Liquid Chlorine',
      chemicalControl: 'Mid (CAT 3500/4000)',
      secondarySanitation: ['Ultraviolet Light System'],
      phBuffer: 'CO2',
      heatingSystem: ['Gas Heater'],
      poolEnvironment: 'indoor',
      finishType: 'Tile',
      tileBandHeight: '6"',
      stairNosingDetail: 'Contrasting',
      poolFeatures: ['ADA Pool Lift', 'Hand Rails'],
      waterFeatures: ['Bubbler'],
    },
    activity: [
      { kind: 'config', title: 'Therapy program added', detail: 'Recovery spa included with lap lane.', target: 'Pool Use Type' },
      { kind: 'bom', title: 'Mechanical package ordered', detail: 'Filter, pump, heater, and controller moved to active orders.', target: 'Procurement' },
    ],
  }),
};

export function getProjectProfile(project: MockProject): ProjectProfile {
  return MOCK_PROJECT_PROFILES[project.id] ?? {
    preset: mockProjectToPreset(project),
    projectItems: cloneProjectItems(DEFAULT_PROJECT_ITEMS),
    projectFiles: [],
    activityLog: [],
    engineeringFlowAddGpm: null,
  };
}
