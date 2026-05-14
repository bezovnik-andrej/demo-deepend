import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Circle,
  CircleCheck,
  Wrench,
  Filter as FilterIcon,
  Flame,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../../store';
import { ConfigStep } from '../../types';
import { getBrandsForCategory } from '../../data/brands';
import {
  matchingPumps,
  matchingFilters,
  matchingHeaters,
  allPumps,
  allFilters,
  allHeaters,
  PUMP_CATALOG,
  FILTER_CATALOG,
  HEATER_CATALOG,
  type EquipmentRequirements,
  type EquipmentKind,
  type PumpProduct,
  type FilterProduct,
  type HeaterProduct,
  type FilterMediaType,
  type HeaterSystemType,
  type CatalogProduct,
} from '../../data/equipmentCatalog';
import styles from './engineering.module.css';

interface Props {
  designGpm: number;
  requiredBtuHr: number;
}

type SectionId = EquipmentKind;

interface SectionMeta {
  id: SectionId;
  label: string;
  icon: typeof Wrench;
  needHint: (designGpm: number, requiredBtuHr: number, filtrationType: string | null) => string;
}

/** Configurator steps for “open in full wizard” — pump has no dedicated step; brands cover procurement prefs. */
const OPEN_IN_CONFIGURATOR: Record<SectionId, ConfigStep> = {
  pump: ConfigStep.MechanicalBrand,
  filter: ConfigStep.Filtration,
  heater: ConfigStep.Heating,
};

const SECTIONS: SectionMeta[] = [
  {
    id: 'pump',
    label: 'Pump',
    icon: Wrench,
    needHint: (gpm) => `need ${gpm} GPM`,
  },
  {
    id: 'filter',
    label: 'Filter',
    icon: FilterIcon,
    needHint: (gpm, _btu, filt) => `need ${gpm} GPM${filt ? ` · ${filt}` : ''}`,
  },
  {
    id: 'heater',
    label: 'Heater',
    icon: Flame,
    needHint: (_gpm, btu) => `need ${fmtBtu(btu)} BTU/hr`,
  },
];

const FILTER_MEDIA_OPTIONS: FilterMediaType[] = ['Sand', 'Cartridge', 'DE', 'Glass Media'];
const HEATER_SYSTEM_OPTIONS: HeaterSystemType[] = ['Gas Heater', 'Heat Pump', 'Electric'];

