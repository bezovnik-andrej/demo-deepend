# UX Audit: Norveo Demo

**Scope:** Full demo application: login, portal, projects landing, new-project setup, AI chat, structured wizard, configurator, KPI bar, BOM, estimate, procurement, design canvas, engineering, files/history, back office, theme and responsive states.
**Audience:** Sales/demo users evaluating the end-to-end Norveo workflow on a laptop-sized viewport.
**Assumptions:** Demo data is intentionally hard-coded, but it should behave as if it is project-specific and internally consistent.

## Executive Summary

The demo has a strong visual direction and several well-built interaction primitives, especially the configurator, BOM, and procurement lifecycle. The largest UX risk is credibility: project cards look distinct, but opening them has historically reused the same underlying configurator, files, and procurement state. The second risk is flow continuity: new-project setup should clearly move from source selection to AI/structured decisions to a prefilled configurator, with calculations and orders reacting to the chosen data.

## Summary

| Severity | Count |
|----------|-------|
| Blocker | 4 |
| Major | 8 |
| Minor | 8 |
| Observation | 4 |

## Findings

### Project Cards Open Reused Demo State

- **Severity:** Blocker
- **Where:** `src/components/ProjectsLanding/ProjectsLanding.tsx`, `src/store.ts`, `src/data/projectTemplates.ts`
- **Evidence:** Project cards dispatch `OPEN_PROJECT` with only a preset; the reducer changes `state.data` but leaves `projectItems`, `projectFiles`, `activityLog`, and `engineeringFlowAddGpm` untouched. Only Smith Residence has a full preset.
- **Impact:** Demo users notice that different customers load the same BOM, procurement state, and calculations, which breaks trust in the product story.
- **Recommendation:** Use complete per-project profiles that include configurator data, BOM items, files, activity, and procurement states.

### New-Project Source Choices Collapse Into The Same Chat Path

- **Severity:** Blocker
- **Where:** `src/components/WorkspaceLanding/WorkspaceLanding.tsx`, `src/components/ProjectChat/ProjectChat.tsx`
- **Evidence:** Starting from an existing project, a template, or blank AI setup all route through chat or land with partial data. Template/project starts should preserve their source and move into the structured wizard.
- **Impact:** Users cannot understand when they are copying a project versus using AI from scratch.
- **Recommendation:** Route project/template sources into the structured wizard with visible prefill; route only blank AI into chat.

### Chat Values Do Not Match Configurator Values

- **Severity:** Blocker
- **Where:** `src/components/ProjectChat/ProjectChat.tsx`, step forms under `src/components/StepForms`
- **Evidence:** Chat emits labels such as `Deck Level`, `Salt Chlorine`, and `UV + Chlorine`, while forms expect canonical values such as `concrete-deck-level`, `Saltwater Chlorine Generator`, and separate secondary sanitation arrays.
- **Impact:** The configurator appears incomplete after the AI flow even when users answered the question.
- **Recommendation:** Normalize chat answers before updating `ProjectData`.

### Procurement Has UI But Insufficient Demo Data

- **Severity:** Blocker
- **Where:** `src/components/Workspaces/OrderSummary.tsx`, `src/data/projectItems.ts`
- **Evidence:** `OrderSummary` can transition pending to placed to completed, but seeded project items are mostly purchased/not-required, so Pending and Placed are weak.
- **Impact:** The procurement demo can look empty or static.
- **Recommendation:** Seed each project with lifecycle-appropriate item statuses and add fast status controls in the BOM.

### KPI And Summary Values Need Project-Specific Inputs

- **Severity:** Major
- **Where:** `src/components/ProjectKpiBar/ProjectKpiBar.tsx`, `src/components/Workspaces/ConfiguratorPage.tsx`
- **Evidence:** Both surfaces compute live values correctly, but they depend on global state that was not reset per project.
- **Impact:** The upper bar and side summary can appear disconnected from the selected project.
- **Recommendation:** Reset complete project state on open, then smoke-test volume, GPM, TDH, bather load, turnover, and cost across all projects.

