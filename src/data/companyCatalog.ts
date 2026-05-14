import { calculateVolumeTotals } from './poolSections';
import { flattenItems } from './projectItems';
import type { ProjectData, ProjectItem } from '../types';

const STORAGE_KEY = 'norveo-company-catalog';

/** Rough perimeter (lf) from surface area assuming a square footprint: 4 × sqrt(area). */
export function estimatedPoolPerimeterLf(totalAreaSf: number): number {
  if (totalAreaSf <= 0) return 0;
  return 4 * Math.sqrt(totalAreaSf);
}

/** Circular pool equivalent wet perimeter from surface area (lf). */
export function wetPerimeterFromAreaLf(totalAreaSf: number): number {
  if (totalAreaSf <= 0) return 0;
  return 2 * Math.sqrt(Math.PI * totalAreaSf);
}

export function designBatherCount(data: ProjectData): number {
  const totals = calculateVolumeTotals(data.poolSections);
  const sqftPer = data.batherLoadSqFtPerPerson ?? 15;
  const mult = data.batherLoadUsageMultiplier ?? 0.5;
  const maxBathers = totals.totalArea > 0 ? Math.round(totals.totalArea / sqftPer) : 0;
  return Math.max(0, Math.round(maxBathers * mult));
}

export type CatalogTemplateStatus = 'draft' | 'active' | 'archived';

export type CatalogLineKind = 'costed' | 'subcontractor' | 'assembly';

export type QuantityDriver =
  | 'fixed_one'
  | 'pool_surface_sf'
  | 'pool_volume_gal'
  | 'pool_perimeter_lf'
  | 'wet_perimeter_lf'
  | 'deck_sf'
  | 'bather_load'
  | 'linear_per_section'
  | 'pct_total_material';

export interface CatalogAssemblyChild {
  childId: string;
  multiplier: number;
}

export interface CompanyLineTemplate {
  id: string;
  name: string;
  description: string;
  kind: CatalogLineKind;
  /** $ per combined unit when kind is costed (L+E+M per driver unit). */
  laborRate: number;
  equipRate: number;
  matRate: number;
  /** Lump sum when kind is subcontractor (non-% drivers). */
  subcontractorLump: number;
  driver: QuantityDriver;
  /** When true, line qty follows the driver quantity; when false, qty is 1 and price scales by driver. */
  perUnit: boolean;
  /** For driver pct_total_material: percent of current material basis (0–100). */
  ratePctOfMaterial: number;
  status: CatalogTemplateStatus;
  /** Published version; 0 = never published (draft only). Increments on Publish. */
  version: number;
  lastPublishedAt: string | null;
  tags: string[];
  category: string;
  /** Display UOM (EA, LF, SF, …). If empty, derived from driver. */
  unit: string;
  /** Default markup as % of resolved unit price, applied when inserting into project. */
  defaultMarkupPct: number;
  /** When kind is assembly, each child is inserted as its own BOM line (qty × multiplier). */
  assembly?: CatalogAssemblyChild[];
}

export const QUANTITY_DRIVER_LABELS: Record<QuantityDriver, string> = {
  fixed_one: 'Fixed (qty 1)',
  pool_surface_sf: 'Pool surface area (sf)',
  pool_volume_gal: 'Pool volume (gal)',
  pool_perimeter_lf: 'Pool perimeter — square proxy (lf)',
  wet_perimeter_lf: 'Wet perimeter — circle proxy (lf)',
  deck_sf: 'Deck area (sf)',
  bather_load: 'Design bather load (count)',
  linear_per_section: 'Pool section count',
  pct_total_material: '% of material basis',
};

export function makeCatalogTemplateId(): string {
  return `cc-${Date.now().toString(36)}`;
}

function emptyUnitForDriver(d: QuantityDriver): string {
  switch (d) {
    case 'pool_volume_gal':
      return 'gal';
    case 'pool_perimeter_lf':
    case 'wet_perimeter_lf':
      return 'LF';
    case 'pool_surface_sf':
    case 'deck_sf':
      return 'SF';
    case 'bather_load':
    case 'linear_per_section':
    case 'fixed_one':
      return 'EA';
    case 'pct_total_material':
      return 'LS';
    default:
      return 'EA';
  }
}

