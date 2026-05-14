# Manufacturer Selection — Decision Doc & Recommended Pattern

Design spec addressing Travis's Apr 24 question: "thoughts on how to select manufacturers as part of the process." Brands are a global setting curated by superadmins in BackOffice and imported from dealer catalogues.

**Status: Pending product input.** Travis's message was cut off. Open questions are captured in [docs/travis-apr24-decisions.md](travis-apr24-decisions.md). This spec describes three candidate patterns and recommends one, but final direction depends on answers.

---

## Current State

- `mechanicalKnowledge` ([src/types.ts](../src/types.ts)) gates the flow:
  - `'know'` → shows `MechanicalBrand` step (free-text `TextInput` for `mechanicalBrandPreference`)
  - `'help'` → shows `MechanicalPriorities` step (multi-select: Budget, Efficiency, Reliability, etc.)
- `mechanicalBrandPreference` is a single string — no structure, no validation, no catalogue link.
- Mechanical Systems group has 6 steps today: System Knowledge → Brand Preference → Priorities → Filtration → Sanitation → Heating. Each equipment step (Filtration, Sanitation, Heating) is independent — none references a brand.

### Constraint from Travis

Brands are:
- **Global** — set in BackOffice, not per-project.
- **Superadmin-curated** — only superadmins add/edit brands.
- **Imported from dealer catalogues** — brands are tied to dealers/distributors.

This means the project-side picker selects *from* a known set, not free-text entry. The BackOffice brand catalogue is the source of truth.

---

## Pattern Catalog

### Pattern A — Global Preferred Brand

One project-wide picker: "Which manufacturer do you prefer?" User selects a single brand (e.g., "Pentair") and it applies as the default for all equipment types.

```
┌──────────────────────────────────────────────┐
│ Brand Preference                             │
│                                              │
│ Preferred Manufacturer                       │
│ ┌──────────────────────────────────────────┐ │
│ │ 🔍 Search brands...              ▾      │ │
│ │ ┌─────────┐ ┌───────┐ ┌──────────────┐ │ │
│ │ │ Pentair │ │ Hayward│ │ Jandy        │ │ │
│ │ └─────────┘ └───────┘ └──────────────┘ │ │
│ │ ┌──────────────┐ ┌────────────────────┐ │ │
│ │ │ Zodiac       │ │ Waterway           │ │ │
│ │ └──────────────┘ └────────────────────┘ │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [○ No preference — auto-select best match]   │
└──────────────────────────────────────────────┘
```

| Strength | Weakness |
|----------|----------|
| Simple — one interaction, one stored value | Cannot mix brands across systems |
| Works for brand-loyal customers / sales flow | Doesn't reflect reality (many projects mix Pentair pumps with Hayward filters) |
| Minimal data model change | "Preferred" vs "required" ambiguity — does it lock products or just suggest? |
| Maps cleanly to existing `mechanicalBrandPreference` field | — |

**Verdict:** Fastest to ship; good enough for sales-mode quoting. Insufficient for engineering where mixed brands are normal.

### Pattern B — Per-System Brand (recommended)

Each equipment category (pump, filter, heater, sanitation, controller) gets its own brand picker. The picker appears inline within the corresponding step form.

```
┌──────────────────────────────────────────────┐
│ Filtration                                   │
│                                              │
│ Preferred Brand                              │
│ ┌──────────────────────────────────────────┐ │
│ │ [Pentair ✕]                              │ │
│ │ 🔍 Search brands...                      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Filter Type                                  │
│ [Sand] [Cartridge] [DE] [Glass Media]        │
│                                              │
│ ── (Cartridge selected) ──                   │
│                                              │
│ Products matching Pentair + Cartridge:        │
│ ┌────────────────────────────────────────┐   │
│ │ Pentair Clean & Clear Plus 420   $680  │   │
│ │ Pentair Clean & Clear Plus 520   $820  │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

| Strength | Weakness |
|----------|----------|
| Reflects real-world mixed-brand projects | More interactions — user picks brand per system |
| "Any / auto" default keeps it fast for users who don't care | Requires brand data per equipment category in the catalogue |
| Naturally filters the product picker downstream | Data model grows: `brandPreference` becomes a map |
| Per-system picker can show product availability | — |

**Verdict:** Best fit for both sales and engineering. Requires a brand catalogue with category tags, which aligns with the dealer-import workflow Travis described.

### Pattern C — Preferred + Acceptable (tiered)

Two lists per system: "Preferred" (first choice) and "Acceptable" (fallback). The product picker prioritizes preferred brands, then fills gaps from acceptable.

| Strength | Weakness |
|----------|----------|
| Handles multi-vendor distributor scenarios | Complex UI — two multi-selects per system |
| Explicit priority, no guessing | Overkill for v1; adds decision fatigue |
| Useful for procurement bidding | — |

**Verdict:** Too complex for v1. Revisit if procurement/bidding becomes a feature.

---

## Recommendation: Pattern B — Per-System Brand

### Where It Lives

The brand picker appears **inside** each equipment step form (`FiltrationForm`, `SanitationForm`, `HeatingForm`, etc.) as a new field above the equipment-type selector. This way, brand selection naturally scopes to the equipment being configured.

### What Replaces What

| Current | New |
|---------|-----|
| `MechanicalBrand` step (free-text `TextInput`) | **Remove** as a standalone step |
| `mechanicalBrandPreference: string` | Replace with `brandPreferences: Record<EquipmentCategory, string \| null>` |
| `MechanicalKnowledge` step ("know" vs "help") | **Keep** — but "know" no longer shows a single brand input. Instead, "know" pre-expands brand fields in each equipment form. "Help" hides them and uses auto-selection. |

### Equipment Categories

```typescript
type EquipmentCategory =
  | 'filtration'
  | 'sanitation'
  | 'heating'
  | 'pump'
  | 'controller'
  | 'lighting';
