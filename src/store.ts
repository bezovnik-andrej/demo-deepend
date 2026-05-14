import { createContext, useContext } from 'react';
import { getOptionCost } from './data/configCosts';
import { FILTER_CATALOG } from './data/equipmentCatalog';
import { DEFAULT_PROJECT_ITEMS, cloneProjectItems } from './data/projectItems';
import { SEED_FILES, SEED_ACTIVITY } from './data/projectHistory';
import type { ProjectFile, ActivityEvent } from './data/projectHistory';
import {
  loadCompanyCatalogFromStorage,
  persistCompanyCatalog,
  expandCatalogTemplatesForInsert,
  projectItemFromCatalogWithMultiplier,
} from './data/companyCatalog';
import { DEFAULT_POOL_SECTIONS, makeEmptyPoolSection } from './data/poolSections';
import { computeDesignGpm } from './data/designGpm';
import { planInlets } from './data/inletPlanning';
import { getRecirculationLabels } from './data/recirculationOptions';
import { STEP_DEFINITIONS } from './types';
import type { AppState, AppAction, ProjectData, ProjectItem, InletStrategy } from './types';
import type { ProjectTemplate } from './data/projectTemplates';

function updateItemInTree(items: ProjectItem[], id: string, patch: Partial<ProjectItem>): ProjectItem[] {
  return items.map((item) => {
    if (item.id === id) return { ...item, ...patch };
    if (item.children?.length) {
      return { ...item, children: updateItemInTree(item.children, id, patch) };
    }
    return item;
  });
}

function findItemById(items: ProjectItem[], id: string): ProjectItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const inner = findItemById(item.children, id);
      if (inner) return inner;
    }
  }
  return null;
}

/** Wall / floor return counts from `planInlets`, respecting per-row freeze. */
function syncInletBomLine(
  items: ProjectItem[],
  data: ProjectData,
  engineeringFlowAddGpm: number | null,
): ProjectItem[] {
  const { designGpm } = computeDesignGpm(data, engineeringFlowAddGpm);
  const strategy: InletStrategy = data.inletStrategy ?? 'auto-shelf';
  const plan = planInlets(data.poolSections, strategy, designGpm);
  let next = items;
  const wall = findItemById(next, 'wallReturns');
  const floor = findItemById(next, 'floorReturns');
  if (wall && !wall.autoEngineeringFrozen) {
    next = updateItemInTree(next, 'wallReturns', { qty: plan.wallReturns });
  }
  if (floor && !floor.autoEngineeringFrozen) {
    next = updateItemInTree(next, 'floorReturns', { qty: plan.floorReturns });
  }
  return next;
}

function seedBudgetCostsFromActual(items: ProjectItem[]): ProjectItem[] {
  return items.map((item) => {
    if (item.children?.length) {
      return { ...item, children: seedBudgetCostsFromActual(item.children) };
    }
    if (!item.partNo) return item;
    const budgetCost = item.qty * (item.price + (item.markup ?? 0));
    return { ...item, budgetCost };
  });
}

function setAllVisibility(items: ProjectItem[], visible: boolean): ProjectItem[] {
  return items.map((item) => ({
    ...item,
    visible,
    ...(item.children?.length ? { children: setAllVisibility(item.children, visible) } : {}),
  }));
}

/** Keeps the mechanical "filter" BOM line aligned with configurator filtration choices so cost summaries update live. */
function syncFilterBomLine(items: ProjectItem[], data: ProjectData): ProjectItem[] {
  const ft = data.filtrationType;
  if (!ft) return items;

  const selectedIds = data.selectedFilterModelIds ?? [];
  const qtyById = data.filterCatalogQtyByModelId ?? {};

  if (selectedIds.length > 0) {
    let totalPrice = 0;
    const modelLabels: string[] = [];
    const brands = new Set<string>();
    const partNos: string[] = [];
    let allMatchMedia = true;

    for (const id of selectedIds) {
      const product = FILTER_CATALOG.find((f) => f.id === id);
      if (product && product.mediaType === ft) {
        const qty = qtyById[id] ?? 1;
        totalPrice += product.price * qty;
        modelLabels.push(qty > 1 ? `${product.model} ×${qty}` : product.model);
        brands.add(product.brand);
        partNos.push(product.partNo);
      } else {
        allMatchMedia = false;
      }
    }

    if (totalPrice > 0 && allMatchMedia) {
      return updateItemInTree(items, 'filter', {
        price: totalPrice,
        partNo: partNos.length === 1 ? partNos[0] : 'MULTI',
        brand: brands.size === 1 ? [...brands][0] : 'Various',
        description: modelLabels.join(', ') + ` — ${ft}`,
        name: 'Filter System',
      });
    }
  }

  const opt = getOptionCost('filtrationType', ft);
  const price = opt?.cost ?? 1200;
  const desc = opt?.note
    ? `${opt.note} — pick a tank model to refine pricing`
    : 'Filter system — pick a tank model to refine pricing';

  return updateItemInTree(items, 'filter', {
    price,
    description: desc,
    partNo: '—',
    brand: '—',
  });
}

