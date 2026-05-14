import { useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useApp } from '../../store';
import {
  makeCatalogTemplateId,
  QUANTITY_DRIVER_LABELS,
  STARTER_CATALOG_TEMPLATES,
} from '../../data/companyCatalog';
import type {
  CatalogAssemblyChild,
  CatalogLineKind,
  CompanyLineTemplate,
  CatalogTemplateStatus,
  QuantityDriver,
} from '../../data/companyCatalog';
import styles from './catalog.module.css';

const DRIVERS = Object.keys(QUANTITY_DRIVER_LABELS) as QuantityDriver[];

function emptyTemplate(): CompanyLineTemplate {
  return {
    id: makeCatalogTemplateId(),
    name: 'New catalog line',
    description: '',
    kind: 'costed',
    laborRate: 0,
    equipRate: 0,
    matRate: 0,
    subcontractorLump: 0,
    driver: 'fixed_one',
    perUnit: true,
    ratePctOfMaterial: 0,
    status: 'draft',
    version: 0,
    lastPublishedAt: null,
    tags: [],
    category: 'General',
    unit: '',
    defaultMarkupPct: 0,
  };
}

type StatusFilter = 'all' | CatalogTemplateStatus;

const PER_UNIT_CHECKBOX_TITLE =
  'Qty follows driver (per-unit). Off = one line, unit price scales by driver quantity.';

function disabledHint(kind: CatalogLineKind, driver: QuantityDriver, field: string): string | null {
  if (field === 'lem' && kind === 'subcontractor') {
    return 'Labor / equipment / material rates apply to costed lines only. Use Sub $ for a fixed subcontractor lump.';
  }
  if (field === 'sub' && kind === 'costed') {
    return 'Subcontractor lump is for subcontractor lines (non-% drivers).';
  }
  if (field === 'sub' && kind === 'subcontractor' && driver === 'pct_total_material') {
    return 'Use % mat column for percent-of-material subcontractor lines.';
  }
  if (field === 'pct' && driver !== 'pct_total_material') {
    return '% of material applies only when the driver is “% of material basis”.';
  }
  if (field === 'perUnit' && (kind === 'subcontractor' || driver === 'pct_total_material')) {
    return 'Per-unit is fixed for subcontractor and % drivers.';
  }
  return null;
}

