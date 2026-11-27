# Bug Register & Defect Log

## Defect Severity Scale
- **P0 / Blocker**: Prevents core user journey, crashes the app, or causes data loss.
- **P1 / Major**: Significant feature breakage with no straightforward workaround.
- **P2 / Minor**: UI glitch, minor interaction friction, or non-blocking edge case.
- **P3 / Trivial**: Cosmetic imperfection, typo, or minor styling inconsistency.

---

## Tracked Defects & Remediation Status

### [BUG-AUTH-002]: Unauthenticated Guest Follow & Interaction Bypass
- **Severity**: P0 (Security & Data Integrity Blocker)
- **Status**: Resolved
- **Assigned Agent**: security-engineer / senior-engineer
- **Root Cause**:
  1. `server/api.ts` follow endpoints fell back to `'v_guest_visitor'` for unauthenticated requests, allowing guest visitors to mutate social follow graphs.
  2. `server/database.ts` `normalizeUserKey()` synthesized user IDs for arbitrary strings instead of rejecting non-registered followers.
  3. Frontend modals (`CreatorProfileModal.tsx`, `SpotDetailModal.tsx`, `PopReelsModal.tsx`) did not guard follow, like, or comment action handlers with `currentUser` checks.
- **Fix Applied**:
  1. Enforced strict authentication in `server/api.ts`: `POST /api/users/:username/follow`, `POST /api/users/:username/unfollow`, and `POST /api/spots/:id/comments` now return `401 Unauthorized` if no authenticated session is present.
  2. Enforced registered user requirement in `server/database.ts` (`followUser` and `unfollowUser` reject non-registered follower IDs).
  3. Added `onRequireLogin` interceptors across `CreatorProfileModal.tsx`, `SpotDetailModal.tsx`, and `PopReelsModal.tsx` that immediately prompt the login/sign-up drawer when an unauthenticated visitor attempts to follow, like, or comment.
  4. Added automated regression suite in `tests/social-network-visibility.test.ts` verifying unauthenticated follow attempts are rejected.
- **Verification**: Verified HTTP 401 on follow, unfollow, and comment endpoints; 126/126 tests passing; clean `npm run build`.

---

### [BUG-IMG-001]: Broken Image Icons on Big Pop Polaroid Cards & Admin Table
- **Severity**: P0 (Production Readiness Blocker)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**:
  1. Test execution against the shared singleton database previously triggered `cleanupUnreferencedMedia()`, wiping unreferenced asset folders from `uploads/images/`.
  2. When an image was missing on disk, Express static middleware called `next()`, causing requests to fall through to Vite/index.html (HTML text response), which triggered native browser broken image badges.
  3. React components (`SpotCard.tsx`, `AdminPanelModal.tsx`) lacked `onError` image handlers to catch decoding or network failures.
- **Fix Applied**:
  1. Added environment guard in `server/database.ts` (`cleanupUnreferencedMedia`) preventing disk deletion during automated tests or in non-persistent modes.
  2. Added empty-set safety guard in `server/imageService.ts` (`cleanupOrphans`).
  3. Added Express server-level fallback for `/uploads/images/:hash/:file` serving alternative folder variants or returning a high-res SVG placeholder (`image/svg+xml`) with HTTP 200.
  4. Added client-side `onError` handlers across all `SpotCard.tsx` image render paths and `AdminPanelModal.tsx` swapping in `DEFAULT_SPOT_FALLBACK_SVG`.
  5. Restored and registered valid high-res image assets for all active canvas spots.
- **Verification**: Verified HTTP 200 responses with correct image MIME types on dev server; 125/125 unit & integration tests passing; clean `npm run build`.

---

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
