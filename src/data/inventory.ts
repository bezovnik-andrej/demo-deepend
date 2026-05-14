import type { ItemStatus, ProjectItem } from '../types';

export interface InventoryPart {
  partNo: string;
  brand: string;
  description: string;
  supplier: string;
  unitCost: number;
  unit: string;
  status: ItemStatus;
  category: string;
}

export const FIXTURES_INVENTORY: InventoryPart[] = [
  { partNo: 'FIX-WR10', brand: 'Paramount', description: 'PV3 Wall Return Fitting', supplier: 'Paramount', unitCost: 32, unit: 'EA', status: 'purchased', category: 'Fixtures' },
  { partNo: 'FIX-WR-PEN', brand: 'Pentair', description: '1.5" Eyeball Return Fitting', supplier: 'Pentair', unitCost: 28, unit: 'EA', status: 'purchased', category: 'Fixtures' },
  { partNo: 'FIX-WR-HAY', brand: 'Hayward', description: 'Tri-Flow Wall Return', supplier: 'Hayward', unitCost: 29, unit: 'EA', status: 'purchased', category: 'Fixtures' },
  { partNo: 'FIX-JET-LM', brand: 'Jandy', description: 'Large Mouth Return Wall Fitting', supplier: 'Fluidra', unitCost: 36, unit: 'EA', status: 'on-order', category: 'Fixtures' },
  { partNo: 'FIX-WR-CV', brand: 'Pentair', description: 'ColorVision LED Return Niche', supplier: 'Pentair', unitCost: 78, unit: 'EA', status: 'purchased', category: 'Fixtures' },
  { partNo: 'FIX-WR-WW', brand: 'Waterway', description: '1.5" Internal Return Fitting', supplier: 'Waterway', unitCost: 22, unit: 'EA', status: 'purchased', category: 'Fixtures' },
  { partNo: 'FIX-VGB', brand: 'Paramount', description: 'SDX2 Retro Drain Anti-Vortex Cover', supplier: 'Paramount', unitCost: 45, unit: 'EA', status: 'purchased', category: 'Fixtures' },
];

