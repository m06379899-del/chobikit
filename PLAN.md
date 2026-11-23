# ChobiKit — Milestone Plan

Owner document: chobikit-master-prompt.md (sections 12). One milestone at a time.

- [x] **Milestone 1 — Foundation** (done 2026-11-23)
  - Next.js 16 + TypeScript + Tailwind v4, static export (`output: "export"`)
  - next-intl v4, locales en + bn, root `/` redirect (public/index.html)
  - Fonts: Nunito + Hind Siliguri (next/font)
  - Design tokens (dark default + light), theme + language toggles
  - Header (mobile menu), footer, tool registry, home page
  - Empty tool pages (compress/convert/resize) with shared shell
  - About / Privacy / Terms / Contact pages
  - CLAUDE.md, PLAN.md
- [x] **Milestone 2 — Shared tool engine** (done 2026-11-23): drop zone, file list, image card, Web Worker messaging helper (protocol + WorkerClient), ZIP download (fflate), error handling, batch warning, device-class detection
- [x] **Milestone 3 — Image Compressor** (done 2026-11-23): jSquash codecs (MozJPEG/WebP/AVIF/PNG) in Web Worker, quality slider, target-size binary search, size stats, before/after slider, ZIP. Build switched to webpack (turbopack hangs on wasm worker bundles).
- [ ] `config/presets.ts` for resize presets and `config/seo-pages.ts` are Milestone 5 / 1b.
- [ ] **Milestone 4 — Image Converter**: all formats incl. HEIC, transparency bg color,
  format support detection
- [ ] **Milestone 5 — Image Resizer**: aspect lock, percent, presets, fit modes
- [ ] **Milestone 6 — Polish**: animations + confetti (reduced-motion), bn/en copy review,
  FAQ sections, a11y + perf pass, CSP _headers, sitemap, hreflang, meta, README deploy steps
- [ ] **Milestone 7 (Phase 1b) — SEO landing pages** from config