function migrateTemplate(raw: unknown): CompanyLineTemplate {
  const t = raw as Partial<CompanyLineTemplate>;
  const status: CatalogTemplateStatus =
    t.status === 'draft' || t.status === 'active' || t.status === 'archived'
      ? t.status
      : 'active';
  const version =
    typeof t.version === 'number' && t.version >= 0
      ? t.version
      : status === 'draft'
        ? 0
        : 1;
  const hasAssemblyChildren = Array.isArray(t.assembly) && t.assembly.length > 0;
  const kind: CatalogLineKind =
    t.kind === 'assembly' && hasAssemblyChildren
      ? 'assembly'
      : t.kind === 'subcontractor'
        ? 'subcontractor'
        : 'costed';
  const driver = (t.driver ?? 'fixed_one') as QuantityDriver;
  return {
    id: typeof t.id === 'string' && t.id ? t.id : makeCatalogTemplateId(),
    name: typeof t.name === 'string' ? t.name : 'Catalog line',
    description: typeof t.description === 'string' ? t.description : '',
    kind,
    laborRate: typeof t.laborRate === 'number' ? t.laborRate : 0,
    equipRate: typeof t.equipRate === 'number' ? t.equipRate : 0,
    matRate: typeof t.matRate === 'number' ? t.matRate : 0,
    subcontractorLump: typeof t.subcontractorLump === 'number' ? t.subcontractorLump : 0,
    driver,
    perUnit: typeof t.perUnit === 'boolean' ? t.perUnit : true,
    ratePctOfMaterial: typeof t.ratePctOfMaterial === 'number' ? t.ratePctOfMaterial : 0,
    status,
    version,
    lastPublishedAt: typeof t.lastPublishedAt === 'string' ? t.lastPublishedAt : null,
    tags: Array.isArray(t.tags) ? t.tags.filter((x): x is string => typeof x === 'string') : [],
    category: typeof t.category === 'string' && t.category ? t.category : 'General',
    unit: typeof t.unit === 'string' ? t.unit : '',
    defaultMarkupPct: typeof t.defaultMarkupPct === 'number' ? t.defaultMarkupPct : 0,
    assembly: Array.isArray(t.assembly)
      ? t.assembly
          .filter((c): c is CatalogAssemblyChild => typeof (c as CatalogAssemblyChild)?.childId === 'string')
          .map((c) => ({
            childId: (c as CatalogAssemblyChild).childId,
            multiplier: typeof (c as CatalogAssemblyChild).multiplier === 'number' ? (c as CatalogAssemblyChild).multiplier : 1,
          }))
      : undefined,
  };
}

export const DEFAULT_COMPANY_CATALOG: CompanyLineTemplate[] = [
  {
    id: 'cc-demo-perim',
    name: 'Bond beam labor',
    description: 'Perimeter-based labor allowance (demo template).',
    kind: 'costed',
    laborRate: 12,
    equipRate: 0,
    matRate: 2,
    subcontractorLump: 0,
    driver: 'pool_perimeter_lf',
    perUnit: true,
    ratePctOfMaterial: 0,
    status: 'active',
    version: 1,
    lastPublishedAt: new Date().toISOString(),
    tags: ['labor', 'starter'],
    category: 'Structure',
    unit: 'LF',
    defaultMarkupPct: 0,
  },
];

export const STARTER_CATALOG_TEMPLATES: CompanyLineTemplate[] = [
  {
    id: 'cc-starter-deck',
    name: 'Deck labor allowance',
    description: 'Per sf of deck (demo starter).',
    kind: 'costed',
    laborRate: 4.5,
    equipRate: 0.5,
    matRate: 0,
    subcontractorLump: 0,
    driver: 'deck_sf',
    perUnit: true,
    ratePctOfMaterial: 0,
    status: 'draft',
    version: 0,
    lastPublishedAt: null,
    tags: ['starter', 'deck'],
    category: 'Finishes',
    unit: 'SF',
    defaultMarkupPct: 5,
  },
  {
    id: 'cc-starter-sub',
    name: 'Shotcrete package (sub)',
    description: 'Lump subcontractor placeholder.',
    kind: 'subcontractor',
    laborRate: 0,
    equipRate: 0,
    matRate: 0,
    subcontractorLump: 18500,
    driver: 'fixed_one',
    perUnit: true,
    ratePctOfMaterial: 0,
    status: 'draft',
    version: 0,
    lastPublishedAt: null,
    tags: ['starter', 'sub'],
    category: 'Structure',
    unit: 'LS',
    defaultMarkupPct: 0,
  },
  {
    id: 'cc-starter-pct',
    name: 'GC fee (% of materials)',
    description: 'Percent of current material basis.',
    kind: 'subcontractor',
    laborRate: 0,
    equipRate: 0,
    matRate: 0,
    subcontractorLump: 0,
    driver: 'pct_total_material',
    perUnit: false,
    ratePctOfMaterial: 8,
    status: 'draft',
    version: 0,
    lastPublishedAt: null,
    tags: ['starter', 'fee'],
    category: 'Additional costs',
    unit: 'LS',
    defaultMarkupPct: 0,
  },
];

