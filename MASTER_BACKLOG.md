# Master Engineering Backlog

## Overview
This backlog is maintained autonomously by the **CTO / Main Orchestrator**. Tasks follow the standard life cycle: `Pending` → `In Progress` → `Completed` | `Blocked` | `Escalated`.

---

## Sprints & Milestone Tasks

### [TASK-001]: Autonomous Six-Agent Engineering Architecture
- **Priority**: P0 (Foundational Infrastructure)
- **Assigned Agent**: senior-engineer
- **Description**: Configure six specialist agent definitions in `.agents/agents/` following Antigravity's custom-agent format.
- **Status**: Completed
- **Test Evidence**: 6/6 valid frontmatter configurations; custom subagents discovered and operational.
- **Review Result**: Approved by CTO.

---

### [TASK-002]: Autonomous CTO Mode Configuration & Protocol
- **Priority**: P0 (Foundational Infrastructure)
- **Assigned Agent**: senior-engineer
- **Description**: Author `.agents/rules/autonomous-engineering.md` and initialize all persistent state tracking registers on `dev/autonomous-cto`.
- **Status**: Completed
- **Test Evidence**: Rule active and all 6 state registers created and tracked.
- **Review Result**: Approved by CTO.

---

### [TASK-003]: Server-Side TypeScript Type Declarations Hardening
- **Priority**: P0 (Build Integrity & Type Safety)
- **Assigned Agent**: senior-engineer
- **Description**: Add missing declaration typings for `heic-decode` and resolve `sharp` namespace issues in `server/imageService.ts` and `server/safetyService.ts` so `npx tsc --noEmit` runs 100% clean across both frontend and backend.
- **Status**: Completed
- **Test Evidence**: `npx tsc --noEmit` passed with 0 errors across workspace.
- **Review Result**: Approved by CTO.

---

### [TASK-008]: Remove Premature Guest Gate on Spot Details & Audio Playback
- **Priority**: P0 (Virality & User Acquisition Blocker)
- **Assigned Agent**: senior-engineer
- **Description**: Allow unauthenticated visitors to click and view spot cards, listen to audio voice notes, view creator profiles, and share spots without requiring login.
- **Status**: Completed
- **Test Evidence**: Removed blocking auth gate in `src/App.tsx`; verified unauthenticated visitor flow in `SpotDetailModal.tsx`.
- **Review Result**: Approved by CTO.

---

### [TASK-009]: Fix Tier Leakage — Restrict Drawing & Adjust to Big Pop
- **Priority**: P0 (Commercial Integrity & Tier Differentiation)
- **Assigned Agent**: senior-engineer
- **Description**: Enforce product tier restrictions in `CreateSpotModal.tsx` so `DrawStudioTab` and `AdjustTab` are strictly hidden when `tier === 'mini_pop'`, preserving the ₹99 upsell value.
- **Status**: Completed
- **Test Evidence**: Updated `MOBILE_TOOLS` and desktop tool tabs with `tier === 'big_pop'` conditions; verified in `tests/studio-state-integrity.test.ts`.
- **Review Result**: Approved by CTO.

---

### [TASK-010]: Fix Cross-Tier Draft Contamination in Undo/Redo Stacks
- **Priority**: P0 (State Integrity & Bug Fix)
- **Assigned Agent**: senior-engineer
- **Description**: Isolate undo/redo history stacks between Mini and Big Pop drafts in `CreateSpotModal.tsx` so popping an undo snapshot in Mini Pop does not overwrite it with Big Pop photo/sticker data.
- **Status**: Completed
- **Test Evidence**: Separated `miniUndoHistory` and `bigUndoHistory` state; 35/35 tests passing including `Verified Tier-Isolated Undo/Redo Engine`.
- **Review Result**: Approved by CTO.

---

### [TASK-011]: Server-Side Spot Payload Tier Sanitization
- **Priority**: P1 (Data Integrity & Tier Protection)
- **Assigned Agent**: senior-engineer
- **Description**: In `server/api.ts`, strictly sanitize incoming spot payloads upon order creation/spot claiming, ensuring `imageUrl` and `drawingData` are stripped if `order.productId === 'mini_pop'`.
- **Status**: Completed
- **Test Evidence**: Verified in `tests/business-logic.test.ts` where `createdSpot.imageUrl === undefined` and `createdSpot.drawingData === undefined`.
- **Review Result**: Approved by CTO.

---

### [TASK-012]: PWA Precache Bloat & Code Splitting Optimization
- **Priority**: P1 (Performance & Bandwidth Optimization)
- **Assigned Agent**: performance-engineer
- **Description**: Exclude AI model shards and heavy dynamic chunks from PWA precaching in `vite.config.ts`, reducing precache footprint from 44.8 MB to < 2 MB. Memoize `SpotCard` with `React.memo`.
- **Status**: Completed
- **Test Evidence**: Precache reduced by 96% from 44,865 kB to 1,795 kB; `SpotCard` wrapped in `React.memo`.
- **Review Result**: Approved by CTO.

---

### [TASK-013]: Critical Security Hardening (IDOR, Admin Guards, Mock Payment)
- **Priority**: P1 (Application Security)
- **Assigned Agent**: security-engineer
- **Description**: Fix `SEC-AUD-02` (remove mutable display name matching from spot ownership check) and `SEC-AUD-07` (guard mock payment verification behind non-production check).
- **Status**: Completed
- **Test Evidence**: Removed mutable string matching from `server/api.ts` lines 610 and 659; guarded mock payment bypass in `server/razorpay.ts` behind `NODE_ENV !== 'production'`.
- **Review Result**: Approved by CTO.