### BackOffice And Workspace Project Data Are Split

- **Severity:** Major
- **Where:** `src/components/BackOffice`, `src/components/ProjectsLanding`
- **Evidence:** Back-office screens and workspace landing rely on separate mock data concepts.
- **Impact:** The same project can tell different stories depending on entry point.
- **Recommendation:** Keep project identity centralized and derive full workspace profiles from the same project IDs.

### Configurator Has No Clear Prefill Provenance

- **Severity:** Major
- **Where:** `src/components/Workspaces/ConfiguratorPage.tsx`
- **Evidence:** The wizard shows template prefill badges, but the main configurator does not explain why a field is already complete.
- **Impact:** Users cannot distinguish AI/template decisions from manual decisions.
- **Recommendation:** Add lightweight prefill messaging or badges on relevant completed groups.

### Files And Activity Need Project-Specific History

- **Severity:** Major
- **Where:** `src/components/Workspaces/FilesWorkspace.tsx`, `src/data/projectHistory.ts`
- **Evidence:** Files/history are rich but seeded as a single project story.
- **Impact:** Opening six projects still feels like one project wearing different labels.
- **Recommendation:** Generate distinct files and activity for each project profile.

### Order Status Changes Need Fast Demo Controls

- **Severity:** Major
- **Where:** `src/components/Workspaces/BOMWorkspace.tsx`, `src/components/Workspaces/OrderSummary.tsx`
- **Evidence:** Users can place/receive orders only from the Orders view, while the Parts table status pill is display-only.
- **Impact:** Demo presenters cannot quickly create or repair procurement states mid-demo.
- **Recommendation:** Make status chips editable and add an explicit "Add to Pending" action.

### Estimate Screen Is Visually Strong But Static

- **Severity:** Major
- **Where:** `src/components/Workspaces/EstimateWorkspace.tsx`
- **Evidence:** Estimate rows are hard-coded and do not reflect the active project.
- **Impact:** The estimate can conflict with BOM/material cost values.
- **Recommendation:** For demo consistency, label it as a quote preview and ensure totals are directionally aligned with the profile's material cost.

### Design Canvas Tools Need Keyboard And Tooltip Parity

- **Severity:** Major
- **Where:** `src/components/DrawingCanvas`, `src/components/DesignWorkspace`
- **Evidence:** Tool buttons rely heavily on visual icon meaning.
- **Impact:** First-time demo users may not discover drawing modes quickly.
- **Recommendation:** Confirm every tool has text, tooltip, and focus state; keep status bar readable at 1280px.

### Theme Contrast Needs A Full Sweep

- **Severity:** Major
- **Where:** `src/theme.css`, component CSS modules
- **Evidence:** Status dots, muted labels, and low-contrast chips are common in dense surfaces.
- **Impact:** Light/dark demos can have different readability.
- **Recommendation:** Check all status badges, deadline warnings, and focus rings in both themes.

### Search And Filter Empty States Are Good But Can Be More Actionable

- **Severity:** Minor
- **Where:** `src/components/ProjectsLanding/ProjectsLanding.tsx`, `src/components/Workspaces/BOMWorkspace.tsx`
- **Evidence:** Empty states exist, but BOM only says no parts match filters.
- **Impact:** Users may not know which filter caused the empty state.
- **Recommendation:** Show active filter chips and a clear-all action close to empty results.

### Chat Skip Link Could Feel Like Abandonment

- **Severity:** Minor
- **Where:** `src/components/ProjectChat/ProjectChat.tsx`
- **Evidence:** "Skip to workspace — I'll configure later" bypasses the setup narrative.
- **Impact:** Users may land in a sparse configurator with no explanation.
- **Recommendation:** Route skip to the first incomplete wizard step, not directly to the workspace.

### Project Row Horizontal Scroll Needs Better Affordance

