# Norveo — UX & UI Analysis

Design-focused audit: user impact, clarity, and consistency. **P** = high impact; **M** = medium; **L** = low / polish.

---

## 1. UX — Discovery & affordances

| Id | Severity | What users see / expect | Design issue | Design direction |
|----|----------|--------------------------|--------------|------------------|
| **1.1** | P | No way to start a new project from the interface. | Primary action (new project) is hidden; keyboard shortcut is undiscoverable. | Expose “New project” in the UI (e.g. near project name or under a clear entry point) so the main starting action is visible. **Addressed:** see [landing-page.md](landing-page.md) and [navigation-home.md](navigation-home.md). |
| **1.2** | M | TitleBar: Templates, Save, Share, Settings look like actions but do nothing. | Buttons look active and clickable; users expect feedback or a result. | Either make them clearly inactive (disabled/grayed) with a “Coming soon” cue, or remove until they have real behavior. |
| **1.3** | M | Status bar shows “x: 0 y: 0” in Design mode. | Reads like live cursor position; it never changes, so it feels broken or placeholder. | Either show real cursor/position over the canvas, or replace with non-position text (e.g. “Design”) so it doesn’t imply live data. |
| **1.4** | L | Zoom % in status bar changes with +/- but canvas doesn’t zoom. | Control suggests it affects the view; mismatch between control and result. | Either make zoom actually control canvas scale, or relabel (e.g. “View zoom”) and treat as future/placeholder so the intent is clear. |

---

## 2. UX — Flows & state

| Id | Severity | What users see / expect | Design issue | Design direction |
|----|----------|--------------------------|--------------|------------------|
| **2.1** | M | Config drawer footer shows “0 / 14” and Back/Continue when no step is selected. | Counter and nav imply a selected step; “0” is ambiguous and nav feels wrong with nothing selected. | When no step is selected, show a neutral state (e.g. “— / 14” or “Select a step”) and disable or hide Back/Continue until a step is chosen. |
| **2.2** | L | With left panel closed, only the Activity bar is visible. | New users may not realize the bar opens different panels. | Rely on tooltips; optionally add a one-time hint (e.g. “Click an icon to open the sidebar”) so the bar’s role is clear. |
| **2.3** | L | Escape closes overlays; future “place item” flow may leave placement active. | Users expect Escape to cancel the current mode (e.g. placing an item). | Design so Escape always cancels the current transient state (placement, context menu, etc.) and closes overlays consistently. |

---

## 3. UI — Layout & space

| Id | Severity | What users see / expect | Design issue | Design direction |
|----|----------|--------------------------|--------------|------------------|
| **3.1** | M | Config drawer is fixed width; on narrow or small windows it takes most of the width. | Layout feels rigid; workspace and tabs can feel squeezed or secondary. | Allow the drawer to be narrower on small viewports (e.g. max width relative to viewport) or support resizing so content balance stays comfortable. |
| **3.2** | L | Many workspace tabs at the bottom (Design, Summary, Engineering, etc.). | On small screens, tabs may wrap or feel cramped; active tab should stay obvious. | Define behavior for overflow: horizontal scroll, wrap, or collapse — and ensure the active tab is always clearly indicated. |
| **3.3** | L | Long project names in the TitleBar with centered layer tabs. | Risk of overlap or truncation; center block can feel squeezed. | Constrain project name width and ensure the center (layer tabs) keeps a minimum width so hierarchy and readability stay clear. |

---

## 4. UI — Visual design & theming

| Id | Severity | What users see / expect | Design issue | Design direction |
|----|----------|--------------------------|--------------|------------------|
| **4.1** | P | Logo in light mode: blue mark is fixed; rest follows text color. | Brand mark may not meet contrast or mood in light theme. | Define a light-mode variant for the logo (accent color and/or weight) so it stays recognizable and on-brand in both themes. |
| **4.2** | M | Status bar and workspace tabs use fixed blues and grays. | In light mode, some elements don’t follow the theme and the UI feels inconsistent. | Use the same semantic tokens (accent, muted text, borders) in status bar and tabs as in the rest of the app so light/dark feel consistent. |
| **4.3** | L | Canvas grid and equipment strokes use fixed colors. | In light mode, background changes but some strokes may be low contrast or off-theme. | Define canvas palette for light theme (grid, strokes, accents) so the drawing area fits the chosen theme. |

---

## 5. UX — Accessibility & interaction quality

| Id | Severity | What users see / expect | Design issue | Design direction |
|----|----------|--------------------------|--------------|------------------|
| **5.1** | M | Icon-only buttons (TitleBar, Activity bar, ToolStrip, Status bar). | Screen reader users get no clear label for the action. | Every icon button should have a clear, concise label available to assistive tech (same idea as the tooltip text). |
| **5.2** | M | Theme toggle (Sun/Moon): purpose is clear visually but not announced. | Theme switch isn’t announced for assistive tech users. | Expose the action in accessibility tree (e.g. “Switch to light mode” / “Switch to dark mode”) so the control is understandable. |
| **5.3** | L | Project Wizard opens as a modal. | Focus can leave the modal; after close, focus may be lost. | Modal should keep focus inside until closed and return focus to the trigger when dismissed so keyboard flow is predictable. |
| **5.4** | L | Right-click “Add” menu on canvas is mouse-only. | Keyboard users can’t add items the same way. | Consider a keyboard path (shortcut to open add menu, arrows + Enter to choose) for parity and power use. |

---

## 6. UI — Copy & consistency

| Id | Severity | What users see / expect | Design issue | Design direction |
|----|----------|--------------------------|--------------|------------------|
| **6.1** | L | AI chat messages contain `**bold**` but it appears as raw text. | Looks like a bug or unfinished formatting. | Either render simple formatting (e.g. bold) in messages or remove markdown from copy so the tone stays consistent. |
| **6.2** | L | Config empty state: “Select a step from the sidebar.” | Correct but depends on users knowing “Configure” in the left panel is where to pick steps. | Keep copy; ensure the Configure panel and its steps are clearly the “sidebar” referred to (naming and hierarchy). |

---

## 7. UX — Feedback & edge states

| Id | Severity | What users see / expect | Design issue | Design direction |
|----|----------|--------------------------|--------------|------------------|
| **7.1** | L | Config drawer with no visible steps still shows a step counter. | “1 / 0” or similar is confusing and suggests broken state. | When there are no steps, show a single clear state (e.g. “No steps” or hide counter) so the UI doesn’t imply a valid step. |
| **7.2** | L | Save (e.g. Cmd/Ctrl+S) does nothing and shows no message. | Users don’t know if the app received the action. | Provide lightweight feedback (e.g. “Save coming soon” or “Saved” when implemented) so the system feels responsive. |

---

## Summary

- **High (P):** 2 — New project discoverability; logo treatment in light mode.
- **Medium (M):** 8 — TitleBar inactive actions; status bar position/zoom clarity; config drawer “no step” state; drawer width on small screens; theme consistency in status bar and tabs; labels for icon buttons and theme toggle.
- **Low (L):** 10 — Zoom semantics; sidebar hint; Escape and placement; tab overflow and TitleBar overlap; canvas in light theme; modal focus; keyboard add menu; chat formatting; empty steps; Save feedback.

**Design priority:** Address **1.1** (visible new project) and **4.1** (logo in light mode) first for clarity and brand. Then align **1.2**, **4.2**, and **5.1/5.2** so the chrome feels consistent and accessible. Treat the rest as iteration for polish and edge cases.
