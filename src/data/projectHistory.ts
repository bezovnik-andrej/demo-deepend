/**
 * Project files (folder tree) + activity feed in state.
 * The Saves tab in Files only lists `kind: 'saved'` rows: timestamp + author.
 */

import type { FC } from 'react';
import {
  PencilRuler, FileText, ScrollText, Download, Folder,
} from 'lucide-react';

/* ── Team ─────────────────────────────────────────────────────────────── */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

export const TEAM: TeamMember[] = [
  { id: 'jordan', name: 'Jordan Lee', role: 'Engineer',           initials: 'JL', color: '#3b82f6' },
  { id: 'alex',   name: 'Alex Rivera', role: 'Sales Lead',        initials: 'AR', color: '#ec4899' },
  { id: 'casey',  name: 'Casey Nguyen', role: 'Project Manager',  initials: 'CN', color: '#f59e0b' },
  { id: 'sam',    name: 'Sam Patel',    role: 'Drafter',          initials: 'SP', color: '#8b5cf6' },
  { id: 'mia',    name: 'Mia Chen',     role: 'Estimator',        initials: 'MC', color: '#0891b2' },
];

export function getMember(id: string): TeamMember {
  return TEAM.find((m) => m.id === id) ?? TEAM[0];
}

/* ── Folders ──────────────────────────────────────────────────────────── */

export type FolderId = 'drawings' | 'plan-sets' | 'specifications' | 'exports' | 'misc';

export interface FolderDef {
  id: FolderId;
  label: string;
  icon: FC<{ size?: number; className?: string }>;
  description: string;
}

export const FOLDERS: FolderDef[] = [
  { id: 'plan-sets',       label: 'Plan Sets',       icon: FileText,        description: 'Auto-generated on each Save—dated snapshots you can send or link' },
  { id: 'drawings',        label: 'Drawings',        icon: PencilRuler,     description: 'Shop drawings and design sheets' },
  { id: 'specifications',  label: 'Specifications',  icon: ScrollText,      description: 'Specs, BOMs, and estimate exports' },
  { id: 'exports',         label: 'Exports',         icon: Download,        description: 'Curated client packages (ZIP, plan sets) ready to hand off' },
  { id: 'misc',            label: 'Misc',            icon: Folder,          description: 'Other project files' },
];

export function getFolderDef(id: FolderId): FolderDef {
  return FOLDERS.find((f) => f.id === id) ?? FOLDERS[0];
}

/** Auto-route a file to the best folder based on mime and name heuristics. */
export function routeFileToFolder(filename: string, mimeType: string): FolderId {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const name = filename.toLowerCase();

  if (name.includes('plan') || name.includes('snapshot') || mimeType === 'application/pdf') {
    if (name.includes('spec') || name.includes('bom') || name.includes('estimate')) return 'specifications';
    if (name.includes('export') || name.includes('package')) return 'exports';
    return 'plan-sets';
  }
  if (ext === 'dwg' || ext === 'dxf' || name.includes('drawing') || name.includes('shop')) return 'drawings';
  if (ext === 'xlsx' || ext === 'csv' || name.includes('bom') || name.includes('estimate') || name.includes('spec')) return 'specifications';
  if (name.includes('export') || name.includes('package') || name.includes('share')) return 'exports';
  return 'misc';
}

/* ── Project Files ────────────────────────────────────────────────────── */

export type FileMimeType = 'application/pdf' | 'application/vnd.ms-excel' | 'text/csv' | 'application/json' | 'application/dwg';

export interface ProjectFile {
  id: string;
  folderId: FolderId;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  version: string;
  savedBy: string;
  savedAt: string;
  notes: string;
}

/** Derive a file-type label from the extension. */
export function fileTypeLabel(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'PDF', xlsx: 'Excel', csv: 'CSV', json: 'JSON', dwg: 'DWG', dxf: 'DXF',
  };
  return map[ext] ?? ext.toUpperCase();
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/* ── Seed data ────────────────────────────────────────────────────────── */

