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

---

### [TASK-029]: Full Instagram Follower/Following Logic, Private Account Architecture & Follow Requests
- **Priority**: P0 (Core Social Graph Architecture & Privacy Enforcement)
- **Assigned Agent**: senior-engineer & security-engineer & ui-ux-engineer
- **Description**: Re-architected SpotPop's social graph to 100% replicate Instagram's follower/following logic. Added `isPrivate` account setting, `FollowStatus` ('not_following' | 'pending' | 'accepted'), and `acceptedAt` tracking. If an account is Private (e.g. `@Mira_C`), clicking "Follow" transitions to `pending` ("Requested ⏳") rather than immediately granting follower status. While pending, the viewer CANNOT view or unlock private/friends-only pops (isLocked remains true, audio stripped). The creator receives a Follow Request in their notifications/profile with Confirm (Accept) and Delete (Decline) controls. Accepting sets status to `accepted`, which immediately unlocks the creator's pops for that follower. Built full Instagram profile UI matching reference: circular avatar with gradient ring and "Note... 💭" bubble, posts/followers/following metric columns, display name, category, clickable website link, multi-line bio, Private Account toggle setting, story highlights carousel row (`affordable`, `chatdora.in`, `exciting offer`, `+ New`), posts/reels tabs, iconic Instagram private account lock screen, and followers list modal with search and "Remove" follower capability. Also added Follow Requests management to `ActivityDrawer.tsx` and updated `SpotDetailModal.tsx` to display pending request feedback.
- **Status**: Completed
- **Test Evidence**: `npx tsc --noEmit` 0 errors, 69/69 passing tests across 11 test suites (`tests/social-network-visibility.test.ts`), clean production build in 858ms.
- **Review Result**: Approved by CTO.

---

### [TASK-030]: Instagram Username Rules Engine, Live Availability Check & Profile Photo Customization
- **Priority**: P0 (Identity Management & Profile Customization)
- **Assigned Agent**: senior-engineer & ui-ux-engineer
- **Description**: Implemented Instagram-compliant username engine and profile customization across SpotPop. Created `src/utils/instagramUsername.ts` enforcing Instagram username rules: 3 to 30 characters, characters restricted to lowercase alphanumeric, periods, and underscores `[a-z0-9._]`, cannot start or end with a period, cannot contain consecutive periods (`..`), and rejects system-reserved usernames (`admin`, `api`, `spots`, `explore`, `reels`, `spotpop`, etc.). Implemented real-time debounced availability check (`GET /api/users/check-username`) showing visual validation feedback badges (`✓ @username is available`, `✕ error`). Implemented profile photo upload with client-side file reading, base64 image upload (`api.uploadImage`), and remove photo action. Integrated fields for display name, category, website URL, bio (max 280 characters), and private account toggle in both `CreatorProfileModal.tsx` and `UserAccountModal.tsx`. Updated backend database `updateUser()` to propagate username updates across owned spots, creator names, and follower/following relations.
- **Status**: Completed
- **Test Evidence**: 77/77 tests passing across 12 test suites (`tests/instagram-profile-username.test.ts`), 0 TypeScript compiler errors, clean Vite production build in 830ms.
- **Review Result**: Approved by CTO.

---

### [TASK-031]: Universal Unfollow Capabilities across Following Lists, Profile Sheet, and Spot Modal
- **Priority**: P0 (User Freedom & Social Graph Autonomy)
- **Assigned Agent**: senior-engineer & ui-ux-engineer
- **Description**: Enabled users to unfollow any creator whenever they want across the application. Added dedicated idempotent `db.unfollowUser()` in `server/database.ts` and explicit endpoints `POST /api/users/:username/unfollow` and `DELETE /api/users/:username/follow` with real-time SSE event broadcasts. Added `api.unfollowUser()` in frontend client. In `CreatorProfileModal.tsx`, added interactive `Following ⌵` buttons next to each creator in the Following network list (hovering turns red `Unfollow`, one tap immediately unfollows and decrements following count with ability to re-follow). Added Instagram-style Unfollow Confirmation Modal Sheet (`Unfollow @username?`) when clicking `Following ⌵` on creator profiles. In `UserAccountModal.tsx`, added `Following ⌵` / `Unfollow` buttons in the user's Following list. In `SpotDetailModal.tsx`, added a `Following ⌵` / `Unfollow` pill next to the creator name in the modal header allowing immediate unfollow. Unfollowing instantly re-locks private/friends-only spots.
- **Status**: Completed
- **Test Evidence**: 80/80 passing tests across 12 test suites (`tests/social-network-visibility.test.ts`), 0 TypeScript compiler errors, clean production build in 940ms.
- **Review Result**: Approved by CTO.

