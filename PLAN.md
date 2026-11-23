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
- [x] **Milestone 4 — Image Converter** (done 2026-11-23): JPG/PNG/WebP/AVIF output, HEIC/HEIF decode via heic2any (lazy, main thread), GIF first frame, BMP, transparency background color, quality slider. Encoders are WASM so always available (no feature-detect needed).
- [x] **Milestone 5 — Image Resizer** (done 2026-11-23): dimensions with aspect lock, percent mode, 7 data-driven presets (config/presets.ts) with contain/cover fit, output format + quality, size-suffixed result names. Also note: stale .next webpack cache can fail builds — rm -rf .next fixes.
- [x] **Milestone 6 — Polish** (done 2026-11-23, SEO items deferred by owner): confetti + micro-animations (prefers-reduced-motion respected), success banner, FAQ sections on all tool pages (en/bn), accessibility pass (skip link, ARIA), CSP + security headers (public/_headers for Cloudflare Pages). Sitemap / hreflang / meta tags moved to Milestone 7 with the owner go-ahead.
- [ ] **Milestone 7 (Phase 1b) — SEO landing pages** from config