export function loadCompanyCatalogFromStorage(): CompanyLineTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANY_CATALOG.map((t) => migrateTemplate(t));
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_COMPANY_CATALOG.map((t) => migrateTemplate(t));
    }
    return parsed.map((row) => migrateTemplate(row));
  } catch {
    return DEFAULT_COMPANY_CATALOG.map((t) => migrateTemplate(t));
  }
}

export function persistCompanyCatalog(templates: CompanyLineTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    /* ignore */
  }
}

function materialBasisFromItems(items: ProjectItem[], excludeItemId?: string): number {
  return flattenItems(items)
    .filter((r) => r.id !== excludeItemId)
    .reduce((s, r) => s + r.qty * (r.price + (r.markup ?? 0)), 0);
}

export interface ResolvedCatalogLine {
  qty: number;
  /** Combined unit price (L+E+M) for costed; lump unit for sub %; else lump/line. */
  price: number;
  markup: number;
  laborUnit: number;
  equipUnit: number;
  matUnit: number;
  unit: string;
}

/** Resolved qty, unit price, markup, and L/E/M unit breakdown for a template. */
export function resolveCatalogLineRates(
  template: CompanyLineTemplate,
  data: ProjectData,
  projectItems: ProjectItem[],
  excludeItemId?: string,
): ResolvedCatalogLine {
  const sections = data.poolSections ?? [];
  const basis = materialBasisFromItems(projectItems, excludeItemId);

  if (template.kind === 'subcontractor') {
    if (template.driver === 'pct_total_material') {
      const lump = (Math.max(0, template.ratePctOfMaterial) / 100) * basis;
      return {
        qty: 1,
        price: lump,
        markup: 0,
        laborUnit: 0,
        equipUnit: 0,
        matUnit: 0,
        unit: template.unit.trim() || 'LS',
      };
    }
    return {
      qty: 1,
      price: Math.max(0, template.subcontractorLump),
      markup: 0,
      laborUnit: 0,
      equipUnit: 0,
      matUnit: 0,
      unit: template.unit.trim() || 'LS',
    };
  }

  const labor = Math.max(0, template.laborRate);
  const equip = Math.max(0, template.equipRate);
  const mat = Math.max(0, template.matRate);
  const combined = labor + equip + mat;

  let driverQty = 1;
  switch (template.driver) {
    case 'fixed_one':
      driverQty = 1;
      break;
    case 'pool_surface_sf':
      driverQty = Math.max(0, calculateVolumeTotals(sections).totalArea);
      break;
    case 'pool_volume_gal':
      driverQty = Math.max(0, calculateVolumeTotals(sections).totalGallons);
      break;
    case 'pool_perimeter_lf':
      driverQty = estimatedPoolPerimeterLf(calculateVolumeTotals(sections).totalArea);
      break;
    case 'wet_perimeter_lf':
      driverQty = wetPerimeterFromAreaLf(calculateVolumeTotals(sections).totalArea);
      break;
    case 'deck_sf':
      driverQty = Math.max(0, data.deckSf ?? 0);
      break;
    case 'bather_load':
      driverQty = designBatherCount(data);
      break;
    case 'linear_per_section':
      driverQty = Math.max(0, sections.length);
      break;
    case 'pct_total_material': {
      const lump = (Math.max(0, template.ratePctOfMaterial) / 100) * basis;
      return {
        qty: 1,
        price: lump,
        markup: 0,
        laborUnit: 0,
        equipUnit: 0,
        matUnit: 0,
        unit: template.unit.trim() || 'LS',
      };
    }
    default:
      driverQty = 1;
  }

  const unitStr = template.unit.trim() || emptyUnitForDriver(template.driver);
  const pct = Math.max(0, template.defaultMarkupPct);
  const mk = (unitPrice: number) => (pct > 0 ? Math.round((unitPrice * pct) / 100) : 0);

  if (template.perUnit) {
    const unitPrice = combined;
    return {
      qty: Math.max(0, driverQty),
      price: unitPrice,
      markup: mk(unitPrice),
      laborUnit: labor,
      equipUnit: equip,
      matUnit: mat,
      unit: unitStr,
    };
  }
  const scaled = combined * Math.max(0, driverQty);
  return {
    qty: 1,
    price: scaled,
    markup: mk(scaled),
    laborUnit: labor * Math.max(0, driverQty),
    equipUnit: equip * Math.max(0, driverQty),
    matUnit: mat * Math.max(0, driverQty),
    unit: unitStr,
  };
}

