# Nested Picker — Pattern Catalog & Pool Recirculation Redesign

Design spec for a hierarchical option selector. Addresses Travis's Apr 24 request for nested choices in the configurator and directly replaces the current flat "Gutter Style" step with "Pool Recirculation" (11 options, grouped).

---

## Problem

`OptionButton` ([src/components/ui/OptionButton.tsx](../src/components/ui/OptionButton.tsx)) renders a flat chip grid. It works for ≤6 items with no hierarchy (e.g., Filtration: 3 options). It breaks down when:

- The option count grows beyond ~6 (cognitive load, scrolling).
- Options have a natural parent → child structure (e.g., "Gutter → Stainless Steel → Rollout").
- The same primitive needs to serve both the 11-option Pool Recirculation list and the 20-option ISPSC Pool Use Type list.

Travis's example:

```
User picks "Gutter" →
  Stainless Steel – Rollout
  Concrete Gutter
then picks "Stainless Steel" →
  Deck Level (Weirs)
  Deck Level
  Rollout
or picks "Concrete Gutter" →
  Deck Level
  Rollout
  Rollout w/ Parapet
  Fully Recessed
```

---

## Pattern Catalog

### Pattern A — Flat Chips (current)

Single-level grid of `OptionButton` chips. No grouping.


| Strength                             | Weakness                     |
| ------------------------------------ | ---------------------------- |
| Minimal interaction cost (one click) | Overwhelming at 7+ items     |
| Familiar from existing forms         | Cannot express hierarchy     |
| Works at any width                   | Labels compete for attention |


**Verdict:** Keep for ≤6 ungrouped options. Not suitable here.

### Pattern B — Two-Step Picker

Step 1: user picks a **family** (e.g., Skimmer, Gutter, Coping, None). Rendered as a top-level `OptionButton` row.

Step 2: if the family has variants, a second row appears below (animated slide-down) showing the **variant** chips within that family.

Selection state stores both: `{ family: 'gutter', variant: 'concrete-deck-level' }`. Display value is the variant label; family is implicit.


| Strength                                      | Weakness                                    |
| --------------------------------------------- | ------------------------------------------- |
| Progressive disclosure — few options per step | Requires two interactions                   |
| Reuses existing `OptionButton` styling        | Family step feels like a detour for experts |
| Scales to any number of variants per family   | Needs clear visual link between steps       |
| Keyboard-navigable (Tab / Arrow / Enter)      | State management slightly more complex      |


**Verdict:** Best fit for 7–14 total options with a clear 2–4 family grouping. Recommended for Pool Recirculation.

### Pattern C — Grouped Chips with Section Headers

All options rendered in one view, organized under non-interactive section headers (e.g., "Skimmer", "Gutter — Stainless Steel", "Gutter — Concrete"). Each header is a `<span>` or `<h4>`, followed by a row of chips.


| Strength                                   | Weakness                                   |
| ------------------------------------------ | ------------------------------------------ |
| One-click selection (no drill-down)        | Visually dense — 11+ chips on screen       |
| Hierarchy visible at a glance              | Headers consume vertical space             |
| Easy to implement (map over grouped array) | Doesn't scale beyond ~14 items comfortably |


**Verdict:** Viable for 7–14 options if groups are small (2–3 items each). Slightly noisy for Pool Recirculation's 11 items across 5 groups. Acceptable fallback.

### Pattern D — Searchable Combobox with Groups

Dropdown / popover with type-ahead search, options organized under group headers inside the list. Selected value shown as a chip/pill above the input.


| Strength                                   | Weakness                                         |
| ------------------------------------------ | ------------------------------------------------ |
| Scales to 20+ options gracefully           | Higher interaction cost (open → search → select) |
| Familiar from IDE command palettes         | Requires a new `Combobox` primitive              |
| Works for Pool Use Type (20 ISPSC classes) | Less visual — options hidden until opened        |


**Verdict:** Best for 15+ items. Will be needed for Pool Use Type. Not required for Pool Recirculation (11 items).

---

## Recommendation Matrix


| Option count | Hierarchy? | Pattern           | Notes                                       |
| ------------ | ---------- | ----------------- | ------------------------------------------- |
| ≤6           | No         | Flat Chips (A)    | Current `OptionButton` — no change          |
| ≤6           | Yes        | Two-Step (B)      | Rare case; treat as flat if only 2 families |
| 7–14         | Yes        | **Two-Step (B)**  | Recommended for Pool Recirculation          |
| 7–14         | No         | Grouped Chips (C) | Fallback if no natural families             |
| 15+          | Yes or No  | Combobox (D)      | Future: Pool Use Type (20 ISPSC classes)    |


---

## Pool Recirculation — Concrete Redesign

### Rename