---

### [TASK-032]: Elimination of Developer Jargon, Robotic AI Labels, and Programmer-Facing Copy
- **Priority**: P0 (User-First Consumer Experience & UI Polish)
- **Assigned Agent**: ui-ux-engineer & product-manager & senior-engineer
- **Description**: Conducted an exhaustive scan across all frontend views and modals to eliminate developer jargon, robotic AI tags, and programmer-facing text:
  1. Removed `100% LIVE PARITY · DIRECT FREE DRAG & CORNER RESIZE` and blinking dot from `CreateSpotModal.tsx` desktop and mobile preview bars.
  2. Removed the cheesy `Pop Creator` pill badge from `UserAccountModal.tsx` profile card.
  3. Removed `Instagram Format Compliant` programmer note from `CreatorProfileModal.tsx`.
  4. Removed internal database tier tags (`BIG POP` / `MINI POP`) from `SpotDetailModal.tsx`, `SearchDrawer.tsx`, and `ActivityDrawer.tsx`.
  5. Replaced `Owner Controls` label in `SpotDetailModal.tsx` with clean, natural user interface text.
  6. Replaced marketer/growth-hacking jargon `🚀 Open Viral Share Kit` with clean, user-friendly `Share Spot` in `SpotDetailModal.tsx` and `ViralShareKitModal.tsx`.
  7. Replaced developer terminology in editor tabs: `Blur Studio` -> `Blur`, `Vignette Edge Falloff` -> `Vignette`, `🔷 Or Stamp Vector Shape Layers` -> `🔷 Add Shapes`, `Insert Vector Shape Layer:` -> `Add Shapes:`, `Add Elements & Multi-Photo Layers` -> `Add Elements`, and `Audio Memory (Big Pop Exclusive)` -> `Voice Note`.
- **Status**: Completed
- **Test Evidence**: 80/80 passing tests across 12 test suites, 0 TypeScript compiler errors, clean Vite production build in 1.02s.
- **Review Result**: Approved by CTO.

---

### [TASK-033]: Separation of Audience & Privacy Settings from Text Editor into Dedicated Tab & Publish Flow
- **Priority**: P0 (Information Architecture & User Experience Integrity)
- **Assigned Agent**: product-manager & ui-ux-engineer & senior-engineer
- **Description**: Addressed critical information architecture flaw where "Audience & Visibility" (Public / Friends / Private) and "Allow Comments on Pop" settings were misplaced inside `TextStudioTab.tsx`. Created dedicated `AudienceTab.tsx` providing focused audience selection, comment toggling, and discovery hashtags. In `CreateSpotModal.tsx`, added a dedicated `{ id: 'audience', label: 'Audience', icon: '🔒' }` tool and integrated a quick audience selector pill (`🌍 Public ⌵` / `👥 Friends ⌵` / `🔒 Private ⌵`) into the desktop review/placement footer. Cleaned `TextStudioTab.tsx` so it strictly focuses on headline, subtext, font family, typography styling, and colors.
- **Status**: Completed
- **Test Evidence**: 80/80 passing tests across 12 test suites, 0 TypeScript compiler errors, clean Vite production build in 895ms.
- **Review Result**: Approved by CTO.

---

### [TASK-034]: Per-Element Typography Styling Isolation (Headline vs Subtext vs Author)
- **Priority**: P0 (Editor Precision & WYSIWYG Styling)
- **Assigned Agent**: senior-engineer & ui-ux-engineer
- **Description**: Fixed issue where modifying font family, color, effects, or sizing while editing secondary text (subtext) or author signature globally altered the headline or all text elements. Added element-level isolation in `TextTab.tsx` and `CreateSpotModal.tsx` so font changes strictly apply to the currently selected text layer (`selectedTextElement: 'headline' | 'subtext' | 'author'`).
- **Status**: Completed
- **Test Evidence**: 101/101 automated tests passing (`tests/studio-state-integrity.test.ts`), 0 TypeScript errors.
- **Review Result**: Approved by CTO.

---

### [TASK-035]: Semantic Sticker Search Engine with English Keyword Dictionary
- **Priority**: P0 (Creative Studio Usability)
- **Assigned Agent**: senior-engineer & product-manager
- **Description**: Resolved bug where sticker search query (e.g. typing "heart") returned an empty result. Implemented semantic keyword lookup engine in `src/utils/stickerKeywords.ts` mapping emojis, stamps, and doodles to comprehensive English search keywords (e.g., hearts, love, romance, fire, stars, gaming, spooky, food, coffee, badges). Built clean empty-state fallback with popular quick-search preset pills in `StickersStockTab.tsx`.
- **Status**: Completed
- **Test Evidence**: 101/101 automated tests passing (`tests/sticker-search.test.ts`), 0 TypeScript errors.
- **Review Result**: Approved by CTO.