function partNoFromTemplate(template: CompanyLineTemplate): string {
  const tail = template.id.replace(/^cc-/, '').slice(-8).toUpperCase();
  return `CAT-${tail || 'LINE'}`;
}

/** Build a leaf ProjectItem from a company template (new id each insert). */
export function projectItemFromCatalogTemplate(
  template: CompanyLineTemplate,
  data: ProjectData,
  projectItems: ProjectItem[],
  excludeItemId?: string,
): ProjectItem {
  if (template.kind === 'assembly') {
    throw new Error('Use expandAssemblyTemplates for assembly rows');
  }
  const resolved = resolveCatalogLineRates(template, data, projectItems, excludeItemId);
  const id = `cat-${template.id}-${Date.now().toString(36)}`;
  return {
    id,
    name: template.name,
    category: template.category || 'Additional costs',
    color: '#7e57c2',
    qty: resolved.qty,
    unit: resolved.unit,
    price: resolved.price,
    markup: resolved.markup,
    visible: true,
    partNo: partNoFromTemplate(template),
    brand: '—',
    description: template.description || template.name,
    supplier: 'Internal',
    status: 'to-purchase',
    interaction: 'movable',
    configuratorSection: undefined,
    catalogTemplateId: template.id,
    catalogTemplateVersion: template.version,
    catalogLaborUnit: resolved.laborUnit,
    catalogEquipUnit: resolved.equipUnit,
    catalogMatUnit: resolved.matUnit,
  };
}

/** Expand template ids to concrete active templates (resolves assemblies). */
export function expandCatalogTemplatesForInsert(
  templateIds: string[],
  templates: CompanyLineTemplate[],
): { template: CompanyLineTemplate; assemblyMultiplier: number }[] {
  const byId = new Map(templates.map((t) => [t.id, t]));
  const out: { template: CompanyLineTemplate; assemblyMultiplier: number }[] = [];
  const visit = (id: string, mult: number, stack: Set<string>) => {
    if (stack.has(id)) return;
    const t = byId.get(id);
    if (!t || t.status !== 'active') return;
    stack.add(id);
    if (t.kind === 'assembly' && t.assembly?.length) {
      for (const { childId, multiplier } of t.assembly) {
        visit(childId, mult * (multiplier || 1), stack);
      }
    } else if (t.kind !== 'assembly') {
      out.push({ template: t, assemblyMultiplier: mult });
    }
    stack.delete(id);
  };
  for (const id of templateIds) {
    visit(id, 1, new Set());
  }
  return out;
}

/** Apply assembly multiplier to qty after resolve. */
export function projectItemFromCatalogWithMultiplier(
  template: CompanyLineTemplate,
  data: ProjectData,
  projectItems: ProjectItem[],
  assemblyMultiplier: number,
  excludeItemId?: string,
): ProjectItem {
  const row = projectItemFromCatalogTemplate(template, data, projectItems, excludeItemId);
  if (assemblyMultiplier !== 1 && Number.isFinite(assemblyMultiplier)) {
    const m = Math.max(0, assemblyMultiplier);
    return { ...row, qty: row.qty * m };
  }
  return row;
}

export function isCatalogLineStale(item: ProjectItem, templates: CompanyLineTemplate[]): boolean {
  if (!item.catalogTemplateId || item.catalogTemplateVersion == null) return false;
  const t = templates.find((x) => x.id === item.catalogTemplateId);
  if (!t || t.status !== 'active') return false;
  return t.version > item.catalogTemplateVersion;
}

export function catalogTemplateById(
  templates: CompanyLineTemplate[],
  id: string,
): CompanyLineTemplate | undefined {
  return templates.find((t) => t.id === id);
}
