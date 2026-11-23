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
- **Status**: Completed (35/35 tests passing across 8 suites in 225ms)
- **Test Evidence**: `npx tsx --test tests/**/*.test.ts` passed 100%.
- **Review Result**: Approved by CTO.