type LegacyPreset = Partial<Omit<ProjectData, 'gutterStyle'>> & {
  gutterStyle?: string | string[] | null;
};

function normalizeGutterStyle(value: LegacyPreset['gutterStyle']): string | null {
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === 'string' && v.trim() !== '');
    return first ?? null;
  }
  if (typeof value === 'string' && value.trim() !== '') return value;
  return null;
}

function normalizePreset(preset: LegacyPreset): Partial<ProjectData> {
  const next: Partial<ProjectData> = { ...preset, gutterStyle: normalizeGutterStyle(preset.gutterStyle) };
  return next;
}

export const DEFAULT_DATA: ProjectData = {
  projectName: 'Hillcrest Aquatic Center',
  clientCompanyName: 'Hillcrest Community District',
  clientContactName: 'Sarah Martinez',
  clientContactEmail: 'smartinez@hillcrestcd.org',
  ownerName: 'Hillcrest Community District',
  ownerAddress: '1200 Main Street, Dallas, TX 75201',
  projectAddress: '4200 Lakewood Blvd',
  projectCity: 'Dallas',
  projectState: 'TX',
  projectZip: '75214',
  ownerCrmLink: 'hillcrest-aquatics-HCA2026',
  projectType: 'New Construction',
  localCodeAwareness: 'yes',
  localCodeNotes: '',
  codeStandards: ['ispsc-2021', 'tx-tac-265-l'],
  customCodes: [],
  poolUseType: 'Public Pool',
  poolSections: DEFAULT_POOL_SECTIONS.map((s) => ({ ...s })),
  deckSf: 1500,
  numDivingBoards: 1,
  divingBoardExclusionSf: 300,
  deckDivingWizardOverride: false,
  // ── Pool Design ──
  // SS deck-level gutter pairs naturally with a flat coping for code-compliant
  // commercial pools. Cantilevered would also work but reads "residential."
  gutterStyle: 'ss-deck-level',
  copingStyle: 'Flat',
  // ── Mechanical Systems ──
  // Engineer-led project (knows their systems), so MechanicalPriorities is
  // hidden and we don't seed it.
  mechanicalKnowledge: 'know',
  mechanicalBrandPreference: '',
  mechanicalPriorities: [],
  brandPreferences: {
    filtration: null,
    sanitation: null,
    heating: null,
    pump: null,
    controller: null,
    lighting: null,
  },
  // For ~100k gal commercial, sand is the workhorse — cheaper than DE,
  // higher throughput than cartridge, fits a Class B public pool.
  filtrationType: 'Sand',
  selectedFilterModelIds: [],
  filterCount: 3,
  filterCatalogQtyByModelId: {},
  filterDesignRateGpmPerSf: null,
  filterBackwashRateGpmPerSf: null,
  filterSewerCapacityGpm: 200,
  filterSewerLineNominalIn: null,
  retentionDisposalMode: 'retention',
  filterRetentionTimeMin: 6,
  filterRetentionPitLengthFt: 7,
  filterRetentionPitWidthFt: 7,
  filterRetentionPitDepthFt: 6,
  // Liquid chlorine is the default primary sanitizer for public pools — ORP
  // controllable, code-friendly residual.
  sanitationType: 'Liquid Chlorine',
  // CAT 3500/4000 mid-tier is the right fit: pH + ORP + free-Cl, without the
  // cost of a 5000.
  chemicalControl: 'Mid (CAT 3500/4000)',
  // UV polishing is increasingly standard / required for indoor commercial
  // pools and recommended outdoors. Ozone left off to keep the equipment
  // pad reasonable for a 100k gal pool.
  secondarySanitation: ['Ultraviolet Light System'],
  secondarySanitationMode: 'auto',
  // CO₂ is gentler on equipment than acid and standard for commercial.
  phBuffer: 'CO2',
  // Gas heater — most common in TX, where natural gas is plentiful.
  heatingSystem: ['Gas Heater'],
  // Dallas outdoor pool — coldest-month sizing scenario.
  poolEnvironment: 'outdoor',
  heaterScenario: 'coldest-month',
  heaterTargetWaterTempF: 82,
  heaterStartWaterTempF: 55,
  heaterAmbientTempF: 36,
  heaterWindMph: 8,
  heaterFillWaterTempF: 55,
  heaterHeatUpDays: 2,
  heaterEfficiencyPct: 84,
  selectedHeaterBtu: null,
  // ── Finishes ──
  // Tile is the durable choice for commercial; 6" tile band at the waterline
  // is the typical detail with matching stair nosing.
  finishType: 'Tile',
  tileBandHeight: '6"',
  customTileHeight: '',
  stairNosingDetail: 'Contrasting',
  waterlineTileEnabled: true,
  waterlineBandInches: 6,
  waterlineTileSizeLabel: '6×6',
  waterlinePickMode: 'unknown',
  waterlinePriceTier: 'high',
  waterlineBandCustomInches: '',
  waterlineTileSizeCustom: '',
  waterlineTileColorNotes: '',
  allTilePool: true,
  applyWaterlineTileToBody: true,
  bodyTileBandInches: 6,
  bodyTileBandCustomInches: '',
  bodyTileSizeLabel: '6×6',
  bodyTileSizeCustom: '',
  bodyTilePickMode: 'unknown',
  bodyTilePriceTier: 'high',
  bodyTileColorNotes: '',
  finishBrand: null,
  finishProductLine: null,
  finishColorName: null,
  // ── Features ──
  // Bubbler at the entry stairs is a common modern accent in public pools.
  waterFeatures: ['Bubbler'],
  // ADA pool lift is required by federal accessibility law for public pools;
  // hand rails are a standard safety inclusion.
  poolFeatures: ['ADA Pool Lift', 'Hand Rails'],
  isFinalized: false,
  batherLoadSqFtPerPerson: null,
  batherLoadUsageMultiplier: null,
  turnoverHoursOverride: null,
  designSuctionFps: null,
  designReturnFps: null,
  inletStrategy: 'auto-shelf',
  expectedBuildDate: null,
  pdfUnderlay: null,
  estimatingMode: false,
  estimateStatus: 'draft',
};

