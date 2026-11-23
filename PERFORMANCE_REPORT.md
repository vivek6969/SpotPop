# Performance Report & Benchmark Log

## Performance Targets & Budgets
- **Core Web Vitals**:
  - **LCP** (Largest Contentful Paint): Target < 2.0s
  - **INP** (Interaction to Next Paint): Target < 100ms
  - **CLS** (Cumulative Layout Shift): Target < 0.05
- **Bundle Budgets**:
  - Total Initial JS: < 300 KB gzip
  - CSS Bundle: < 30 KB gzip
- **API Latency**:
  - P50 < 50ms, P95 < 150ms

---

## Baseline Measurements (2026-11-24)

### Production Build Metrics
- **Build Time**: 1.36s (Vite + Rolldown)
- **Output CSS**: `dist/assets/index-DhkTt2P_.css` — 110.92 kB (15.70 kB gzip) 🟢 (Within budget)
- **Output JS Chunks**:
  - `dist/assets/index-CnrIdFaE.js` — 598.77 kB (151.96 kB gzip) 🟡 (Candidate for lazy loading)
  - `dist/assets/esm-xppRxyvr.js` — 1,121.97 kB (283.97 kB gzip)
  - `dist/assets/heic2any-2aXCht7n.js` — 1,352.13 kB (344.71 kB gzip) (Isolated in dynamic chunk)

### Memory & Rendering
- **Modal Lifecycle**: 0 memory leaks observed across repeat open/close cycles after hook unmounting cleanup.
- **Canvas Rendering**: High-DPI canvas backed by 2D context; RAF loop throttled during idle state.

---

## Optimization Roadmap
1. [TASK-007]: Implement dynamic `import()` for `heic2any` so it is only fetched when a HEIC photo is selected.
2. Optimize stickers catalog chunking to load SVG assets on-demand.