```

Not all categories have dedicated step forms today (pump, controller, lighting are not yet configurator steps). The brand preferences map can pre-populate these keys with `null`; forms are added later as the configurator grows.

### Picker Primitive: `BrandSelect`

A typeahead/combobox that searches the brand catalogue. If the catalogue is small (≤15 brands), chips may work instead. For v1, assume 8–20 brands.

```typescript
interface BrandSelectProps {
  /** Equipment category this picker is for. */
  category: EquipmentCategory;

  /** Currently selected brand value (null = "Any"). */
  value: string | null;

  /** Available brands for this category (from catalogue). */
  brands: { value: string; label: string; dealer?: string; logoUrl?: string }[];

  /** Called with brand value or null for "Any". */
  onChange: (value: string | null) => void;

  /** Disables interaction (finalized project). */
  disabled?: boolean;
}
```

### Rendering

```
┌────────────────────────────────────────┐
│ Preferred Brand                        │
│ ┌────────────────────────────────────┐ │
│ │ [logo] Pentair           ✕        │ │  ← selected state: chip with clear
│ └────────────────────────────────────┘ │
│                                        │
│ ── or, when no brand selected: ──      │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 🔍 Search brands...               │ │  ← empty state: text input
│ │ ┌────────────────────────────────┐ │ │
│ │ │ [P] Pentair  · PoolCorp       │ │ │  ← dropdown option: logo + name + dealer
│ │ │ [H] Hayward  · SRS Distribut. │ │ │
│ │ │ [J] Jandy    · PoolCorp       │ │ │
│ │ │ [✦] Any / no preference       │ │ │  ← always-last option
│ │ └────────────────────────────────┘ │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

- Logo placeholder: colored circle with first letter of brand name (same pattern as project avatars in `ProjectsList`).
- Dealer source shown as muted text after the brand name — builds trust, connects to the BackOffice import.
- "Any / no preference" always appears as the last option. Selecting it clears the brand and auto-selects based on priorities or cost.

### Keyboard

| Key | Behavior |
|-----|----------|
| Type | Filters brand list |
| Arrow Down/Up | Navigate options |
| Enter | Select focused option |
| Escape | Close dropdown without selecting |
| Backspace (on chip) | Clear selected brand → revert to "Any" |

### How It Feeds Downstream

When a brand is selected:
- The product picker (filter products, heater products, etc.) pre-filters to that brand.
- If no products match the brand + equipment-type combination, show a warning: "No [Brand] products match this filter type. Showing all brands."
- The Engineering workspace and BOM inherit the brand preference for product selection.

---

## Data Model Changes

### Brand Catalogue (BackOffice side — for context)

```typescript
interface Brand {
  id: string;
  name: string;
  shortName: string;
  dealer: string;            // importing dealer/distributor
  categories: EquipmentCategory[];  // which equipment types this brand covers
  logoUrl?: string;
  active: boolean;
}
```

This lives in BackOffice and is imported from dealer catalogues. The project-side picker consumes it read-only.

### Project Data

```typescript
// In ProjectData:
brandPreferences: Record<EquipmentCategory, string | null>;

// Default value:
brandPreferences: {
  filtration: null,
  sanitation: null,
  heating: null,
  pump: null,
  controller: null,
  lighting: null,
}
```

### Migration

The existing `mechanicalBrandPreference: string` field can be deprecated. If a value exists, migrate it to `brandPreferences.filtration` (or all categories) as a one-time conversion.

---

## Open Questions (for Travis)

Captured in [docs/travis-apr24-decisions.md](travis-apr24-decisions.md):

1. Travis's message was cut off after "lets assume there is..." — what was the rest?
2. Do brands have compatibility constraints (e.g., "Pentair pump requires Pentair controller")?
3. Should Sales mode hide per-system brands and show a single global picker (Pattern A) for speed?
4. What does "I don't care" route to — auto-select cheapest? auto-select by priority ranking?
5. What fields does the dealer catalogue import include (logo, website, contact, distributor territory)?

---

## Files Brett Touches

| File | Change |
|------|--------|
| `src/types.ts` | Add `EquipmentCategory` type; add `brandPreferences` to `ProjectData`; deprecate `mechanicalBrandPreference` |
| `src/store.ts` | Update `DEFAULT_DATA` with `brandPreferences` default; migration logic for old field |
| `src/components/ui/BrandSelect.tsx` | **New file** — typeahead brand picker |
| `src/components/ui/BrandSelect.module.css` | **New file** — styles |
| `src/components/StepForms/FiltrationForm.tsx` | Add `BrandSelect` above the filter type picker |
| `src/components/StepForms/SanitationForm.tsx` | Add `BrandSelect` above the sanitation type picker |
| `src/components/StepForms/HeatingForm.tsx` | Add `BrandSelect` above the heating system picker |
| `src/data/brands.ts` | **New file** — mock brand catalogue for dev/demo |
| `src/components/StepForms/MechanicalForm.tsx` | Update "know" path to remove standalone brand TextInput; adjust copy |