function createBlankProjectData(): ProjectData {
  return {
    ...DEFAULT_DATA,
    projectName: '',
    clientCompanyName: '',
    clientContactName: '',
    clientContactEmail: '',
    ownerName: '',
    ownerAddress: '',
    projectAddress: '',
    projectCity: '',
    projectState: '',
    projectZip: '',
    ownerCrmLink: '',
    projectType: null,
    localCodeAwareness: null,
    localCodeNotes: '',
    codeStandards: [],
    customCodes: [],
    poolUseType: null,
    poolSections: [makeEmptyPoolSection('Main pool')],
    deckSf: 0,
    numDivingBoards: 0,
    divingBoardExclusionSf: 300,
    deckDivingWizardOverride: false,
    gutterStyle: null,
    copingStyle: null,
    mechanicalKnowledge: null,
    mechanicalBrandPreference: '',
    mechanicalPriorities: [],
    brandPreferences: {
      filtration: null,
      sanitation: null,
      heating: null,
      pump: null,
      controller: null,
      lighting: null,
    },
    filtrationType: null,
    selectedFilterModelIds: [],
    filterCount: 1,
    filterCatalogQtyByModelId: {},
    filterDesignRateGpmPerSf: null,
    filterBackwashRateGpmPerSf: null,
    filterSewerCapacityGpm: 0,
    filterSewerLineNominalIn: null,
    retentionDisposalMode: 'retention',
    filterRetentionTimeMin: 6,
    filterRetentionPitLengthFt: 0,
    filterRetentionPitWidthFt: 0,
    filterRetentionPitDepthFt: 0,
    sanitationType: null,
    chemicalControl: null,
    secondarySanitation: [],
    secondarySanitationMode: 'auto',
    phBuffer: null,
    heatingSystem: [],
    poolEnvironment: 'outdoor',
    heaterScenario: 'coldest-month',
    heaterTargetWaterTempF: 82,
    heaterStartWaterTempF: 55,
    heaterAmbientTempF: 36,
    heaterWindMph: 8,
    heaterFillWaterTempF: 55,
    heaterHeatUpDays: 2,
    heaterEfficiencyPct: 84,
    selectedHeaterBtu: null,
    finishType: null,
    tileBandHeight: null,
    customTileHeight: '',
    stairNosingDetail: null,
    waterlineTileEnabled: false,
    waterlineBandInches: 6,
    waterlineTileSizeLabel: '6×6',
    waterlinePickMode: 'unknown',
    waterlinePriceTier: 'high',
    waterlineBandCustomInches: '',
    waterlineTileSizeCustom: '',
    waterlineTileColorNotes: '',
    allTilePool: false,
    applyWaterlineTileToBody: false,
    bodyTileBandInches: 6,
    bodyTileBandCustomInches: '',
    bodyTileSizeLabel: '6×6',
    bodyTileSizeCustom: '',
    bodyTilePickMode: 'unknown',
    bodyTilePriceTier: 'high',
    bodyTileColorNotes: '',
    finishBrand: null,
    finishProductLine: null,
    finishColorName: null,
    waterFeatures: [],
    poolFeatures: [],
    isFinalized: false,
    batherLoadSqFtPerPerson: null,
    batherLoadUsageMultiplier: null,
    turnoverHoursOverride: null,
    designSuctionFps: null,
    designReturnFps: null,
    inletStrategy: 'auto-shelf',
    expectedBuildDate: null,
    pdfUnderlay: null,
    estimatingMode: false,
    estimateStatus: 'draft',
  };
}

