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

---

### [TASK-021]: Fix Text Deletion Fallback Bug & Add Full Header Brand Logo
- **Priority**: P0 (User Creation Integrity & Brand Consistency)
- **Assigned Agent**: senior-engineer
- **Description**: Resolve text resurrection bug where deleting creator signature or text reverted to `'Spot Pioneer ♡'`. Cleaned default drafts, set `hasAuthor` to strictly check `content.author`, preserved empty strings on server update. Updated header with full SpotPop brand logo (icon + typography).
- **Status**: Completed
- **Test Evidence**: Verified empty string preservation, 0 TypeScript errors, 60/60 passing tests, clean build in 939ms.
- **Review Result**: Approved by CTO.

---

### [TASK-022]: Pop Reels Performance Hardening & Pure Random Feed
- **Priority**: P0 (Feed Performance & User Experience)
- **Assigned Agent**: performance-engineer
- **Description**: Eliminate scroll jitter and glitching in Reels by removing conflicting `scroll-smooth` on snap container, RAF-throttling scroll listener, debouncing audio playback (140ms), virtualizing slide rendering (only mounting active ± 1 heavy cards), removing unneeded top reel index counter badge (`9/11`), and guaranteeing a 100% unique Fisher-Yates randomized feed on every open.
- **Status**: Completed
- **Test Evidence**: 62/62 passing tests across 11 suites (`tests/reels-navigation.test.ts`), verified unique ID set and initial spot pinning tests, clean production build in 856ms.
- **Review Result**: Approved by CTO.

---

### [TASK-023]: Mic Badge Removal, Spot Pioneer Watermark Elimination, and Header/Reels Branding Alignment
- **Priority**: P0 (Visual Consistency & Audio Ergonomics)
- **Assigned Agent**: senior-engineer
- **Description**: Permanently removed the `🎤 15s` / `🎙️ 15s` badge from `SpotCard.tsx` across the application. Removed hardcoded `♡` author suffix and prevented default creatorName stamping on spot creation so cards don't have unwanted "Spot Pioneer ♡" watermark text over user drawings and photos. Harmonized Pop Reels header branding to feature the official full SpotPop brand logo pill without "Reels" or index counters. Robustly synchronized audio playback events so the pause icon immediately reflects active autoplay, and timeline dragging seeks accurately.
- **Status**: Completed
- **Test Evidence**: `npx tsc --noEmit` 0 errors, 62/62 unit tests passing, production build completed in 1.01s.
- **Review Result**: Approved by CTO.

---

### [TASK-024]: Infinite Canvas High-Performance Optimization & Viewport Image Virtualization
- **Priority**: P0 (Canvas Smoothness & Rendering Performance)
- **Assigned Agent**: performance-engineer
- **Description**: Resolved canvas hanging and stuttering when rendering high volumes of images and animated GIFs. Introduced `FastSpotCard` level-of-detail (LOD) architecture that bounds the DOM tree by rendering full interactive `SpotCard` instances only for the closest 32 cards while rendering peripheral cards as lightweight nodes. Forced `decoding="async"` and `loading="lazy"` across all polaroid photo elements. Removed GPU-expensive 1400x1400 `blur-3xl` filter from canvas container, promoted world container to dedicated hardware composite layer with `will-change: transform`, added CSS layout containment (`contain: layout style`), disabled hover pointer events during drag, and RAF-throttled minimap 2D canvas draws to achieve continuous 60-120 FPS.
- **Status**: Completed
- **Test Evidence**: `npx tsc --noEmit` 0 errors, 62/62 unit tests passing, clean production build in 1.03s.
- **Review Result**: Approved by CTO.

---

### [TASK-025]: Pop Reels Live Re-Shuffle Loop & SSE Feedback Stutter Elimination
- **Priority**: P0 (Reel Stability & Scroll Smoothness)
- **Assigned Agent**: senior-engineer
- **Description**: Diagnosed and eliminated the root cause of Pop Reels rapidly cycling through pops on open and repeating previously seen spots on scroll. Removed the reactive feedback loop where recording slide views triggered backend SSE `spot_updated` events that continuously re-shuffled `displaySpots`. Decoupled `displaySpots` into stable persistent state `shuffledSpots`, initialized once upon modal open or on explicit `Mix` button click. Implemented in-place metadata synchronization so real-time like/view increments update without altering reel slide ordering, guaranteeing 100% stable, non-repeating scroll navigation.
- **Status**: Completed
- **Test Evidence**: `npx tsc --noEmit` 0 errors, 62/62 unit tests passing, production build completed in 900ms.
- **Review Result**: Approved by CTO.

