# Bug Register & Defect Log

## Defect Severity Scale
- **P0 / Blocker**: Prevents core user journey, crashes the app, or causes data loss.
- **P1 / Major**: Significant feature breakage with no straightforward workaround.
- **P2 / Minor**: UI glitch, minor interaction friction, or non-blocking edge case.
- **P3 / Trivial**: Cosmetic imperfection, typo, or minor styling inconsistency.

---

## Tracked Defects & Remediation Status

### [BUG-001]: Black Screen on "Add Your Spot" Modal Open
- **Severity**: P0 (Blocker)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**: Missing React state hooks (`activeEditorTab`, `selectedBgCategory`, `selectedFontCategory`) and premature early return before hooks in `CreateSpotModal.tsx`.
- **Fix Applied**: Restored missing state hooks and guaranteed unconditional top-level hook execution. Verified via `npm run build`.

---

### [BUG-PM-001]: Premature Sign-in Wall on Spot Card Click
- **Severity**: P0 (Virality Blocker)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**: `App.tsx` forced unauthenticated visitors to sign in immediately upon clicking any card on the canvas or opening a shared spot link.
- **Fix Applied**: Removed guest gate in `App.tsx`; unauthenticated visitors can freely inspect spot cards, read messages, and play audio notes. Login is only prompted for claiming, editing, or reporting.

---

### [BUG-QA-001]: Cross-Tier Draft Contamination via Shared Undo History
- **Severity**: P0 (Major State Leak)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**: `undoHistory` and `redoHistory` were shared across plan tiers in `CreateSpotModal.tsx`. Triggering undo after switching from Big Pop to Mini Pop applied Big Pop photos/stickers to `miniDraft`.
- **Fix Applied**: Scoped undo and redo history per tier (`miniUndoHistory` and `bigUndoHistory`). Verified in `tests/studio-state-integrity.test.ts`.

---

### [BUG-QA-002]: Server-Side Spot Payload Tier Sanitization Bypass
- **Severity**: P1 (Commercial & Data Integrity)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**: In `server/api.ts`, `imageUrl` and `drawingData` were copied directly from client payload without checking `order.productId === 'big_pop'`.
- **Fix Applied**: Conditioned `imageUrl` and `drawingData` on `order.productId === 'big_pop'`. Verified in `tests/business-logic.test.ts`.

---

### [BUG-004]: Creator Studio Empty Black Panel When Switching Tabs or Rendering Themes
- **Severity**: P1 (Major UI Blocker)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**:
  1. Circular dependency between `CreateSpotModal.tsx` and child tab components (`ThemesTab`, `FramesTab`, `DrawStudioTab`, etc.) caused runtime `undefined` references during HMR and module resolution.
  2. In `CreateSpotModal.tsx`, `renderTabContent` guarded every tab with `!isDrawingMode ? (...) : null`. When lingering drawing state or switching between drawing and other tabs occurred, tabs returned `null` instead of rendering their content.
  3. `ThemesTab` lacked null safety when handling undefined or non-hex `currentDraft.backgroundColor`.
  4. Absence of React ErrorBoundary around the tab renderer caused unhandled child render failures to unmount the entire right panel into an empty black box.
- **Fix Applied**:
  1. Extracted all shared constants into isolated `src/components/modals/editor/constants.ts` and updated all 6 editor tabs to eliminate circular dependencies.
  2. Updated `renderTabContent` to render tabs unconditionally without brittle `!isDrawingMode` gates, with safe fallback.
  3. Added null safety in `ThemesTab` for `currentDraft.backgroundColor` and `THEMED_BACKGROUNDS`.
  4. Wrapped both desktop and mobile tab renderers with `EditorErrorBoundary` containing automated recovery reload. Verified across 120 automated test suites.

- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**: In `CreateSpotModal.tsx`, `Draw` and `Adjust` tools were rendered for Mini Pop in mobile tool dock and desktop toolbar.
- **Fix Applied**: Restricted `Draw` and `Adjust` to `tier === 'big_pop'`. Verified in `tests/studio-state-integrity.test.ts`.

---

### [BUG-QA-004]: Off-by-One Boundary in History Stack Depth Cap
- **Severity**: P2 (Minor)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**: `[...prev.slice(-30), draftToSave]` yielded 31 items instead of 30.
- **Fix Applied**: Updated to `[...prev, draftToSave].slice(-30)` across both tier history stacks. Verified in tests.