function fmtBtu(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

interface SectionFilterState {
  brand: string | null;
  media: FilterMediaType | null;
  system: HeaterSystemType | null;
  onlyMatches: boolean;
}

const DEFAULT_SECTION_FILTERS: SectionFilterState = {
  brand: null,
  media: null,
  system: null,
  onlyMatches: true,
};

export function EquipmentOptionsPanel({ designGpm, requiredBtuHr }: Props) {
  const { state, dispatch } = useApp();
  const d = state.data;

  const requirements: EquipmentRequirements = useMemo(() => ({
    designGpm,
    requiredBtuHr,
    filtrationType: d.filtrationType,
    heatingSystemTypes: d.heatingSystem,
  }), [designGpm, requiredBtuHr, d.filtrationType, d.heatingSystem]);

  // ── Selected product lookup (read from projectItems → catalog) ──
  const flatChildren = useMemo(
    () => state.projectItems.flatMap((i) => i.children ?? []),
    [state.projectItems],
  );
  const selectedPumpPart = flatChildren.find((c) => c.id === 'pump')?.partNo ?? null;
  const selectedFilterPart = flatChildren.find((c) => c.id === 'filter')?.partNo ?? null;
  const selectedHeaterPart = flatChildren.find((c) => c.id === 'heater')?.partNo ?? null;

  const selectedPump = useMemo(
    () => PUMP_CATALOG.find((p) => p.partNo === selectedPumpPart) ?? null,
    [selectedPumpPart],
  );
  const selectedFilter = useMemo(
    () => FILTER_CATALOG.find((f) => f.partNo === selectedFilterPart) ?? null,
    [selectedFilterPart],
  );
  const selectedHeater = useMemo(
    () => HEATER_CATALOG.find((h) => h.partNo === selectedHeaterPart) ?? null,
    [selectedHeaterPart],
  );

  const selections: Record<SectionId, CatalogProduct | null> = {
    pump: selectedPump,
    filter: selectedFilter,
    heater: selectedHeater,
  };

  function meetsRequirement(product: CatalogProduct): boolean {
    if (product.kind === 'pump') return (product as PumpProduct).maxFlowGpm >= designGpm;
    if (product.kind === 'filter') return (product as FilterProduct).maxFlowGpm >= designGpm;
    return (product as HeaterProduct).outputBtuHr >= requiredBtuHr;
  }

  const [openCards, setOpenCards] = useState<Record<SectionId, boolean>>({
    pump: true,
    filter: true,
    heater: true,
  });
  const toggleCard = (id: SectionId) =>
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));

  const openConfigurator = useCallback(
    (step: ConfigStep) => {
      dispatch({ type: 'SET_WORKSPACE', workspace: 'configurator' });
      dispatch({ type: 'NAVIGATE_TO_STEP', step });
    },
    [dispatch],
  );

  // ── Per-section filter state ──
  const [filters, setFilters] = useState<Record<SectionId, SectionFilterState>>({
    pump: { ...DEFAULT_SECTION_FILTERS },
    filter: { ...DEFAULT_SECTION_FILTERS },
    heater: { ...DEFAULT_SECTION_FILTERS },
  });

  const updateFilter = (id: SectionId, patch: Partial<SectionFilterState>) =>
    setFilters((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // ── Filter dropdown popover state ──
  const [openFilterMenu, setOpenFilterMenu] = useState<SectionId | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openFilterMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!filterMenuRef.current?.contains(target)) {
        setOpenFilterMenu(null);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenFilterMenu(null);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [openFilterMenu]);

  // ── Catalogue results per section ──
  const productsForSection = (id: SectionId): CatalogProduct[] => {
    const f = filters[id];
    if (id === 'pump') {
      return f.onlyMatches ? matchingPumps(requirements, f.brand) : allPumps(f.brand);
    }
    if (id === 'filter') {
      return f.onlyMatches
        ? matchingFilters(requirements, f.brand, f.media)
        : allFilters(f.brand, f.media);
    }
    return f.onlyMatches
      ? matchingHeaters(requirements, f.brand, f.system)
      : allHeaters(f.brand, f.system);
  };

  function handleSelect(product: CatalogProduct) {
    if (d.isFinalized) return;
    if (product.kind === 'pump') {
      const p = product as PumpProduct;
      dispatch({
        type: 'UPDATE_PROJECT_ITEM',
        id: 'pump',
        patch: {
          partNo: p.partNo,
          brand: p.brand,
          description: `${p.model} ${p.hp}HP`,
          supplier: p.brand,
          price: p.price,
        },
      });
      dispatch({
        type: 'UPDATE_DATA',
        payload: { brandPreferences: { ...d.brandPreferences, pump: p.brand.toLowerCase() } },
      });
    } else if (product.kind === 'filter') {
      const f = product as FilterProduct;
      dispatch({
        type: 'UPDATE_PROJECT_ITEM',
        id: 'filter',
        patch: {
          partNo: f.partNo,
          brand: f.brand,
          description: `${f.model} (${f.mediaType})`,
          supplier: f.brand,
          price: f.price,
        },
      });
      dispatch({
        type: 'UPDATE_DATA',
        payload: {
          filtrationType: f.mediaType,
          brandPreferences: { ...d.brandPreferences, filtration: f.brand.toLowerCase() },
        },
      });
    } else {
      const h = product as HeaterProduct;
      dispatch({
        type: 'UPDATE_PROJECT_ITEM',
        id: 'heater',
        patch: {
          partNo: h.partNo,
          brand: h.brand,
          description: `${h.model} ${fmtBtu(h.outputBtuHr)} BTU`,
          supplier: h.brand,
          price: h.price,
        },
      });
      const updatedSystems = d.heatingSystem.includes(h.systemType)
        ? d.heatingSystem
        : [...d.heatingSystem.filter((s) => s !== 'None'), h.systemType];
      dispatch({
        type: 'UPDATE_DATA',
        payload: {
          heatingSystem: updatedSystems,
          selectedHeaterBtu: h.outputBtuHr,
          brandPreferences: { ...d.brandPreferences, heating: h.brand.toLowerCase() },
        },
      });
    }
  }

  // ── Render helpers ──
  function renderSummary(id: SectionId, selected: CatalogProduct | null): React.ReactNode {
    if (!selected) {
      const meta = SECTIONS.find((s) => s.id === id)!;
      return (
        <span className={styles.eqSummaryNone}>
          No selection · {meta.needHint(designGpm, requiredBtuHr, d.filtrationType)}
        </span>
      );
    }
    if (selected.kind === 'pump') {
      const p = selected as PumpProduct;
      return (
        <span className={styles.eqSummary}>
          <span className={styles.eqSummaryName}>
            <strong>{p.brand}</strong> {p.model}
          </span>
          <span className={styles.eqSummarySpec}>
            {p.maxFlowGpm} GPM · {p.hp} HP · ${p.price.toLocaleString()}
          </span>
        </span>
      );
    }
    if (selected.kind === 'filter') {
      const f = selected as FilterProduct;
      return (
        <span className={styles.eqSummary}>
          <span className={styles.eqSummaryName}>
            <strong>{f.brand}</strong> {f.model}
          </span>
          <span className={styles.eqSummarySpec}>
            {f.filterAreaSqFt.toFixed(1)} ft² · {f.mediaType} · ${f.price.toLocaleString()}
          </span>
        </span>
      );
    }
    const h = selected as HeaterProduct;
    return (
      <span className={styles.eqSummary}>
        <span className={styles.eqSummaryName}>
          <strong>{h.brand}</strong> {h.model}
        </span>
        <span className={styles.eqSummarySpec}>
          {fmtBtu(h.outputBtuHr)} BTU/hr · {h.systemType} · ${h.price.toLocaleString()}
        </span>
      </span>
    );
  }

  function renderStatus(selected: CatalogProduct | null) {
    if (!selected) {
      return (
        <span className={`${styles.eqStatus} ${styles.eqStatusNone}`} aria-label="No selection">
          <Circle size={14} strokeWidth={1.75} />
        </span>
      );
    }
    if (meetsRequirement(selected)) {
      return (
        <span className={`${styles.eqStatus} ${styles.eqStatusOk}`} aria-label="Selection meets requirement">
          <CircleCheck size={14} strokeWidth={2} />
        </span>
      );
    }
    return (
      <span className={`${styles.eqStatus} ${styles.eqStatusWarn}`} aria-label="Selection is undersized">
        <AlertTriangle size={14} strokeWidth={2} />
      </span>
    );
  }

  function renderFilterMenu(id: SectionId) {
    const f = filters[id];
    const isOpen = openFilterMenu === id;
    const brandsForSection = getBrandsForCategory(
      id === 'pump' ? 'pump' : id === 'filter' ? 'filtration' : 'heating',
    );

    const activeCount =
      (f.brand ? 1 : 0) +
      (id === 'filter' && f.media ? 1 : 0) +
      (id === 'heater' && f.system ? 1 : 0);

    const summary = (() => {
      const parts: string[] = [];
      if (f.brand) parts.push(f.brand);
      if (id === 'filter' && f.media) parts.push(f.media);
      if (id === 'heater' && f.system) parts.push(f.system);
      return parts.length ? parts.join(' · ') : 'All';
    })();

    const renderGroup = <V extends string>(
      label: string,
      activeValue: V | null,
      options: { value: V | null; label: string }[],
      onPick: (v: V | null) => void,
    ) => (
      <div className={styles.eqFilterMenuGroup}>
        <div className={styles.eqFilterMenuLabel}>{label}</div>
        {options.map((opt) => {
          const active = opt.value === activeValue;
          return (
            <button
              key={opt.label}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              className={`${styles.eqFilterMenuOpt} ${active ? styles.eqFilterMenuOptActive : ''}`}
              onClick={() => onPick(opt.value)}
            >
              {active && <Check size={12} aria-hidden />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );

    const brandOptions: { value: string | null; label: string }[] = [
      { value: null, label: 'All manufacturers' },
      ...brandsForSection.map((b) => ({ value: b.label, label: b.label })),
    ];
    const mediaOptions: { value: FilterMediaType | null; label: string }[] = [
      { value: null, label: 'All media' },
      ...FILTER_MEDIA_OPTIONS.map((m) => ({ value: m, label: m })),
    ];
    const systemOptions: { value: HeaterSystemType | null; label: string }[] = [
      { value: null, label: 'All types' },
      ...HEATER_SYSTEM_OPTIONS.map((s) => ({ value: s, label: s })),
    ];

    return (
      <div
        className={styles.eqFilterMenuRoot}
        ref={isOpen ? filterMenuRef : null}
      >
        <button
          type="button"
          className={`${styles.eqFilterBtn} ${activeCount > 0 ? styles.eqFilterBtnActive : ''}`}
          onClick={() => setOpenFilterMenu(isOpen ? null : id)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <SlidersHorizontal size={12} aria-hidden />
          <span className={styles.eqFilterBtnLabel}>{summary}</span>
          {activeCount > 0 && (
            <span className={styles.eqFilterBtnBadge} aria-label={`${activeCount} active`}>
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={12}
            className={`${styles.eqFilterBtnChevron} ${isOpen ? styles.eqFilterBtnChevronOpen : ''}`}
            aria-hidden
          />
        </button>
        {isOpen && (
          <div className={styles.eqFilterMenu} role="menu">
            {renderGroup('Brand', f.brand, brandOptions, (v) => updateFilter(id, { brand: v }))}
            {id === 'filter' &&
              renderGroup('Media', f.media, mediaOptions, (v) => updateFilter(id, { media: v }))}
            {id === 'heater' &&
              renderGroup('System', f.system, systemOptions, (v) => updateFilter(id, { system: v }))}
            {activeCount > 0 && (
              <button
                type="button"
                className={styles.eqFilterReset}
                onClick={() => {
                  updateFilter(id, { brand: null, media: null, system: null });
                  setOpenFilterMenu(null);
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderSectionBody(id: SectionId) {
    const products = productsForSection(id);
    const selected = selections[id];
    const selectedPart =
      id === 'pump' ? selectedPumpPart : id === 'filter' ? selectedFilterPart : selectedHeaterPart;

    return (
      <div className={styles.eqSectionBody}>
        {/* Results */}
        <div className={styles.eqResults}>
          {products.length === 0 && (
            <div className={styles.eqEmpty}>No equipment matches the current filters.</div>
          )}
          {products.map((product) => {
            const isSelected = product.partNo === selectedPart;
            const meets = meetsRequirement(product);
            const spec =
              product.kind === 'pump'
                ? `${(product as PumpProduct).maxFlowGpm} GPM · ${(product as PumpProduct).hp} HP`
                : product.kind === 'filter'
                  ? `${(product as FilterProduct).filterAreaSqFt.toFixed(1)} ft² · ${(product as FilterProduct).maxFlowGpm} GPM`
                  : `${fmtBtu((product as HeaterProduct).outputBtuHr)} BTU/hr · ${(product as HeaterProduct).efficiencyPct}% eff`;
            return (
              <div
                key={product.id}
                className={`${styles.eqRow} ${isSelected ? styles.eqRowSelected : ''} ${!meets ? styles.eqRowUnder : ''}`}
              >
                <div className={styles.eqRowMain}>
                  <span className={styles.eqBrand}>{product.brand}</span>
                  <span className={styles.eqModel}>{'model' in product ? product.model : ''}</span>
                  <span className={styles.eqSpec}>{spec}</span>
                </div>
                <div className={styles.eqRowActions}>
                  {meets ? (
                    <span className={styles.eqBadgeMeets}>Meets</span>
                  ) : (
                    <span className={styles.eqBadgeUnder}>Under</span>
                  )}
                  <span className={styles.eqPrice}>${product.price.toLocaleString()}</span>
                  {isSelected ? (
                    <span className={styles.eqSelectedBadge}>
                      <Check size={11} /> Selected
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={styles.eqSelectBtn}
                      onClick={() => handleSelect(product)}
                      disabled={d.isFinalized}
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint when nothing is selected yet for this section */}
        {!selected && products.length > 0 && (
          <p className={styles.eqSectionFooter}>
            Click <strong>Select</strong> on a row to assign it to the BOM. Rows that don't meet
            the requirement are dimmed.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {SECTIONS.map((meta) => {
        const selected = selections[meta.id];
        const f = filters[meta.id];
        const Icon = meta.icon;
        const isOpen = openCards[meta.id];
        return (
          <div key={meta.id} className={styles.section}>
            <div className={`${styles.sectionHeader} ${styles.eqCompactHeader}`}>
              <button
                type="button"
                className={styles.eqTitleToggle}
                onClick={() => toggleCard(meta.id)}
                aria-expanded={isOpen}
              >
                {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <Icon size={13} aria-hidden />
                <span>{meta.label}</span>
                {renderStatus(selected)}
              </button>
              <div className={styles.eqHeaderInline}>
                <span className={styles.eqSectionSummary}>
                  {renderSummary(meta.id, selected)}
                </span>
                {renderFilterMenu(meta.id)}
                <label className={styles.eqMatchToggle}>
                  <input
                    type="checkbox"
                    checked={f.onlyMatches}
                    onChange={(e) => updateFilter(meta.id, { onlyMatches: e.target.checked })}
                  />
                  <span>Only matches</span>
                </label>
                <button
                  type="button"
                  aria-label={`Open ${meta.label} in configurator`}
                  className={styles.eqOpenConfigBtn}
                  disabled={d.isFinalized}
                  onClick={() => openConfigurator(OPEN_IN_CONFIGURATOR[meta.id])}
                >
                  Open configurator
                </button>
              </div>
            </div>
            {isOpen && renderSectionBody(meta.id)}
          </div>
        );
      })}
    </>
  );
}