- Step label: "Gutter Style" → **"Pool Recirculation"**
- File: `GutterStyleForm.tsx` → `PoolRecirculationForm.tsx`
- Data field: `gutterStyle` → `recirculationStyle` (or keep `gutterStyle` as internal key and relabel in UI only — Brett's call)
- Step definition in `types.ts`: update `ConfigStep.GutterStyle` label to "Pool Recirculation", group stays "Pool Design"

### Option Taxonomy (11 items, 3 families)

```
Family: Skimmer
├── Skimmers with 12" coping
├── Skimmers with 18" coping
├── Coping – no skimmers
└── No gutter – splash pad

Family: Gutter — Stainless Steel
├── Deck level (weirs)
├── Deck level
└── Rollout

Family: Gutter — Concrete
├── Deck level
├── Rollout
├── Rollout w/ parapet
└── Fully recessed
```

### Two-Step Picker Behavior

```
┌─────────────────────────────────────────────────────────┐
│ Pool Recirculation                                      │
│                                                         │
│ Family                                                  │
│ ┌──────────┐ ┌──────────────────┐ ┌───────────────────┐│
│ │ Skimmer  │ │ Gutter — SS      │ │ Gutter — Concrete ││
│ └──────────┘ └──────────────────┘ └───────────────────┘│
│                                                         │
│ ── (user picks "Gutter — Concrete") ──                  │
│                                                         │
│ Style                                                   │
│ ┌────────────┐ ┌─────────┐ ┌──────────────────┐        │
│ │ Deck level │ │ Rollout │ │ Rollout w/ parapet│        │
│ └────────────┘ └─────────┘ └──────────────────┘        │
│ ┌────────────────┐                                      │
│ │ Fully recessed │                                      │
│ └────────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

**Step 1 selection** highlights the family chip and reveals Step 2. Changing the family collapses the old variant row (120 ms ease-out) and expands the new one (160 ms ease-in).

**Step 2 selection** highlights the variant chip. The combined value (e.g., `"concrete-deck-level"`) is stored in `ProjectData.gutterStyle` (or its renamed field).

**Display value** (shown in the left-rail group nav and summary): the variant label only (e.g., "Deck level") — the family is contextually obvious from the group. If ambiguity exists, prefix: "Concrete — Deck level".

### Deselection

Clicking an already-selected family deselects both family and variant. Clicking an already-selected variant deselects only the variant (family stays selected, no value committed).

---

## NestedOptionButton — Primitive Spec

### Props

```typescript
interface NestedOptionButtonProps {
  /** Top-level label (e.g., "Pool Recirculation"). */
  label: string;

  /** Grouped options. Each group becomes a family chip. */
  groups: {
    family: string;       // unique key (e.g., "skimmer")
    label: string;        // display label (e.g., "Skimmer")
    options: {
      value: string;      // stored value (e.g., "skimmer-12in-coping")
      label: string;      // display label (e.g., 'Skimmers with 12" coping')
      cost?: number;      // optional cost badge, same as OptionButton
    }[];
  }[];

  /** Currently selected value (the variant-level value). */
  value: string | null;

  /** Called with the variant-level value on selection. */
  onChange: (value: string) => void;

  /** Disables interaction (finalized project). */
  disabled?: boolean;
}
```

### Derived State

The component derives the active family from `value` by searching `groups[].options[].value`. No separate family state is exposed to the parent — the value alone is the source of truth.

### Keyboard


| Key                | Behavior                                                                |
| ------------------ | ----------------------------------------------------------------------- |
| Tab                | Move focus between family row and variant row                           |
| Arrow Left / Right | Move focus within a row                                                 |
| Enter / Space      | Select focused chip                                                     |
| Escape             | Deselect variant (keep family); if no variant selected, deselect family |


### Accessibility

- Family row: `role="radiogroup"`, `aria-label="{label} — family"`
- Each family chip: `role="radio"`, `aria-checked`
- Variant row: `role="radiogroup"`, `aria-label="{label} — {activeFamily.label}"`
- Each variant chip: `role="radio"`, `aria-checked`
- Transition: variant row uses `aria-live="polite"` so screen readers announce when options change

### Styling

Reuses all tokens from `ui.module.css` (`.optionGrid`, `.optionBtn`, `.optionActive`, `.optionDot`). New additions:

- `.nestedGroup`: wrapper for the variant row; `overflow: hidden; max-height: 0` when collapsed, animated to `max-height: 300px` on open.
- `.familyRow` / `.variantRow`: semantic wrappers; no visual difference from existing chip rows beyond spacing.
- Family-level chips may use a slightly heavier font-weight (600 vs 400) to distinguish hierarchy level visually. Uses `--fs-sm` for variant labels, `--fs-base` for family labels.

---

## Reuse Across the App


| Future use case                      | How this primitive applies                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pool Use Type (20 ISPSC classes)** | Too many items for two-step picker; use Combobox (Pattern D) with the same `groups` data shape. The `groups` prop schema is shared.                                                    |
| **Manufacturer per system**          | Each mechanical system (pump, filter, heater) gets a picker against the brand catalogue. If brands are grouped by dealer/distributor, the same `groups` shape works inside a Combobox. |
| **Code selection**                   | Codes grouped by jurisdiction scope (model / state / county / city) — Combobox with groups.                                                                                            |


The `groups` data shape is the common thread. The rendering primitive changes by option count; the data contract stays the same.

---

## Files Brett Touches


| File                                           | Change                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/OptionButton.tsx`           | No change — keep for flat lists                                                                                                 |
| `src/components/ui/NestedOptionButton.tsx`     | **New file** — implement the two-step picker per spec above                                                                     |
| `src/components/ui/ui.module.css`              | Add `.nestedGroup`, `.familyRow`, `.variantRow` styles                                                                          |
| `src/components/StepForms/GutterStyleForm.tsx` | Rename to `PoolRecirculationForm.tsx`; replace `OptionButton` with `NestedOptionButton`; update options to the 11-item taxonomy |
| `src/types.ts`                                 | Update `ConfigStep.GutterStyle` label to "Pool Recirculation" in `STEP_DEFINITIONS`                                             |
| `src/data/configCosts.ts`                      | Add cost entries for the new recirculation option values                                                                        |
| `src/components/StepEditor/StepEditor.tsx`     | Update form import/map for the renamed component                                                                                |