export const SEED_FILES: ProjectFile[] = [
  // Plan Sets (auto-generated saves)
  {
    id: 'f-01', folderId: 'plan-sets',
    filename: 'hillcrest-aquatic-plan-v3.2.pdf', mimeType: 'application/pdf',
    sizeBytes: 2908160, version: 'v3.2', savedBy: 'jordan',
    savedAt: '2025-03-28T16:42:00Z',
    notes: 'Latest working set for Springfield building dept review. Includes revised hydraulics per plan-check comments.',
  },
  {
    id: 'f-02', folderId: 'plan-sets',
    filename: 'hillcrest-aquatic-plan-v3.1.pdf', mimeType: 'application/pdf',
    sizeBytes: 2775040, version: 'v3.1', savedBy: 'casey',
    savedAt: '2025-03-25T20:15:00Z',
    notes: 'Shared with client for finish + tile band approval.',
  },
  {
    id: 'f-03', folderId: 'plan-sets',
    filename: 'hillcrest-aquatic-plan-v3.0.pdf', mimeType: 'application/pdf',
    sizeBytes: 2641920, version: 'v3.0', savedBy: 'sam',
    savedAt: '2025-03-20T11:02:00Z',
    notes: 'Post-redesign baseline. New perimeter gutter geometry after site visit.',
  },
  {
    id: 'f-04', folderId: 'plan-sets',
    filename: 'hillcrest-aquatic-plan-v2.4.pdf', mimeType: 'application/pdf',
    sizeBytes: 2263040, version: 'v2.4', savedBy: 'jordan',
    savedAt: '2025-02-14T14:30:00Z',
    notes: 'Preliminary permit set. Filtration changed from DE → cartridge per owner request.',
  },
  {
    id: 'f-05', folderId: 'plan-sets',
    filename: 'hillcrest-aquatic-plan-v2.0.pdf', mimeType: 'application/pdf',
    sizeBytes: 1454080, version: 'v2.0', savedBy: 'mia',
    savedAt: '2025-01-28T18:00:00Z',
    notes: 'Concept approved by client. Initial cost target locked at $140k.',
  },
  {
    id: 'f-06', folderId: 'plan-sets',
    filename: 'hillcrest-aquatic-plan-v1.0.pdf', mimeType: 'application/pdf',
    sizeBytes: 45056, version: 'v1.0', savedBy: 'alex',
    savedAt: '2025-01-15T09:45:00Z',
    notes: 'Auto-save after first configurator pass.',
  },
  // Drawings
  {
    id: 'f-10', folderId: 'drawings',
    filename: 'SR-Pool_Shop-Drawings_RevC.pdf', mimeType: 'application/pdf',
    sizeBytes: 2908160, version: 'v3.2', savedBy: 'jordan',
    savedAt: '2025-03-28T16:38:00Z',
    notes: 'Full shop drawing set, revision C.',
  },
  {
    id: 'f-11', folderId: 'drawings',
    filename: 'SR-Pool_Hydraulic-Calcs_RevC.pdf', mimeType: 'application/pdf',
    sizeBytes: 626688, version: 'v3.2', savedBy: 'jordan',
    savedAt: '2025-03-28T16:39:00Z',
    notes: 'Hydraulic calculation report.',
  },
  {
    id: 'f-12', folderId: 'drawings',
    filename: 'SR-Pool_Finish-Preview.pdf', mimeType: 'application/pdf',
    sizeBytes: 1003520, version: 'v3.1', savedBy: 'casey',
    savedAt: '2025-03-25T20:10:00Z',
    notes: 'Tile finish preview for client approval.',
  },
  // Specifications
  {
    id: 'f-20', folderId: 'specifications',
    filename: 'SR-Pool_BOM_v3.2.xlsx', mimeType: 'application/vnd.ms-excel',
    sizeBytes: 145408, version: 'v3.2', savedBy: 'jordan',
    savedAt: '2025-03-28T16:40:00Z',
    notes: 'Bill of materials — current.',
  },
  {
    id: 'f-21', folderId: 'specifications',
    filename: 'SR-Pool_Estimate_v3.2.pdf', mimeType: 'application/pdf',
    sizeBytes: 325632, version: 'v3.2', savedBy: 'mia',
    savedAt: '2025-03-28T16:41:00Z',
    notes: 'Project estimate — $138,980 at 22% margin.',
  },
  {
    id: 'f-22', folderId: 'specifications',
    filename: 'SR-Pool_BOM_v3.0.xlsx', mimeType: 'application/vnd.ms-excel',
    sizeBytes: 141312, version: 'v3.0', savedBy: 'sam',
    savedAt: '2025-03-20T11:00:00Z',
    notes: 'Older BOM snapshot.',
  },
  // Exports
  {
    id: 'f-30', folderId: 'exports',
    filename: 'Hillcrest_Concept_Package.pdf', mimeType: 'application/pdf',
    sizeBytes: 3145728, version: 'v2.0', savedBy: 'alex',
    savedAt: '2025-01-28T18:30:00Z',
    notes: 'Concept package sent to M. Smith (client).',
  },
  // Misc
  {
    id: 'f-40', folderId: 'misc',
    filename: 'SR-Pool_Config_v1.json', mimeType: 'application/json',
    sizeBytes: 45056, version: 'v1.0', savedBy: 'alex',
    savedAt: '2025-01-15T09:45:00Z',
    notes: 'Initial configurator snapshot export.',
  },
];

