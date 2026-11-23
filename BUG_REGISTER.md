# Bug Register & Defect Log

## Defect Severity Scale
- **P0 / Blocker**: Prevents core user journey, crashes the app, or causes data loss.
- **P1 / Major**: Significant feature breakage with no straightforward workaround.
- **P2 / Minor**: UI glitch, minor interaction friction, or non-blocking edge case.
- **P3 / Trivial**: Cosmetic imperfection, typo, or minor styling inconsistency.

---

## Tracked Defects

### [BUG-001]: Black Screen on "Add Your Spot" Modal Open
- **Severity**: P0 (Blocker)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer
- **Root Cause**:
  1. Missing React state hooks (`activeEditorTab`, `selectedBgCategory`, `selectedFontCategory`) triggered unhandled runtime `ReferenceError` during render.
  2. Early return `if (!isOpen) return null;` previously executed before subsequent hooks, violating React's Rules of Hooks.
  3. `SpotAudio` draft object missing required `storageKey` property.
- **Fix Applied**:
  - Restored missing state hooks and ensured all hooks execute unconditionally before any return in `CreateSpotModal.tsx`.
  - Added fallback `storageKey: ''` for newly initialized audio drafts.
- **Verification Evidence**: `npm run build` passed cleanly; modal opens without unhandled exceptions.
- **Regression Test**: Added check in pre-commit build verification.

---

### [BUG-002]: Mobile Canvas Live Preview Scaled Too Small
- **Severity**: P1 (Major)
- **Status**: Resolved
- **Assigned Agent**: ui-ux-engineer
- **Root Cause**: Mobile preview card scaling was set to `scale-[0.52]` to avoid viewport overflow, making text and stickers difficult to inspect on mobile devices.
- **Fix Applied**: Adjusted scale to `scale-[1.18]` / `scale-[1.55]` and reduced the bottom drawer max-height to 35vh, keeping 65% of screen real estate for the canvas.
- **Verification Evidence**: Verified in commit `0df3b69`.

---

### [BUG-003]: Voice Note Text Overlap & Missing Card Controls
- **Severity**: P2 (Minor)
- **Status**: Resolved
- **Assigned Agent**: senior-engineer / ui-ux-engineer
- **Root Cause**: "Voice Note 15.0s" text overlay obscured the spot background visual, with no interactive play button on the preview card itself.
- **Fix Applied**: Removed redundant label and added interactive SVG play/pause button with audio playback state tracking.
- **Verification Evidence**: Verified in commit `e44fe91`.