- **Severity:** Minor
- **Where:** `src/components/WorkspaceLanding/WorkspaceLanding.tsx`
- **Evidence:** Existing-project source cards are in a horizontal row with arrow overlays.
- **Impact:** On smaller screens, hidden cards may feel undiscoverable.
- **Recommendation:** Add visible count/position affordance or allow wrapping below the fold.

### Finalized State Needs More Visible Read-Only Feedback

- **Severity:** Minor
- **Where:** `src/components/TitleBar/TitleBar.tsx`, step forms
- **Evidence:** Forms disable controls, but the reason is mostly in the title bar.
- **Impact:** Users may interpret disabled controls as broken.
- **Recommendation:** Add a read-only banner for finalized projects.

### Breadcrumb And Workspace Labels Need Consistency

- **Severity:** Minor
- **Where:** `src/components/TitleBar/TitleBar.tsx`, `src/Portal.tsx`
- **Evidence:** Portal calls procurement "Procurement"; workspace tab label is driven by `WORKSPACE_LABELS`.
- **Impact:** Users may not map portal links to app tabs instantly.
- **Recommendation:** Use the same label vocabulary across portal, title bar, and tab names.

### Status Labels Should Avoid Color-Only Meaning

- **Severity:** Minor
- **Where:** project status badges, order tabs, BOM status chips
- **Evidence:** Many statuses include color dots but not always icon/text alternatives.
- **Impact:** Users with color-vision differences lose signal.
- **Recommendation:** Keep text visible and add icons only where status is dense.

### Toast Placement Can Clash With Tables

- **Severity:** Minor
- **Where:** `src/components/Workspaces/OrderSummary.tsx`
- **Evidence:** Order toast appears inside the Orders surface.
- **Impact:** It may overlap rows on smaller laptop windows.
- **Recommendation:** Keep toast near the action footer and ensure it does not cover primary controls.

### Portal Is Useful But Demo Entry Should Be Primary

- **Severity:** Observation
- **Where:** `src/Portal.tsx`
- **Evidence:** Norveo, docs, and UI library links compete visually.
- **Impact:** Demo presenters can click the wrong entry.
- **Recommendation:** Highlight "Start UAT Demo" as the primary Norveo entry.

### Save History Works Well For Demo Storytelling

- **Severity:** Observation
- **Where:** `src/store.ts`, `src/components/Workspaces/FilesWorkspace.tsx`
- **Evidence:** Saving creates a new plan-set file and activity event.
- **Impact:** Good proof point for audit trail and collaboration.
- **Recommendation:** Preserve this behavior and seed project-specific history.

### BOM Markup Toggle Is A Strong Demo Moment

- **Severity:** Observation
- **Where:** `src/components/Workspaces/BOMWorkspace.tsx`
- **Evidence:** Separate/included markup modes are clear and presenter-friendly.
- **Impact:** Helps tell admin vs. customer quote story.
- **Recommendation:** Keep labels explicit and pair with Estimate view.

### Configurator Summary Collapse Is Useful

- **Severity:** Observation
- **Where:** `src/components/Workspaces/ConfiguratorPage.tsx`
- **Evidence:** Summary can collapse to a rail.
- **Impact:** Helps narrow screens while preserving access to calculations.
- **Recommendation:** Persist collapsed preference later; not required for demo.

## Strengths

- The demo already has strong visual hierarchy, a coherent dark theme, and well-labeled primary flows.
- `OrderSummary` already models real lifecycle movement with stable PO numbers.
- KPI and Summary calculations are centralized enough that fixing state ownership fixes multiple surfaces.
- The configurator has a solid grouped structure and clear completion feedback.

## Recommended Next Steps

1. Ship full project profiles and reset all project-scoped state on open.
2. Normalize chat answers and route blank AI through chat, while project/template starts enter the structured wizard.
3. Seed procurement states by lifecycle and add fast BOM status controls.
4. Smoke-test KPI/Summary recalculation on each project and after edits.
5. Sweep remaining workspaces for theme, keyboard, copy, and responsive issues before the demo.