function createProjectData(preset: LegacyPreset = {}): ProjectData {
  const blank = createBlankProjectData();
  const normalizedPreset = normalizePreset(preset);
  return {
    ...blank,
    ...normalizedPreset,
    poolSections: normalizedPreset.poolSections
      ? normalizedPreset.poolSections.map((s) => ({ ...s }))
      : blank.poolSections,
    gutterStyle: normalizedPreset.gutterStyle ?? blank.gutterStyle,
    codeStandards: normalizedPreset.codeStandards ? [...normalizedPreset.codeStandards] : [],
    customCodes: normalizedPreset.customCodes ? [...normalizedPreset.customCodes] : [],
    mechanicalPriorities: normalizedPreset.mechanicalPriorities ? [...normalizedPreset.mechanicalPriorities] : [],
    secondarySanitation: normalizedPreset.secondarySanitation ? [...normalizedPreset.secondarySanitation] : [],
    heatingSystem: normalizedPreset.heatingSystem ? [...normalizedPreset.heatingSystem] : [],
    waterFeatures: normalizedPreset.waterFeatures ? [...normalizedPreset.waterFeatures] : [],
    poolFeatures: normalizedPreset.poolFeatures ? [...normalizedPreset.poolFeatures] : [],
    brandPreferences: {
      ...blank.brandPreferences,
      ...(normalizedPreset.brandPreferences ?? {}),
    },
    isFinalized: normalizedPreset.isFinalized ?? false,
    inletStrategy: (normalizedPreset as Partial<ProjectData>).inletStrategy ?? blank.inletStrategy,
    expectedBuildDate:
      (normalizedPreset as Partial<ProjectData>).expectedBuildDate ?? blank.expectedBuildDate,
    pdfUnderlay: (normalizedPreset as Partial<ProjectData>).pdfUnderlay ?? blank.pdfUnderlay,
    estimatingMode:
      (normalizedPreset as Partial<ProjectData>).estimatingMode ?? blank.estimatingMode,
    estimateStatus:
      (normalizedPreset as Partial<ProjectData>).estimateStatus ?? blank.estimateStatus,
  };
}

const getStoredTheme = (): AppState['theme'] => {
  try {
    const s = localStorage.getItem('norveo-theme');
    if (s === 'light' || s === 'dark') return s;
  } catch {
    /* ignore */
  }
  return 'dark';
};

function getStoredUserTemplates(): ProjectTemplate[] {
  try {
    const raw = localStorage.getItem('norveo-user-templates');
    if (raw) {
      const templates = JSON.parse(raw) as ProjectTemplate[];
      return templates.map((template) => ({
        ...template,
        preset: normalizePreset(template.preset as LegacyPreset),
      }));
    }
  } catch { /* ignore */ }
  return [];
}

function persistUserTemplates(templates: ProjectTemplate[]) {
  try {
    localStorage.setItem('norveo-user-templates', JSON.stringify(templates));
  } catch { /* ignore */ }
}

const COMPANY_CATALOG_GROUP_ID = 'companyCatalogLines';

function ensureCompanyCatalogGroup(items: ProjectItem[]): ProjectItem[] {
  if (items.some((i) => i.id === COMPANY_CATALOG_GROUP_ID)) return items;
  return [
    ...items,
    {
      id: COMPANY_CATALOG_GROUP_ID,
      name: 'Additional costs',
      category: 'Company',
      color: '#7e57c2',
      qty: 0,
      unit: '',
      price: 0,
      visible: true,
      partNo: '',
      brand: '',
      description: 'Lines added from the company catalog',
      supplier: '',
      status: 'to-purchase' as const,
      interaction: 'movable' as const,
      children: [],
    },
  ];
}

