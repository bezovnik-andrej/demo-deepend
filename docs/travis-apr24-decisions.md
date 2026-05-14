# Travis Apr 24 — Open Product Decisions

Questions surfaced during design spec work on the four items from Travis's Apr 24 feedback. Grouped by topic. Each question needs a product answer before Brett starts implementation.

Related specs:
- [docs/landing-page.md](landing-page.md)
- [docs/navigation-home.md](navigation-home.md)
- [docs/manufacturer-selection.md](manufacturer-selection.md)
- [docs/nested-picker.md](nested-picker.md)

---

## 1. Landing Page

| # | Question | Context | Impact if unanswered |
|---|----------|---------|---------------------|
| L1 | **Which filters ship in v1?** Spec proposes: project type, status, customer. Should we also include pool type, engineer, or deadline range? | `MockProject` has all these fields. More filters = more implementation time. | Brett builds filter UI; adding filters later is low-cost but layout may shift. |
| L2 | **Default sort order?** Spec recommends `modified` descending (most recent first). Is that right, or should it be by deadline urgency? | Engineers might prefer deadline-first to see what's overdue. | Affects table render order and sort indicator default. |
| L3 | **Where does "New Project" go?** Three options: (A) source picker (template/chat/blank), (B) direct to chat, (C) blank project. Spec recommends A. | The source picker at `wizardPhase: 'template'` is fully built. | Determines the click target of the primary CTA button. |
| L4 | **Role-aware landing?** Should the landing look different for Sales vs Engineer vs PM? Or one view for all? | `UserMode` already has `'engineer' \| 'sales'`. Could toggle visible columns or sort. | If yes, design needs a second pass for Sales-specific landing. Low priority for v1. |

---

## 2. Navigation Home

| # | Question | Context | Impact if unanswered |
|---|----------|---------|---------------------|
| N1 | **Breadcrumb or clickable logo?** Spec recommends breadcrumb (`Projects › Project Name`). Travis, does that match your expectation? | Breadcrumb is more explicit; clickable logo is more compact. | Changes TitleBar layout. |
| N2 | **Keep project data cached on return, or clear it?** If cached, user can navigate back to the same project instantly. If cleared, every project open is a fresh load. | Cached is better UX (no re-fetch). Cleared is simpler state management. | Affects reducer logic for `RETURN_TO_LANDING`. |
| N3 | **Auto-save on leave?** Should navigating away auto-save, prompt to save, or silently discard? Spec recommends a confirm dialog with three options (Save & Leave / Leave / Cancel). | Auto-save is friendlier but may save incomplete config unintentionally. | Determines whether `SAVE_PROJECT` fires automatically. |

---

## 3. Manufacturer Selection

| # | Question | Context | Impact if unanswered |
|---|----------|---------|---------------------|
| M1 | **Travis's cut-off message.** Your message ended at "lets assume there is..." — what was the rest? | May contain critical constraints or examples. | Could change the recommended pattern entirely. |
| M2 | **Per-system or global?** Spec recommends per-system (brand picker inside each equipment form). Is that the right granularity? | Many real projects mix brands (Pentair pumps + Hayward filters). Global is simpler but less realistic. | Determines data model (`string` vs `Record<EquipmentCategory, string>`). |
| M3 | **Brand compatibility constraints?** Do some brands require matching across systems (e.g., "Pentair IntelliFlo requires Pentair IntelliConnect")? | If yes, the picker needs cross-system validation. If no, each picker is independent. | Adds validation logic and potentially warning UI. |
| M4 | **Sales vs Engineer mode difference?** Should Sales mode show a simpler global brand picker while Engineer mode shows per-system? | Would mean two different UI states for the same data. | Adds conditional rendering logic. |
| M5 | **What does "no preference" do?** Auto-select cheapest? Auto-select by priority ranking? Leave all products available? | Affects downstream product filtering in BOM/procurement. | Determines auto-selection algorithm. |
| M6 | **Dealer catalogue schema.** What fields does the import include? Brand name, logo, website, contact, distributor territory, supported equipment categories? | Drives the `Brand` data model and what the picker can display. | Determines picker option rendering (logo, dealer name, etc.). |

---

## 4. Nested Picker / Pool Recirculation

| # | Question | Context | Impact if unanswered |
|---|----------|---------|---------------------|
| P1 | **Confirm the 3-family grouping.** Spec groups the 11 options as: Skimmer (4), Gutter — Stainless Steel (3), Gutter — Concrete (4). Does that match Travis/Andrej's intent, or should it be 2 families (Skimmer vs Gutter) with material as a sub-level? | Travis mentioned asking Andrej for a nested structure. If Andrej's structure differs, the grouping changes. | Changes the two-step picker's first row (2 families vs 3). |
| P2 | **Data field rename?** `gutterStyle` → `recirculationStyle`? Or keep `gutterStyle` as the internal key and only relabel in UI? | Renaming the field is cleaner long-term but requires migration. Relabeling is zero-risk. | Affects `ProjectData` interface and all references. |
| P3 | **Pool Use Type — same pattern or Combobox?** The nested picker spec notes that 20 ISPSC pool types need a Combobox (Pattern D). Should both pickers (Recirculation + Pool Use) use the same primitive, or are they different enough to warrant two components? | The `groups` data shape is shared; only the rendering differs. | Determines whether Brett builds one or two primitives. Spec recommends two (NestedOptionButton for ≤14, Combobox for 15+), sharing the data contract. |

---

## 5. Cross-Cutting

| # | Question | Context | Impact if unanswered |
|---|----------|---------|---------------------|
| X1 | **How do brand picker and nested picker compose?** If manufacturer goes per-system, the Filtration form will have *both* a brand select *and* a filter-type selector. Should brand appear above or below the type selector? Above means "pick brand first, then type" (narrows products). Below means "pick type first, then brand" (narrows brands). | Spec recommends brand above type (top-down narrowing). | Determines form layout order in each equipment step. |
| X2 | **Priority vs parallel?** Should Brett build the landing page and navigation first (unblocks daily use) or the nested picker first (unblocks configurator accuracy)? Or parallel? | Landing is a UX gap (audit item 1.1); nested picker is a data accuracy gap (wrong gutter options). | Affects sprint planning. Spec recommends nested picker first (higher leverage), landing in parallel. |