export const MECHANICAL_ALTS: Record<string, InventoryPart[]> = {
  'PMP-VS3': [
    { partNo: 'PMP-HV2', brand: 'Hayward', description: 'TriStar VS 900 2.7HP Variable Speed', supplier: 'Hayward', unitCost: 2650, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'PMP-JEP4', brand: 'Jandy', description: 'VS FloPro 2.7 HP Variable Speed', supplier: 'Fluidra', unitCost: 2599, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'PMP-SF28', brand: 'Pentair', description: 'SuperFlo VS 1.5HP Variable Speed', supplier: 'Pentair', unitCost: 1450, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'PMP-MX30', brand: 'Hayward', description: 'MaxFlo VS 500 1.65HP Variable Speed', supplier: 'Hayward', unitCost: 1690, unit: 'EA', status: 'to-purchase', category: 'Mechanical' },
    { partNo: 'PMP-EP30', brand: 'Jandy', description: 'ePump 2.7 HP Variable Speed', supplier: 'Fluidra', unitCost: 2750, unit: 'EA', status: 'on-order', category: 'Mechanical' },
  ],
  'FLT-SD24': [
    { partNo: 'FLT-HP31', brand: 'Hayward', description: 'ProSeries S310T 30" Sand Filter', supplier: 'Hayward', unitCost: 1150, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'FLT-HP36', brand: 'Hayward', description: 'ProSeries S360SX 36" Sand Filter', supplier: 'Hayward', unitCost: 1580, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'FLT-TR50', brand: 'Pentair', description: 'Triton II TR50 24" Sand Filter', supplier: 'Pentair', unitCost: 980, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'FLT-TR100', brand: 'Pentair', description: 'Triton II TR100 30" Sand Filter', supplier: 'Pentair', unitCost: 1450, unit: 'EA', status: 'to-purchase', category: 'Mechanical' },
    { partNo: 'FLT-JCF', brand: 'Jandy', description: 'JS Series JS100-SM Sand Filter', supplier: 'Fluidra', unitCost: 1080, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'FLT-W36', brand: 'Waterway', description: 'Carefree 26" Top-Mount Sand Filter', supplier: 'Waterway', unitCost: 890, unit: 'EA', status: 'to-purchase', category: 'Mechanical' },
    { partNo: 'FLT-STA', brand: 'Sta-Rite', description: 'Cristal-Flo II 24" Sand Filter', supplier: 'Pentair', unitCost: 1050, unit: 'EA', status: 'purchased', category: 'Mechanical' },
  ],
  'HTR-400': [
    { partNo: 'HTR-H400', brand: 'Hayward', description: 'Universal H-Series 400K BTU Gas Heater', supplier: 'Hayward', unitCost: 3450, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'HTR-JXI', brand: 'Jandy', description: 'JXi 400K BTU Pool Heater', supplier: 'Fluidra', unitCost: 4200, unit: 'EA', status: 'on-order', category: 'Mechanical' },
    { partNo: 'HTR-MC460', brand: 'Pentair', description: 'MasterTemp 400K BTU Gas Heater', supplier: 'Pentair', unitCost: 3650, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'HTR-RP336', brand: 'Raypak', description: 'P-R336A-EN-C 336K BTU Digital Heater', supplier: 'Raypak', unitCost: 3200, unit: 'EA', status: 'purchased', category: 'Mechanical' },
  ],
  'CTL-EQ': [
    { partNo: 'CTL-ORP', brand: 'Hayward', description: 'CAT 4000 ORP/pH Controller', supplier: 'Hayward', unitCost: 1850, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'CTL-IQ', brand: 'Jandy', description: 'iAquaLink Chemistry Controller', supplier: 'Fluidra', unitCost: 1750, unit: 'EA', status: 'to-purchase', category: 'Mechanical' },
  ],
  'SAN-IC40': [
    { partNo: 'SAN-TCC', brand: 'Hayward', description: 'TurboCell T-Cell-15 Salt Cell 40K Gal', supplier: 'Hayward', unitCost: 980, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'SAN-AQR', brand: 'Jandy', description: 'AquaPure Ei 35K Salt Cell', supplier: 'Fluidra', unitCost: 1100, unit: 'EA', status: 'purchased', category: 'Mechanical' },
    { partNo: 'SAN-IC60', brand: 'Pentair', description: 'IntelliChlor IC60 Salt Cell 60K Gal', supplier: 'Pentair', unitCost: 1450, unit: 'EA', status: 'to-purchase', category: 'Mechanical' },
  ],
};

export const BOM_STATUS_LABELS: Record<ItemStatus, { label: string; cls: string }> = {
  'purchased': { label: 'Purchased', cls: 'statusPurchased' },
  'to-purchase': { label: 'To Purchase', cls: 'statusToPurchase' },
  'on-order': { label: 'On Order', cls: 'statusOnOrder' },
  'not-required': { label: 'Not Required', cls: 'statusNotRequired' },
};

export interface BOMLineRef {
  partNo: string;
  brand: string;
  description: string;
  supplier: string;
  unitCost: number;
  unit: string;
  status: ItemStatus;
  category: string;
  qty: number;
}

function lineToInventory(line: BOMLineRef): InventoryPart {
  return {
    partNo: line.partNo,
    brand: line.brand,
    description: line.description,
    supplier: line.supplier,
    unitCost: line.unitCost,
    unit: line.unit,
    status: line.status,
    category: line.category,
  };
}

/** Alternatives for a BOM line (fixtures category pool or mechanical alternates). */
export function inventoryForLine(line: BOMLineRef): InventoryPart[] {
  if (line.category === 'Fixtures') {
    return FIXTURES_INVENTORY;
  }
  const current = lineToInventory(line);
  const alts = MECHANICAL_ALTS[line.partNo] ?? [];
  const seen = new Set<string>();
  const out: InventoryPart[] = [];
  for (const p of [current, ...alts]) {
    if (seen.has(p.partNo)) continue;
    seen.add(p.partNo);
    out.push(p);
  }
  return out;
}

/** Map picked inventory row onto project item fields */
export function inventoryPickToProjectPatch(inv: InventoryPart): Partial<ProjectItem> {
  const nameFromDesc = inv.description.includes('—')
    ? inv.description.split('—')[0].trim()
    : inv.description.slice(0, 48);
  return {
    partNo: inv.partNo,
    brand: inv.brand,
    description: inv.description,
    supplier: inv.supplier,
    status: inv.status,
    price: inv.unitCost,
    unit: inv.unit,
    name: nameFromDesc,
  };
}