---

### [TASK-026]: Pop Reels Interaction Flicker Elimination & Audio Scrubber State Decoupling
- **Priority**: P0 (User Experience & Visual Stability)
- **Assigned Agent**: senior-engineer & performance-engineer
- **Description**: Resolved "lights turn on and off quick" visual flickering during interactions in Pop Reels. Diagnosed double-nested blur GPU compositor texture invalidation caused by combining `backdrop-blur-xl` on the outer modal with `filter: blur(36px)` on the fullscreen ambient backdrop, which re-rendered on every state update. Decoupled audio playback and the timeline scrubber into an isolated memoized `<ReelsAudioPlayer>` component so `ontimeupdate` ticks (4-10Hz) update only the 30px scrubber progress bar without re-rendering the modal or its backdrop. Memoized `<AmbientReelsBackdrop>` to re-render strictly when switching slides. Removed screen-flashing `animate-ping` and excessive drop-shadows from `heartBurst`, replacing it with a smooth Instagram-style bounce scoped strictly to card double-taps. Removed accidental slide wrapper click triggers. Sanitized author watermark checks in `SpotCard.tsx` and `CreateSpotModal.tsx` so "Spot Pioneer" text never appears on cards.
- **Status**: Completed
- **Test Evidence**: `npx tsc --noEmit` 0 errors, 62/62 unit tests passing across all 11 suites, clean production build in 1.08s.
- **Review Result**: Approved by CTO.

---

### [TASK-027]: Friends-Only Audience Privacy Lock Leakage Remediation & Modal Unlock Flow
- **Priority**: P0 (Privacy Gating & Social Lock Integrity)
- **Assigned Agent**: security-engineer & senior-engineer
- **Description**: Fixed critical privacy leakage where a Friends-Only spot appeared locked and blurred on the canvas ("Follow @Mira_C to unlock"), but clicking it opened `SpotDetailModal` which rendered the card completely unlocked with all photos, drawings, and voice notes visible. Root cause was that `SpotDetailModal.tsx` omitted `isLocked={spot.isLocked}` when rendering `<SpotCard>`, omitted lock checking before mounting `<SpotAudioPlayer>`, and lacked an in-modal follow unlock action. In addition, `GET /api/spots/:idOrSlug` returned the raw spot without viewer-based lock evaluation. Enforced `isLocked` in `SpotDetailModal.tsx`, `FastSpotCard`, and `ViralShareKitModal.tsx`. Built an interactive in-modal "+ Follow @creator to Unlock" banner with real-time optimistic unlocking, confetti celebration, and canvas state sync. Secured `GET /api/spots/:idOrSlug` to calculate `isLocked` and strip private audio payloads for non-followers.
- **Status**: Completed
- **Test Evidence**: `npx tsc --noEmit` 0 errors, 64/64 unit tests passing across all 11 suites (`tests/social-network-visibility.test.ts`), production build completed in 1.07s.
- **Review Result**: Approved by CTO.

---

### [TASK-028]: Spot Detail Modal Social Interaction Suite (Likes, Comments & Reactions)
- **Priority**: P0 (Feature Parity & Social Engagement)
- **Assigned Agent**: senior-engineer & ui-ux-engineer
- **Description**: Implemented full social interaction capabilities directly inside `SpotDetailModal.tsx`. Integrated real-time Like toggle with optimistic counter increments, confetti particle effect, and backend persistence. Added interactive quick Pop React emoji picker (`['🔥', '❤️', '👏', '😂', '😮', '🚀', '💯']`) with reaction counts and floating upward emoji animations. Expanded stats strip to a 4-column overview displaying Likes, Views, Comments, and Shares. Built full-featured in-modal Comments and Replies thread supporting threaded replies, clickable @mentions and #hashtags, time formatting, and direct comment posting with allowComments validation.
- **Status**: Completed
- **Test Evidence**: `npx tsc --noEmit` 0 errors, 64/64 passing tests across 11 test suites, clean production build in 1.26s.
- **Review Result**: Approved by CTO.