export function CatalogWorkspace() {
  const { state, dispatch } = useApp();
  const templates = state.companyCatalogTemplates;
  const isAdmin = state.userMode === 'companyAdmin';
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editorId, setEditorId] = useState<string | null>(null);

  const setTemplates = (next: CompanyLineTemplate[]) => {
    dispatch({ type: 'SET_COMPANY_CATALOG', templates: next });
  };

  const updateRow = (id: string, patch: Partial<CompanyLineTemplate>) => {
    setTemplates(templates.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const addRow = () => {
    if (!isAdmin) return;
    setTemplates([...templates, emptyTemplate()]);
  };

  const deleteRow = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this catalog line? This cannot be undone.')) return;
    setTemplates(templates.filter((t) => t.id !== id));
    setSelectedIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const addStarters = () => {
    const existing = new Set(templates.map((t) => t.id));
    const toAdd = STARTER_CATALOG_TEMPLATES.filter((s) => !existing.has(s.id)).map((s) => ({ ...s }));
    if (toAdd.length === 0) return;
    setTemplates([...templates, ...toAdd]);
  };

  const filtered = useMemo(() => {
    let list = templates;
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [templates, statusFilter, search]);

  const activeEditorId =
    editorId && filtered.some((x) => x.id === editorId)
      ? editorId
      : filtered[0]?.id ?? null;

  const toggleSelect = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t || t.status !== 'active' || t.kind === 'assembly') return;
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const addToProject = (ids?: string[]) => {
    const list = ids ?? [...selectedIds];
    if (list.length === 0) return;
    dispatch({ type: 'ADD_CATALOG_LINES_TO_PROJECT', templateIds: list });
    if (!ids) setSelectedIds(new Set());
  };

  const otherTemplateOptions = (selfId: string) =>
    templates.filter((x) => x.id !== selfId && x.kind !== 'assembly');

  const addAssemblyChild = (cardId: string) => {
    const t = templates.find((x) => x.id === cardId);
    if (!t || !isAdmin) return;
    const opts = otherTemplateOptions(cardId);
    if (opts.length === 0) return;
    const nextChild: CatalogAssemblyChild = { childId: opts[0].id, multiplier: 1 };
    updateRow(cardId, { assembly: [...(t.assembly ?? []), nextChild] });
  };

  const publishRow = (id: string) => {
    if (!isAdmin) return;
    dispatch({ type: 'PUBLISH_CATALOG_TEMPLATE', id });
  };

  const archiveRow = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Archive this line? It will no longer appear in “Add to project”.')) return;
    updateRow(id, { status: 'archived' });
  };

  const missingStarterCount = STARTER_CATALOG_TEMPLATES.filter(
    (s) => !templates.some((t) => t.id === s.id),
  ).length;

  return (
    <div className={styles.outer}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.title}>Additional costs</div>
          <div className={styles.sub}>Reusable BOM line templates. Publish to use in projects.</div>
          <div className={styles.roleRow}>
            <span>Role (demo):</span>
            <div className={styles.roleSeg} role="group" aria-label="User role for catalog editing">
              <button
                type="button"
                className={`${styles.roleSegBtn} ${state.userMode === 'engineer' ? styles.roleSegBtnActive : ''}`}
                onClick={() => dispatch({ type: 'SET_USER_MODE', mode: 'engineer' })}
              >
                Engineer
              </button>
              <button
                type="button"
                className={`${styles.roleSegBtn} ${state.userMode === 'companyAdmin' ? styles.roleSegBtnActiveAdmin : ''}`}
                onClick={() => dispatch({ type: 'SET_USER_MODE', mode: 'companyAdmin' })}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          {isAdmin && (
            <button type="button" className={styles.btn} onClick={addRow}>
              Add line
            </button>
          )}
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={selectedIds.size === 0}
            title="Active costed/sub lines only (assemblies expand to children)"
            onClick={() => addToProject()}
          >
            Add selected to project
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => dispatch({ type: 'SET_WORKSPACE', workspace: 'bom' })}
          >
            <ClipboardList size={13} aria-hidden />
            Open Project Financials
          </button>
        </div>
      </div>

      {missingStarterCount > 0 && (
        <div className={styles.starterStrip}>
          <span>{missingStarterCount} demo starter line(s) available.</span>
          <button type="button" className={styles.btnPrimary} onClick={addStarters}>
            Add demo starters
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search name, description, category, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search catalog"
        />
        <div className={styles.filterSeg} role="group" aria-label="Filter by status">
          {(['all', 'active', 'draft', 'archived'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`${styles.filterBtn} ${statusFilter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.catalogSplit}>
        <aside className={styles.catalogSidebar} aria-label="Catalog lines">
          <div className={styles.sidebarHeader}>Catalog lines</div>
          <div className={styles.sidebarList}>
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.sidebarItem} ${activeEditorId === t.id ? styles.sidebarItemActive : ''}`}
                onClick={() => setEditorId(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </aside>
        <div className={styles.cardGrid}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No lines match filters.</p>
        ) : (
          filtered
            .filter((t) => t.id === activeEditorId)
            .map((t) => {
            const canEdit = isAdmin && t.status !== 'archived';
            const canSelect = t.status === 'active' && t.kind !== 'assembly';
            const lemHint = disabledHint(t.kind, t.driver, 'lem');
            const subHint = disabledHint(t.kind, t.driver, 'sub');
            const pctHint = disabledHint(t.kind, t.driver, 'pct');
            const perHint = disabledHint(t.kind, t.driver, 'perUnit');
            return (
              <article key={t.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    {t.name}
                    {t.version > 0 && (
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                        v{t.version}
                      </span>
                    )}
                  </div>
                  <span
                    className={`${styles.statusPill} ${
                      t.status === 'draft'
                        ? styles.statusDraft
                        : t.status === 'archived'
                          ? styles.statusArchived
                          : styles.statusActive
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className={styles.fieldLabel}>Name</div>
                <input
                  className={styles.input}
                  value={t.name}
                  disabled={!canEdit}
                  onChange={(e) => updateRow(t.id, { name: e.target.value })}
                />

                <div className={styles.fieldLabel}>Description</div>
                <input
                  className={styles.input}
                  value={t.description}
                  disabled={!canEdit}
                  onChange={(e) => updateRow(t.id, { description: e.target.value })}
                />

                <div className={styles.row2}>
                  <div>
                    <div className={styles.fieldLabel}>Category</div>
                    <input
                      className={styles.input}
                      value={t.category}
                      disabled={!canEdit}
                      onChange={(e) => updateRow(t.id, { category: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>Tags (comma)</div>
                    <input
                      className={styles.input}
                      value={t.tags.join(', ')}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateRow(t.id, {
                          tags: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.row2}>
                  <div>
                    <div className={styles.fieldLabel}>Kind</div>
                    <select
                      className={styles.select}
                      value={t.kind}
                      disabled={!canEdit}
                      onChange={(e) => {
                        const k = e.target.value as CatalogLineKind;
                        updateRow(t.id, {
                          kind: k,
                          assembly: k === 'assembly' ? t.assembly ?? [] : undefined,
                        });
                      }}
                    >
                      <option value="costed">Costed (L+E+M)</option>
                      <option value="subcontractor">Subcontractor</option>
                      <option value="assembly">Assembly (bundle)</option>
                    </select>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>Display unit (optional)</div>
                    <input
                      className={styles.input}
                      placeholder="EA, LF, SF…"
                      value={t.unit}
                      disabled={!canEdit || t.kind === 'assembly'}
                      onChange={(e) => updateRow(t.id, { unit: e.target.value })}
                    />
                  </div>
                </div>

                {t.kind !== 'assembly' && (
                  <>
                    <div className={styles.fieldLabel}>Driver</div>
                    <select
                      className={styles.select}
                      value={t.driver}
                      disabled={!canEdit}
                      onChange={(e) => updateRow(t.id, { driver: e.target.value as QuantityDriver })}
                    >
                      {DRIVERS.map((d) => (
                        <option key={d} value={d}>
                          {QUANTITY_DRIVER_LABELS[d]}
                        </option>
                      ))}
                    </select>

                    <div className={styles.row3}>
                      <div>
                        <div className={styles.fieldLabel}>Labor $</div>
                        <input
                          type="number"
                          className={styles.input}
                          disabled={!canEdit || t.kind === 'subcontractor'}
                          value={t.laborRate}
                          title={lemHint ?? undefined}
                          onChange={(e) => updateRow(t.id, { laborRate: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <div className={styles.fieldLabel}>Equip $</div>
                        <input
                          type="number"
                          className={styles.input}
                          disabled={!canEdit || t.kind === 'subcontractor'}
                          value={t.equipRate}
                          title={lemHint ?? undefined}
                          onChange={(e) => updateRow(t.id, { equipRate: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <div className={styles.fieldLabel}>Mat $</div>
                        <input
                          type="number"
                          className={styles.input}
                          disabled={!canEdit || t.kind === 'subcontractor'}
                          value={t.matRate}
                          title={lemHint ?? undefined}
                          onChange={(e) => updateRow(t.id, { matRate: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className={styles.row2}>
                      <div>
                        <div className={styles.fieldLabel}>Sub $ (lump)</div>
                        <input
                          type="number"
                          className={styles.input}
                          disabled={!canEdit || t.kind !== 'subcontractor' || t.driver === 'pct_total_material'}
                          value={t.subcontractorLump}
                          title={subHint ?? undefined}
                          onChange={(e) => updateRow(t.id, { subcontractorLump: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <div className={styles.fieldLabel}>% material</div>
                        <input
                          type="number"
                          className={styles.input}
                          disabled={!canEdit || t.driver !== 'pct_total_material'}
                          value={t.ratePctOfMaterial}
                          title={pctHint ?? undefined}
                          onChange={(e) => updateRow(t.id, { ratePctOfMaterial: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className={styles.chkRow}>
                      <input
                        type="checkbox"
                        className={styles.chk}
                        checked={t.perUnit}
                        disabled={!canEdit || t.kind === 'subcontractor' || t.driver === 'pct_total_material'}
                        title={perHint ?? undefined}
                        onChange={(e) => updateRow(t.id, { perUnit: e.target.checked })}
                      />
                      <span title={PER_UNIT_CHECKBOX_TITLE}>Per-unit pricing</span>
                    </div>

                    <div className={styles.fieldLabel}>Default markup % (on insert)</div>
                    <input
                      type="number"
                      className={`${styles.input} ${styles.inputNarrow}`}
                      disabled={!canEdit}
                      value={t.defaultMarkupPct}
                      onChange={(e) => updateRow(t.id, { defaultMarkupPct: Number(e.target.value) || 0 })}
                    />
                  </>
                )}

                {t.kind === 'assembly' && canEdit && (
                  <div>
                    <div className={styles.fieldLabel}>Bundle children (active lines)</div>
                    {(t.assembly ?? []).map((row, idx) => (
                      <div key={`${t.id}-as-${idx}`} className={styles.assemblyRow}>
                        <select
                          className={styles.select}
                          value={row.childId}
                          onChange={(e) => {
                            const next = [...(t.assembly ?? [])];
                            next[idx] = { ...next[idx], childId: e.target.value };
                            updateRow(t.id, { assembly: next });
                          }}
                        >
                          {otherTemplateOptions(t.id).map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name} ({opt.status})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className={`${styles.input} ${styles.inputNarrow}`}
                          title="Multiplier on resolved qty"
                          value={row.multiplier}
                          onChange={(e) => {
                            const next = [...(t.assembly ?? [])];
                            next[idx] = { ...next[idx], multiplier: Number(e.target.value) || 1 };
                            updateRow(t.id, { assembly: next });
                          }}
                        />
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => {
                            const next = (t.assembly ?? []).filter((_, i) => i !== idx);
                            updateRow(t.id, { assembly: next.length ? next : undefined });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button type="button" className={styles.btn} onClick={() => addAssemblyChild(t.id)}>
                      Add child line
                    </button>
                  </div>
                )}

                {t.lastPublishedAt && (
                  <div className={styles.helper}>Last published: {new Date(t.lastPublishedAt).toLocaleString()}</div>
                )}

                <div className={styles.cardActions}>
                  {canSelect && (
                    <label className={`${styles.chkRow} ${styles.cardSelect}`}>
                      <input
                        type="checkbox"
                        className={styles.chk}
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                      />
                      <span>Select for bulk add</span>
                    </label>
                  )}
                  {t.status === 'active' && (t.kind === 'assembly' ? (
                    <button type="button" className={styles.btnPrimary} onClick={() => addToProject([t.id])}>
                      Add bundle to project
                    </button>
                  ) : (
                    <button type="button" className={styles.btnPrimary} onClick={() => addToProject([t.id])}>
                      Add to project
                    </button>
                  ))}
                  {isAdmin && t.status !== 'archived' && (
                    <button type="button" className={styles.btnPrimary} onClick={() => publishRow(t.id)}>
                      Publish new version
                    </button>
                  )}
                  {isAdmin && t.status === 'active' && (
                    <button type="button" className={styles.btn} onClick={() => archiveRow(t.id)}>
                      Archive
                    </button>
                  )}
                  {isAdmin && (
                    <button type="button" className={styles.btnDanger} onClick={() => deleteRow(t.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}