/* ── Activity (History feed) ──────────────────────────────────────────── */

export type ActivityKind =
  | 'created'
  | 'saved'
  | 'config'
  | 'design'
  | 'bom'
  | 'estimate'
  | 'team'
  | 'comment'
  | 'export'
  | 'catalog';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  authorId: string;
  at: string;
  title: string;
  detail?: string;
  target?: string;
  fileId?: string;
}

export const SEED_ACTIVITY: ActivityEvent[] = [
  {
    id: 'a-23', kind: 'saved', authorId: 'jordan', at: '2025-03-28T16:38:00Z',
    title: 'Saved v3.2', detail: '6 files · 6.7 MB', fileId: 'f-01',
  },
  {
    id: 'a-31', kind: 'saved', authorId: 'casey', at: '2025-03-28T11:20:00Z',
    title: 'Saved estimate PDF', detail: 'Specs folder', fileId: 'f-21',
  },
  {
    id: 'a-32', kind: 'saved', authorId: 'jordan', at: '2025-03-28T09:05:00Z',
    title: 'Saved shop drawings', detail: 'Rev C package', fileId: 'f-10',
  },
  {
    id: 'a-22', kind: 'design', authorId: 'jordan', at: '2025-03-28T14:10:00Z',
    title: 'Updated wall return placement',
    detail: 'Moved 2 wall returns on north wall to meet 15 ft spacing rule.',
    target: 'Fixtures · Wall Returns',
  },
  {
    id: 'a-21', kind: 'config', authorId: 'jordan', at: '2025-03-28T13:45:00Z',
    title: 'Adjusted design return velocity',
    detail: '8 ft/s → 7.5 ft/s after plan-check feedback.', target: 'Hydraulics',
  },
  {
    id: 'a-20', kind: 'comment', authorId: 'casey', at: '2025-03-26T10:22:00Z',
    title: 'Left a comment',
    detail: '"Please take a look at the hydraulics before we send to client."',
  },
  {
    id: 'a-19', kind: 'saved', authorId: 'casey', at: '2025-03-25T20:15:00Z',
    title: 'Saved v3.1', detail: 'Client review set — shared for finish approval.', fileId: 'f-02',
  },
  {
    id: 'a-33', kind: 'saved', authorId: 'mia', at: '2025-03-25T18:30:00Z',
    title: 'Saved finish preview', detail: 'Client tile band', fileId: 'f-12',
  },
  {
    id: 'a-18', kind: 'config', authorId: 'casey', at: '2025-03-25T16:02:00Z',
    title: 'Changed interior finish',
    detail: 'Plaster → Tile · 12" band · bullnose stair nosing.', target: 'Interior Finish',
  },
  {
    id: 'a-17', kind: 'bom', authorId: 'mia', at: '2025-03-24T11:40:00Z',
    title: 'Swapped main pump',
    detail: 'Pentair IntelliFlo3 → Jandy VS FloPro · −$420 ext. cost.', target: 'Mechanical',
  },
  {
    id: 'a-16', kind: 'estimate', authorId: 'mia', at: '2025-03-24T11:12:00Z',
    title: 'Updated estimate', detail: 'New total $138,980. Margin held at 22%.',
  },
  {
    id: 'a-15', kind: 'design', authorId: 'sam', at: '2025-03-20T10:45:00Z',
    title: 'Redrew perimeter gutter',
    detail: 'Captured from site visit sketch. North edge offset +4".', target: 'Geometry',
  },
  {
    id: 'a-14', kind: 'saved', authorId: 'sam', at: '2025-03-20T11:02:00Z',
    title: 'Saved v3.0', detail: 'Post-redesign baseline.', fileId: 'f-03',
  },
  {
    id: 'a-34', kind: 'saved', authorId: 'jordan', at: '2025-03-20T14:45:00Z',
    title: 'Saved BOM v3.0', detail: 'Mechanical refresh', fileId: 'f-22',
  },
  {
    id: 'a-13', kind: 'team', authorId: 'casey', at: '2025-03-12T09:05:00Z',
    title: 'Added Mia Chen as Estimator',
  },
  {
    id: 'a-12', kind: 'saved', authorId: 'jordan', at: '2025-02-14T14:30:00Z',
    title: 'Saved v2.4', detail: 'Preliminary permit set.', fileId: 'f-04',
  },
  {
    id: 'a-35', kind: 'saved', authorId: 'casey', at: '2025-02-14T09:15:00Z',
    title: 'Saved permit set (copy)', detail: 'Internal QA pass', fileId: 'f-04',
  },
  {
    id: 'a-11', kind: 'config', authorId: 'jordan', at: '2025-02-14T12:18:00Z',
    title: 'Changed filtration type',
    detail: 'Diatomaceous Earth → Cartridge per owner preference.', target: 'Filtration',
  },
  {
    id: 'a-10', kind: 'export', authorId: 'alex', at: '2025-01-28T18:30:00Z',
    title: 'Exported concept package', detail: 'Sent to M. Smith (client).', fileId: 'f-30',
  },
  {
    id: 'a-09', kind: 'saved', authorId: 'mia', at: '2025-01-28T18:00:00Z',
    title: 'Saved v2.0', detail: 'Concept sign-off snapshot.', fileId: 'f-05',
  },
  {
    id: 'a-36', kind: 'saved', authorId: 'jordan', at: '2025-01-28T12:00:00Z',
    title: 'Saved concept package', detail: 'Pre-export checkpoint', fileId: 'f-30',
  },
  {
    id: 'a-02', kind: 'saved', authorId: 'alex', at: '2025-01-15T09:45:00Z',
    title: 'Saved v1.0', detail: 'Auto-save after first configurator pass.', fileId: 'f-06',
  },
  {
    id: 'a-37', kind: 'saved', authorId: 'sam', at: '2025-01-15T16:20:00Z',
    title: 'Saved config JSON', detail: 'Handoff to estimating', fileId: 'f-40',
  },
  {
    id: 'a-01', kind: 'created', authorId: 'alex', at: '2025-01-12T08:22:00Z',
    title: 'Project created',
    detail: 'Smith Residence Pool · GPL-13 · created from residential pool template.',
  },
];