---

### [TASK-036]: Connected Pops (Memory Threads) & Optional Discovery Metadata
- **Priority**: P0 (Social Graph & Content Discovery)
- **Assigned Agent**: senior-engineer & product-manager
- **Description**: Added ability for users to connect pops together into memory threads and tag following friends or mutual pops. Added optional title, description, location, and `#hashtags` to pop creation and global canvas search. Connected pops can be traversed bidirectionally with permission verification.
- **Status**: Completed
- **Test Evidence**: 101/101 automated tests passing (`tests/connected-pops.test.ts`, `tests/spot-metadata-search.test.ts`), 0 TypeScript errors.
- **Review Result**: Approved by CTO.

---

### [TASK-037]: 100% WYSIWYG Editor-to-Canvas Parity & Lossless Persistence Engine
- **Priority**: P0 (Visual Fidelity & Critical Rendering Invariant)
- **Assigned Agent**: senior-engineer & ui-ux-engineer & qa-engineer
- **Description**: Fixed critical defect where a spot created with Full Frame crop mode (`aspectRatio: 'full'`) in the editor reverted to a standard white Polaroid frame on the canvas with invisible white text. 
  1. Updated `server/api.ts` `POST /api/orders/verify` to perform lossless persistence of all editor properties: `photoAdjustments`, `layers`, `isCurvedText`, `curveRadius`, `textStroke`, `textGlow`, `text3D`, `textGradient`, `letterSpacing`, `lineHeight`, `stickers`, and `frameStyle`.
  2. Restored existing canvas spot `sp_1795596197108_grla` with its original full-bleed adjustments and snowflake sticker.
  3. Upgraded `SpotCard.tsx` and `FastSpotCard` in `SpotCanvas.tsx` to ensure `isFullBleed` spots render edge-to-edge artwork with a bottom gradient scrim, preserving full legibility for white text (#FFFFFF) across both standard and LOD zoom levels.
- **Status**: Completed
- **Test Evidence**: 101/101 automated tests passing (`tests/canvas-editor-parity.test.ts`), clean production build in 921ms, 0 TypeScript compiler errors.
- **Review Result**: Approved by CTO.

---

### [TASK-038]: Creator Account Discovery & Mutual Follow Capabilities in SpotDetailModal
- **Priority**: P0 (Social Graph Discovery & Engagement)
- **Assigned Agent**: senior-engineer & ui-ux-engineer
- **Description**: Added prominent, intuitive options for users to inspect the creator's account and follow/unfollow each other directly from `SpotDetailModal`:
  1. **Top Header**: Added creator avatar, display name, and `@username` with one-tap navigation to the creator's full account (`CreatorProfileModal`), an explicit `Account ↗` button, and an instant `+ Follow` / `Following ⌵` toggle button.
  2. **Dedicated Creator Account Card**: Embedded an Instagram-style profile strip right below the artwork preview featuring the creator's avatar, `@username`, "Pop Creator" badge, direct `Profile ↗` action, and immediate follow toggle.
  3. **In-Thread Commenter Accounts & Mutual Follow**: Enhanced the in-modal comments and replies thread so tapping any commenter's avatar or `@username` opens their full account profile, and viewers can follow or unfollow commenters directly via compact `+ Follow` / `Following ⌵` buttons on each comment.
- **Status**: Completed
- **Test Evidence**: 103/103 automated tests passing (`tests/social-network-visibility.test.ts`), clean production build in 869ms, 0 TypeScript errors.
- **Review Result**: Approved by CTO.



---

### [TASK-031]: Universal Unfollow Capabilities across Following Lists, Profile Sheet, and Spot Modal
- **Priority**: P0 (User Freedom & Social Graph Autonomy)
- **Assigned Agent**: senior-engineer & ui-ux-engineer
- **Description**: Enabled users to unfollow any creator whenever they want across the application. Added dedicated idempotent `db.unfollowUser()` in `server/database.ts` and explicit endpoints `POST /api/users/:username/unfollow` and `DELETE /api/users/:username/follow` with real-time SSE event broadcasts. Added `api.unfollowUser()` in frontend client. In `CreatorProfileModal.tsx`, added interactive `Following ⌵` buttons next to each creator in the Following network list (hovering turns red `Unfollow`, one tap immediately unfollows and decrements following count with ability to re-follow). Added Instagram-style Unfollow Confirmation Modal Sheet (`Unfollow @username?`) when clicking `Following ⌵` on creator profiles. In `UserAccountModal.tsx`, added `Following ⌵` / `Unfollow` buttons in the user's Following list. In `SpotDetailModal.tsx`, added a `Following ⌵` / `Unfollow` pill next to the creator name in the modal header allowing immediate unfollow. Unfollowing instantly re-locks private/friends-only spots.
- **Status**: Completed
- **Test Evidence**: 80/80 passing tests across 12 test suites (`tests/social-network-visibility.test.ts`), 0 TypeScript compiler errors, clean production build in 940ms.
- **Review Result**: Approved by CTO.

---

### [TASK-032]: Elimination of Developer Jargon, Robotic AI Labels, and Programmer-Facing Copy
- **Priority**: P0 (User-First Consumer Experience & UI Polish)
- **Assigned Agent**: ui-ux-engineer & product-manager & senior-engineer
- **Description**: Conducted an exhaustive scan across all frontend views and modals to eliminate developer jargon, robotic AI tags, and programmer-facing text:
  1. Removed `100% LIVE PARITY · DIRECT FREE DRAG & CORNER RESIZE` and blinking dot from `CreateSpotModal.tsx` desktop and mobile preview bars.
  2. Removed the cheesy `Pop Creator` pill badge from `UserAccountModal.tsx` profile card.
  3. Removed `Instagram Format Compliant` programmer note from `CreatorProfileModal.tsx`.
  4. Removed internal database tier tags (`BIG POP` / `MINI POP`) from `SpotDetailModal.tsx`, `SearchDrawer.tsx`, and `ActivityDrawer.tsx`.
  5. Replaced `Owner Controls` label in `SpotDetailModal.tsx` with clean, natural user interface text.
  6. Replaced marketer/growth-hacking jargon `🚀 Open Viral Share Kit` with clean, user-friendly `Share Spot` in `SpotDetailModal.tsx` and `ViralShareKitModal.tsx`.
  7. Replaced developer terminology in editor tabs: `Blur Studio` -> `Blur`, `Vignette Edge Falloff` -> `Vignette`, `🔷 Or Stamp Vector Shape Layers` -> `🔷 Add Shapes`, `Insert Vector Shape Layer:` -> `Add Shapes:`, `Add Elements & Multi-Photo Layers` -> `Add Elements`, and `Audio Memory (Big Pop Exclusive)` -> `Voice Note`.
- **Status**: Completed
- **Test Evidence**: 80/80 passing tests across 12 test suites, 0 TypeScript compiler errors, clean Vite production build in 1.02s.
- **Review Result**: Approved by CTO.

---

### [TASK-033]: Separation of Audience & Privacy Settings from Text Editor into Dedicated Tab & Publish Flow
- **Priority**: P0 (Information Architecture & User Experience Integrity)
- **Assigned Agent**: product-manager & ui-ux-engineer & senior-engineer
- **Description**: Addressed critical information architecture flaw where "Audience & Visibility" (Public / Friends / Private) and "Allow Comments on Pop" settings were misplaced inside `TextStudioTab.tsx`. Created dedicated `AudienceTab.tsx` providing focused audience selection, comment toggling, and discovery hashtags. In `CreateSpotModal.tsx`, added a dedicated `{ id: 'audience', label: 'Audience', icon: '🔒' }` tool and integrated a quick audience selector pill (`🌍 Public ⌵` / `👥 Friends ⌵` / `🔒 Private ⌵`) into the desktop review/placement footer. Cleaned `TextStudioTab.tsx` so it strictly focuses on headline, subtext, font family, typography styling, and colors.
- **Status**: Completed
- **Test Evidence**: 80/80 passing tests across 12 test suites, 0 TypeScript compiler errors, clean Vite production build in 895ms.
- **Review Result**: Approved by CTO.

---

### [TASK-034]: Per-Element Typography Styling Isolation (Headline vs Subtext vs Author)
- **Priority**: P0 (Editor Precision & WYSIWYG Styling)
- **Assigned Agent**: senior-engineer & ui-ux-engineer
- **Description**: Fixed issue where modifying font family, color, effects, or sizing while editing secondary text (subtext) or author signature globally altered the headline or all text elements. Added element-level isolation in `TextTab.tsx` and `CreateSpotModal.tsx` so font changes strictly apply to the currently selected text layer (`selectedTextElement: 'headline' | 'subtext' | 'author'`).
- **Status**: Completed
- **Test Evidence**: 101/101 automated tests passing (`tests/studio-state-integrity.test.ts`), 0 TypeScript errors.
- **Review Result**: Approved by CTO.

---

### [TASK-035]: Semantic Sticker Search Engine with English Keyword Dictionary
- **Priority**: P0 (Creative Studio Usability)
- **Assigned Agent**: senior-engineer & product-manager
- **Description**: Resolved bug where sticker search query (e.g. typing "heart") returned an empty result. Implemented semantic keyword lookup engine in `src/utils/stickerKeywords.ts` mapping emojis, stamps, and doodles to comprehensive English search keywords (e.g., hearts, love, romance, fire, stars, gaming, spooky, food, coffee, badges). Built clean empty-state fallback with popular quick-search preset pills in `StickersStockTab.tsx`.
- **Status**: Completed
- **Test Evidence**: 101/101 automated tests passing (`tests/sticker-search.test.ts`), 0 TypeScript errors.
- **Review Result**: Approved by CTO.

---

### [TASK-036]: Connected Pops (Memory Threads) & Optional Discovery Metadata
- **Priority**: P0 (Social Graph & Content Discovery)
- **Assigned Agent**: senior-engineer & product-manager
- **Description**: Added ability for users to connect pops together into memory threads and tag following friends or mutual pops. Added optional title, description, location, and `#hashtags` to pop creation and global canvas search. Connected pops can be traversed bidirectionally with permission verification.
- **Status**: Completed
- **Test Evidence**: 101/101 automated tests passing (`tests/connected-pops.test.ts`, `tests/spot-metadata-search.test.ts`), 0 TypeScript errors.
- **Review Result**: Approved by CTO.

---

### [TASK-037]: 100% WYSIWYG Editor-to-Canvas Parity & Lossless Persistence Engine
- **Priority**: P0 (Visual Fidelity & Critical Rendering Invariant)
- **Assigned Agent**: senior-engineer & ui-ux-engineer & qa-engineer
- **Description**: Fixed critical defect where a spot created with Full Frame crop mode (`aspectRatio: 'full'`) in the editor reverted to a standard white Polaroid frame on the canvas with invisible white text. 
  1. Updated `server/api.ts` `POST /api/orders/verify` to perform lossless persistence of all editor properties: `photoAdjustments`, `layers`, `isCurvedText`, `curveRadius`, `textStroke`, `textGlow`, `text3D`, `textGradient`, `letterSpacing`, `lineHeight`, `stickers`, and `frameStyle`.
  2. Restored existing canvas spot `sp_1795596197108_grla` with its original full-bleed adjustments and snowflake sticker.
  3. Upgraded `SpotCard.tsx` and `FastSpotCard` in `SpotCanvas.tsx` to ensure `isFullBleed` spots render edge-to-edge artwork with a bottom gradient scrim, preserving full legibility for white text (#FFFFFF) across both standard and LOD zoom levels.
- **Status**: Completed
- **Test Evidence**: 101/101 automated tests passing (`tests/canvas-editor-parity.test.ts`), clean production build in 921ms, 0 TypeScript compiler errors.
- **Review Result**: Approved by CTO.

---

### [TASK-038]: Creator Account Discovery & Mutual Follow Capabilities in SpotDetailModal
- **Priority**: P0 (Social Graph Discovery & Engagement)
- **Assigned Agent**: senior-engineer & ui-ux-engineer
- **Description**: Added prominent, intuitive options for users to inspect the creator's account and follow/unfollow each other directly from `SpotDetailModal`:
  1. **Top Header**: Added creator avatar, display name, and `@username` with one-tap navigation to the creator's full account (`CreatorProfileModal`), an explicit `Account ↗` button, and an instant `+ Follow` / `Following ⌵` toggle button.
  2. **Dedicated Creator Account Card**: Embedded an Instagram-style profile strip right below the artwork preview featuring the creator's avatar, `@username`, "Pop Creator" badge, direct `Profile ↗` action, and immediate follow toggle.
  3. **In-Thread Commenter Accounts & Mutual Follow**: Enhanced the in-modal comments and replies thread so tapping any commenter's avatar or `@username` opens their full account profile, and viewers can follow or unfollow commenters directly via compact `+ Follow` / `Following ⌵` buttons on each comment.
- **Status**: Completed
- **Test Evidence**: 103/103 automated tests passing (`tests/social-network-visibility.test.ts`), clean production build in 869ms, 0 TypeScript errors.
- **Review Result**: Approved by CTO.