function appendChildrenToGroup(items: ProjectItem[], groupId: string, newLeaves: ProjectItem[]): ProjectItem[] {
  return items.map((node) => {
    if (node.id === groupId) {
      return { ...node, children: [...(node.children ?? []), ...newLeaves] };
    }
    if (node.children?.length) {
      return { ...node, children: appendChildrenToGroup(node.children, groupId, newLeaves) };
    }
    return node;
  });
}

export const INITIAL_STATE: AppState = {
  activeWorkspace: 'configurator',
  activeStep: null,
  configDrawerOpen: false,
  expandedGroups: ['Project Information', 'Local Code', 'Pool Volumes', 'Pool Design', 'Mechanical Systems', 'Finishes', 'Features', 'Review'],
  authoringMode: 'geometry',
  activeTool: 'select',
  canvasLayerView: 'all',
  zoom: 100,
  gridEnabled: true,
  snapEnabled: true,
  showDimensions: true,
  userMode: 'engineer',
  theme: getStoredTheme(),
  engineeringFlowAddGpm: null,
  data: DEFAULT_DATA,
  wizardPhase: 'landing',
  isDirty: false,
  appliedTemplatePreset: null,
  projectItems: syncInletBomLine(cloneProjectItems(DEFAULT_PROJECT_ITEMS), DEFAULT_DATA, null),
  userTemplates: getStoredUserTemplates(),
  filesView: 'browse',
  projectFiles: [...SEED_FILES],
  activityLog: [...SEED_ACTIVITY],
  selectedFileId: null,
  companyCatalogTemplates: loadCompanyCatalogFromStorage(),
  engineeringSubView: 'calculations',
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_WORKSPACE':
      return {
        ...state,
        activeWorkspace: action.workspace,
        engineeringSubView:
          action.workspace === 'engineering' ? state.engineeringSubView : 'calculations',
      };
    case 'SET_ENGINEERING_SUB_VIEW':
      return { ...state, engineeringSubView: action.view };
    case 'SET_FILES_VIEW':
      return {
        ...state,
        activeWorkspace: 'files',
        filesView: action.view,
        /* History tab is not the folder tree; clear stale file handoff when switching there. */
        selectedFileId: action.view === 'activity' ? null : state.selectedFileId,
      };
    case 'SELECT_FILE':
      return {
        ...state,
        activeWorkspace: 'files',
        /* Opening a file always lands in Folders; clearing selection must not clobber History. */
        filesView: action.fileId !== null ? 'browse' : state.filesView,
        selectedFileId: action.fileId,
      };
    case 'ADD_PROJECT_FILES': {
      const now = new Date().toISOString();
      const added: ProjectFile[] = action.items.map((it, i) => ({
        id: `f-up-${Date.now()}-${i}`,
        folderId: it.folderId,
        filename: it.filename,
        mimeType: it.mimeType,
        sizeBytes: it.sizeBytes,
        version: 'upload',
        savedBy: 'jordan',
        savedAt: now,
        notes: 'Uploaded (demo: metadata only; file is not stored on a server).',
      }));
      return {
        ...state,
        projectFiles: [...added, ...state.projectFiles],
        isDirty: true,
      };
    }
    case 'SET_COMPANY_CATALOG': {
      persistCompanyCatalog(action.templates);
      return { ...state, companyCatalogTemplates: action.templates };
    }
    case 'ADD_CATALOG_LINES_TO_PROJECT': {
      if (state.data.isFinalized) return state;
      const expanded = expandCatalogTemplatesForInsert(
        action.templateIds,
        state.companyCatalogTemplates,
      );
      if (expanded.length === 0) return state;
      const newLeaves = expanded.map(({ template, assemblyMultiplier }) =>
        projectItemFromCatalogWithMultiplier(
          template,
          state.data,
          state.projectItems,
          assemblyMultiplier,
        ),
      );
      let nextItems = ensureCompanyCatalogGroup(state.projectItems);
      nextItems = appendChildrenToGroup(nextItems, COMPANY_CATALOG_GROUP_ID, newLeaves);
      return { ...state, projectItems: nextItems, isDirty: true };
    }
    case 'PUBLISH_CATALOG_TEMPLATE': {
      if (state.userMode !== 'companyAdmin') return state;
      const now = new Date().toISOString();
      let detail = '';
      let ver = 0;
      const next = state.companyCatalogTemplates.map((t) => {
        if (t.id !== action.id) return t;
        ver = (t.version ?? 0) + 1;
        detail = t.name;
        return { ...t, status: 'active' as const, version: ver, lastPublishedAt: now };
      });
      persistCompanyCatalog(next);
      const newEvent: ActivityEvent = {
        id: `a-cat-${Date.now()}`,
        kind: 'catalog',
        authorId: 'jordan',
        at: now,
        title: `Published company catalog line v${ver}`,
        detail,
        target: action.id,
      };
      return {
        ...state,
        companyCatalogTemplates: next,
        activityLog: [newEvent, ...state.activityLog],
      };
    }
    case 'REFRESH_CATALOG_LINE': {
      if (state.data.isFinalized) return state;
      const item = findItemById(state.projectItems, action.id);
      if (!item?.catalogTemplateId) return state;
      const tpl = state.companyCatalogTemplates.find((x) => x.id === item.catalogTemplateId);
      if (!tpl || tpl.status !== 'active' || tpl.kind === 'assembly') return state;
      const fresh = projectItemFromCatalogWithMultiplier(
        tpl,
        state.data,
        state.projectItems,
        1,
        action.id,
      );
      return {
        ...state,
        projectItems: updateItemInTree(state.projectItems, action.id, {
          qty: fresh.qty,
          unit: fresh.unit,
          price: fresh.price,
          markup: fresh.markup,
          name: fresh.name,
          description: fresh.description,
          category: fresh.category,
          partNo: fresh.partNo,
          catalogTemplateVersion: fresh.catalogTemplateVersion,
          catalogLaborUnit: fresh.catalogLaborUnit,
          catalogEquipUnit: fresh.catalogEquipUnit,
          catalogMatUnit: fresh.catalogMatUnit,
        }),
        isDirty: true,
      };
    }
    case 'SAVE_PROJECT': {
      const slug = (state.data.projectName || 'project')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const planFiles = state.projectFiles.filter((f) => f.folderId === 'plan-sets');
      const latestVersion = planFiles.length > 0
        ? planFiles.reduce((a, b) => (a.savedAt > b.savedAt ? a : b)).version
        : 'v0.0';
      const [maj, min] = latestVersion.replace('v', '').split('.').map(Number);
      const nextVersion = `v${maj}.${min + 1}`;
      const now = new Date().toISOString();
      const fileId = `f-save-${Date.now()}`;
      const newFile: ProjectFile = {
        id: fileId,
        folderId: 'plan-sets',
        filename: `${slug}-plan-${nextVersion}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 2500000 + Math.floor(Math.random() * 500000),
        version: nextVersion,
        savedBy: 'jordan',
        savedAt: now,
        notes: `Auto-save ${nextVersion}`,
      };
      const newEvent: ActivityEvent = {
        id: `a-save-${Date.now()}`,
        kind: 'saved',
        authorId: 'jordan',
        at: now,
        title: `Saved ${nextVersion}`,
        detail: `1 file · ${(newFile.sizeBytes / 1048576).toFixed(1)} MB`,
        fileId,
      };
      return {
        ...state,
        projectFiles: [newFile, ...state.projectFiles],
        activityLog: [newEvent, ...state.activityLog],
        isDirty: false,
      };
    }
    case 'SET_STEP':
      return { ...state, activeStep: action.step };
    case 'START_NEW_PROJECT': {
      const blank = createBlankProjectData();
      return {
        ...state,
        wizardPhase: 'template',
        activeWorkspace: 'configurator',
        activeStep: null,
        configDrawerOpen: false,
        appliedTemplatePreset: null,
        engineeringFlowAddGpm: null,
        data: blank,
        projectItems: syncInletBomLine(cloneProjectItems(DEFAULT_PROJECT_ITEMS), blank, null),
        projectFiles: [],
        activityLog: [],
        selectedFileId: null,
        filesView: 'browse',
        isDirty: false,
      };
    }
    case 'START_CHAT':
      return {
        ...state,
        wizardPhase: 'chat',
        appliedTemplatePreset: null,
        data: createBlankProjectData(),
        isDirty: false,
      };
    case 'START_CHAT_WITH_PRESET': {
      if (state.data.isFinalized) return state;
      const { preset } = action;
      const base = createProjectData(preset);
      const identityKeys: (keyof ProjectData)[] = [
        'projectName', 'clientCompanyName', 'clientContactName', 'clientContactEmail',
        'ownerName', 'ownerAddress', 'projectAddress', 'projectCity', 'projectState',
        'projectZip', 'ownerCrmLink',
      ];
      const merged: ProjectData = { ...base };
      for (const key of identityKeys) {
        if (!(key in preset)) {
          (merged as Record<keyof ProjectData, ProjectData[keyof ProjectData]>)[key] = state.data[key];
        }
      }
      return {
        ...state,
        wizardPhase: 'chat',
        appliedTemplatePreset: { ...preset },
        data: merged,
        isDirty: false,
      };
    }
    case 'FINISH_WIZARD':
    case 'SKIP_WIZARD': {
      if (state.wizardPhase !== 'wizard' && state.wizardPhase !== 'chat') return state;
      /* Chat covers the essentials; remaining fields are refined in the in-app
         Configurator page, not a separate step-by-step wizard. */
      return {
        ...state,
        wizardPhase: 'workspace',
        activeWorkspace: 'configurator',
        configDrawerOpen: false,
        activeStep: null,
      };
    }
    case 'OPEN_CONFIG_DRAWER':
      return { ...state, configDrawerOpen: true, activeStep: action.step };
    case 'CLOSE_CONFIG_DRAWER':
      return { ...state, configDrawerOpen: false };
    case 'NAVIGATE_TO_STEP':
      return {
        ...state,
        activeWorkspace: 'configurator',
        activeStep: action.step,
        configDrawerOpen: false,
      };
    case 'TOGGLE_GROUP': {
      const groups = state.expandedGroups.includes(action.group)
        ? state.expandedGroups.filter((g) => g !== action.group)
        : [...state.expandedGroups, action.group];
      return { ...state, expandedGroups: groups };
    }
    case 'UPDATE_DATA': {
      if (state.data.isFinalized) return state;
      const nextData = { ...state.data, ...action.payload };
        const shouldSyncFilter =
        'filtrationType' in action.payload || 'selectedFilterModelIds' in action.payload;
      let nextItems = shouldSyncFilter ? syncFilterBomLine(state.projectItems, nextData) : state.projectItems;
      nextItems = syncInletBomLine(nextItems, nextData, state.engineeringFlowAddGpm);
      return {
        ...state,
        data: nextData,
        projectItems: nextItems,
        isDirty: true,
      };
    }
    case 'TOGGLE_FINALIZE':
      return { ...state, data: { ...state.data, isFinalized: !state.data.isFinalized } };
    case 'SET_AUTHORING_MODE':
      return { ...state, authoringMode: action.mode, activeTool: 'select' };
    case 'SET_ACTIVE_TOOL':
      return { ...state, activeTool: action.tool };
    case 'SET_CANVAS_LAYER_VIEW':
      return { ...state, canvasLayerView: action.view };
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(25, Math.min(400, action.zoom)) };
    case 'TOGGLE_GRID':
      return { ...state, gridEnabled: !state.gridEnabled };
    case 'TOGGLE_SNAP':
      return { ...state, snapEnabled: !state.snapEnabled };
    case 'TOGGLE_DIMENSIONS':
      return { ...state, showDimensions: !state.showDimensions };
    case 'SET_USER_MODE': {
      const userMode = action.mode === 'companyAdmin' ? 'companyAdmin' : 'engineer';
      return { ...state, userMode };
    }
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_ENGINEERING_FLOW_ADD_GPM':
      if (state.data.isFinalized) return state;
      return {
        ...state,
        engineeringFlowAddGpm: action.gpm,
        projectItems: syncInletBomLine(state.projectItems, state.data, action.gpm),
      };
    case 'UPDATE_PROJECT_ITEM': {
      let { patch } = action;
      if (
        (action.id === 'wallReturns' || action.id === 'floorReturns') &&
        patch.qty !== undefined
      ) {
        patch = { ...patch, autoEngineeringFrozen: true };
      }
      return {
        ...state,
        projectItems: updateItemInTree(state.projectItems, action.id, patch),
        isDirty: true,
      };
    }
    case 'RESYNC_INLET_COUNTS': {
      if (state.data.isFinalized) return state;
      let items = state.projectItems;
      items = updateItemInTree(items, 'wallReturns', { autoEngineeringFrozen: false });
      items = updateItemInTree(items, 'floorReturns', { autoEngineeringFrozen: false });
      items = syncInletBomLine(items, state.data, state.engineeringFlowAddGpm);
      return { ...state, projectItems: items, isDirty: true };
    }
    case 'SET_ALL_BUDGETS_FROM_ACTUAL':
      return {
        ...state,
        projectItems: seedBudgetCostsFromActual(state.projectItems),
        isDirty: true,
      };
    case 'TOGGLE_ALL_ITEMS_VISIBILITY':
      return {
        ...state,
        projectItems: setAllVisibility(state.projectItems, action.visible),
      };
    case 'APPLY_WORKSPACE_TEMPLATE': {
      if (state.data.isFinalized) return state;
      const { preset } = action;
      const base = createProjectData(preset);
      const identityKeys: (keyof ProjectData)[] = [
        'projectName',
        'clientCompanyName',
        'projectAddress',
        'projectCity',
        'projectState',
        'projectZip',
        'ownerCrmLink',
      ];
      const merged: ProjectData = { ...base };
      for (const key of identityKeys) {
        if (!(key in preset)) {
          (merged as Record<keyof ProjectData, ProjectData[keyof ProjectData]>)[key] = state.data[key];
        }
      }
      const visibleSteps = STEP_DEFINITIONS.filter((s) => s.isVisible(merged));
      const firstStep = visibleSteps.find((s) => !s.isComplete(merged)) ?? visibleSteps[0] ?? STEP_DEFINITIONS[0];
      const templatedItems = syncInletBomLine(state.projectItems, merged, state.engineeringFlowAddGpm);

      return {
        ...state,
        wizardPhase: 'wizard',
        appliedTemplatePreset: { ...preset },
        data: merged,
        projectItems: templatedItems,
        configDrawerOpen: false,
        activeStep: firstStep.id,
      };
    }
    case 'SAVE_AS_TEMPLATE': {
      const { data } = state;
      const configKeys: (keyof ProjectData)[] = [
        'projectType', 'poolUseType', 'gutterStyle', 'copingStyle',
        'mechanicalKnowledge', 'mechanicalBrandPreference', 'mechanicalPriorities',
        'filtrationType', 'sanitationType', 'heatingSystem', 'finishType',
        'tileBandHeight', 'customTileHeight', 'stairNosingDetail',
        'waterlineTileEnabled', 'waterlineBandInches', 'waterlineBandCustomInches',
        'waterlineTileSizeLabel', 'waterlineTileSizeCustom', 'waterlinePickMode', 'waterlinePriceTier',
        'waterlineTileColorNotes', 'allTilePool', 'applyWaterlineTileToBody',
        'bodyTileBandInches', 'bodyTileBandCustomInches', 'bodyTileSizeLabel', 'bodyTileSizeCustom',
        'bodyTilePickMode', 'bodyTilePriceTier', 'bodyTileColorNotes',
        'waterFeatures',
        'batherLoadSqFtPerPerson', 'batherLoadUsageMultiplier',
        'turnoverHoursOverride', 'designSuctionFps', 'designReturnFps',
      ];
      const preset: Partial<ProjectData> = {};
      for (const key of configKeys) {
        const val = data[key];
        if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
          (preset as Record<string, unknown>)[key] = val;
        }
      }
      const tpl: ProjectTemplate = {
        id: `user-${Date.now()}`,
        name: action.name,
        desc: `Saved from ${data.projectName || 'project'} — ${data.poolUseType || 'pool'}, ${getRecirculationLabels(data.gutterStyle).join(', ') || 'unknown recirculation'}`,
        icon: null as unknown as ProjectTemplate['icon'],
        preset,
        isUserTemplate: true,
      };
      const updated = [...state.userTemplates, tpl];
      persistUserTemplates(updated);
      return { ...state, userTemplates: updated };
    }
    case 'DELETE_USER_TEMPLATE': {
      const updated = state.userTemplates.filter((t) => t.id !== action.id);
      persistUserTemplates(updated);
      return { ...state, userTemplates: updated };
    }
    case 'OPEN_PROJECT': {
      const { profile } = action;
      const merged = createProjectData(profile.preset);
      const openedItems = syncInletBomLine(
        cloneProjectItems(profile.projectItems),
        merged,
        profile.engineeringFlowAddGpm,
      );
      return {
        ...state,
        wizardPhase: 'workspace',
        activeWorkspace: 'configurator',
        data: merged,
        projectItems: openedItems,
        projectFiles: [...profile.projectFiles],
        activityLog: [...profile.activityLog],
        engineeringFlowAddGpm: profile.engineeringFlowAddGpm,
        isDirty: false,
        configDrawerOpen: false,
        activeStep: null,
        appliedTemplatePreset: { ...profile.preset },
        selectedFileId: null,
        filesView: 'browse',
      };
    }
    case 'RETURN_TO_LANDING':
      return {
        ...state,
        wizardPhase: 'landing',
        activeStep: null,
        configDrawerOpen: false,
        appliedTemplatePreset: null,
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextValue>({
  state: INITIAL_STATE,
  dispatch: () => {},
});

export function useApp() {
  return useContext(AppContext);
}
