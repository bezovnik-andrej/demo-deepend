# Data source audit (`src/data`)

This inventory lists each TypeScript data module under `src/data/`, what it feeds in the app, and a **placeholder** Google Sheet name for Andrej to map. Update the “Suggested Sheet” column to match your real workbook tabs.

| File | Primary consumers | Shape / role | Suggested Sheet |
|------|-------------------|--------------|-----------------|
| `brands.ts` | Brand pickers (mechanical, filtration, heating) | Brand lists keyed by equipment category | `Brands` |
| `codeJurisdiction.ts` | `LocalCodeDetailsForm` — demo state → suggested standards | Curated suggestions only | `Code_Jurisdiction_Map` |
| `codeStandards.ts` | Local code multi-select | Fixed `CODE_STANDARDS` list | `Code_Standards` |
| `companyCatalog.ts` | Catalog workspace, stale-line refresh | Company template definitions | `Company_Catalog` |
| `configCosts.ts` | OptionButton / nested option costs | Cost hints per option value | `Config_Costs` |
| `designGpm.ts` | Engineering / hydraulics helpers | Design-flow constants | `Design_GPM` |
| `equipmentCatalog.ts` | Filtration catalogue, equipment panels, heaters | Pumps, filters, heaters, lights | `Equipment_Catalog` |
| `engineering.ts` | Turnover standards, class-based rules | Turnover hours tables | `Engineering_Turnover` |
| `filterSizing.ts` | `FiltrationForm`, engineering summaries | Pure sizing math (no static table) | _N/A — formulas_ |
| `finishCatalog.ts` | `InteriorFinishForm` (extended finishes) | Demo finish families / lines | `Finish_Catalog` |
| `heaterSizing.ts` | `HeatingForm`, engineering workspace | Pure sizing + comparison helpers | _N/A — formulas_ |
| `hydraulicsHead.ts` | Pipe sizing, TDH estimate | Pipe tables + coefficients | `Hydraulics_Head` |
| `inflationHints.ts` | Configurator summary build-month drift | UI-only % hints | `Inflation_Hints` |
| `inletPlanning.ts` | Engineering inlet counts | Inlet planner rules | `Inlet_Planning` |
| `inventory.ts` | BOM swap modal | Demo stock rows | `Inventory` |
| `poolSections.ts` | Volume calculator, engineering | Section geometry helpers | _N/A — geometry_ |
| `poolTypes.ts` | Pool use form, turnover, filter defaults | `POOL_TYPES` + groups | `Pool_Types` |
| `projectHistory.ts` | History workspace | Demo timeline entries | `Project_History_Seed` |
| `projectItemSwap.ts` | BOM swap allocations | Pure merge logic | _N/A — logic_ |
| `projectItems.ts` | Default BOM tree, flatten helpers | Seed line items | `Project_Items_Seed` |
| `projectProfiles.ts` | Demo project loader | Full profile payloads | `Project_Profiles` |
| `projectTemplates.ts` | Template presets | Partial `ProjectData` presets | `Project_Templates` |
| `recirculationOptions.ts` | Gutter / recirculation labels | Nested recirculation metadata | `Recirculation_Options` |
| `sewerLineSizing.ts` | Filtration sewer pairing (demo) | Nominal pipe → demo gpm cap | `Sewer_Line_Table` |

## Sync direction (to fill in with Andrej)

- **Sheets → TS:** export CSV / structured range → codegen or manual paste into `src/data/*.ts`.
- **TS → Sheets:** treat this repo as source of truth for demo data; script push is not wired yet.

## Last touched

Git history is the source of truth for “last edited”; rerun `git log --follow -- src/data/<file>` when auditing.