---

### [TASK-004]: Automated Regression Test Harness
- **Priority**: P1 (Reliability & Quality Assurance)
- **Assigned Agent**: qa-engineer
- **Description**: Expand `tests/` with runnable test suites for business logic, state integrity, and spotcard rendering using Node.js native test runner (`node:test`).
- **Status**: Completed (48/48 tests passing across 10 suites)
- **Test Evidence**: `npx tsx --test tests/**/*.test.ts` passed 100%.
- **Review Result**: Approved by CTO.

---

### [TASK-014]: Pop Reels Full-Screen Centered Stage & UI Redesign
- **Priority**: P0 (User Experience & Visual Polish)
- **Assigned Agent**: ui-ux-engineer
- **Description**: Redesign Pop Reels to center the Pop card in the dead-center of the screen at high fidelity scale with dynamic ambient background glow. Restructure action rail and creator caption overlays.
- **Status**: Completed
- **Test Evidence**: Pop card centered via `absolute inset-0 flex items-center justify-center` with responsive scaling (`scale-[1.75]` to `scale-[2.2]`), floating right action rail, and left bottom caption bar.
- **Review Result**: Approved by CTO.

---

### [TASK-015]: Real Backend Like Synchronization & Interaction Engine
- **Priority**: P1 (Core Engagement Feature)
- **Assigned Agent**: senior-engineer
- **Description**: Connect Pop Reels like button to real backend persistence via `POST /api/spots/:id/like` and `db.toggleSpotLike`, persist liked spots in `localStorage`, broadcast updates via SSE, and make creator follow, share, details, and teleport fully functional.
- **Status**: Completed
- **Test Evidence**: Verified `toggleSpotLike` in database, SSE broadcast `spot_updated`, `localStorage` persistence, and 48/48 passing tests in `tests/reels-navigation.test.ts`.
- **Review Result**: Approved by CTO.

---

### [TASK-016]: Reels Native-App Polish, Comments & Replies, Pop React & Views Engine
- **Priority**: P0 (User Experience & Engagement Integrity)
- **Assigned Agent**: senior-engineer
- **Description**: Fix button overlap on Pop cards by introducing a dedicated action rail gutter, implement algorithmic discovery shuffle, build real Comments & Replies sheet with @mentions and #hashtags, allow creators to toggle/hide comments during Pop creation, integrate Pop React emoji floating animations, and enable real backend view tracking via `POST /api/spots/:id/view`.
- **Status**: Completed
- **Test Evidence**: 52/52 tests passing across 10 suites (`tests/reels-navigation.test.ts`), zero TypeScript errors, and <1s bundle build.
- **Review Result**: Approved by CTO.

---

### [TASK-017]: Reels Audio State Synchronization & Seekable Timeline Scrubber
- **Priority**: P0 (Audio Player Usability)
- **Assigned Agent**: senior-engineer
- **Description**: Remove disconnected static card audio play button in Reels via `hideAudioBar={true}`, directly autoplay audio with dynamic Pause/Play button (`⏸`/`▶`), render real-time progress line that fills up as audio plays, and empower users to scrub/seek anywhere on the audio timeline.
- **Status**: Completed
- **Test Evidence**: 53/53 tests passing across 10 suites (`tests/reels-navigation.test.ts`), verified play/pause toggle and scrubber clamping in test suite, clean build in 904ms.
- **Review Result**: Approved by CTO.

---

### [TASK-018]: Permanent Removal of Top-Right Microphone Duration Pill Badge
- **Priority**: P0 (Visual Cleanliness & UI De-cluttering)
- **Assigned Agent**: ui-ux-engineer
- **Description**: Permanently remove the top-right black rounded microphone duration pill badge (`🎙️ 15s`) from `SpotCard.tsx` across the entire application to keep all cards clean and un-obscured.
- **Status**: Completed
- **Test Evidence**: Removed badge from `SpotCard.tsx`, updated event propagation regression test, 53/53 passing tests, and verified build in 973ms.
- **Review Result**: Approved by CTO.

---

### [TASK-019]: Audience Visibility Engine (Public, Friends Only, Private)
- **Priority**: P0 (Privacy & Social Access Control)
- **Assigned Agent**: senior-engineer
- **Description**: Provide 3 audience levels on Pop creation/editing (`public`, `friends_only`, `private`). Enforce strict server-side filtering and gating: `private` spots are hidden from anyone other than the creator; `friends_only` spots are gated so non-followers see a frosted locked state with a 1-click `Follow to Unlock` button that immediately unlocks the Pop upon following.
- **Status**: Completed
- **Test Evidence**: `tests/social-network-visibility.test.ts` passing (7 new test assertions covering public accessibility, private filtering, friends-only locking, and instant unlock on follow), clean build in 1.25s.
- **Review Result**: Approved by CTO.

---

### [TASK-020]: 100% Real Social Following & Followers System
- **Priority**: P0 (Core Social Graph Infrastructure)
- **Assigned Agent**: senior-engineer
- **Description**: Implement 100% real backend social graph persistence (`FollowRelation[]` in `server-db.json`), `POST /api/users/:username/follow` toggle endpoint, `GET /api/users/:username/network` network listing endpoint, frontend API methods, real Follow/Following counters on Creator Profile and User Account modals, and interactive Followers/Following dialog sheets.
- **Status**: Completed
- **Test Evidence**: 60/60 passing tests across 11 suites, verified follow/unfollow counting and state toggles, clean build in 1.25s.
- **Review Result**: Approved by CTO.
