# ChobiKit

Free, mobile-first website of image tools that run 100% in the visitor's browser.
Core promise: **your files never leave your device** — no backend, no uploads, ever.
Audience: Bangladesh + India, mid-range Android phones. UI in **Bengali (bn) + English (en)**.

## Hard rules (re-read before every milestone)
1. **Everything runs client-side.** No API routes, server actions, serverless functions, upload
   endpoints, database, cloud storage, or third-party image APIs — ever. The offline test must
   pass in every milestone: after page load, tools work with network disabled.
2. **No hard-coded user-facing strings.** Everything lives in `messages/en.json` and
   `messages/bn.json`. Bengali must be natural, not machine-sounding. JPG/PNG/ZIP/KB stay Latin.
3. **Mobile-first (360px)**, touch targets ≥ 44px, WCAG AA contrast, `prefers-reduced-motion`.
4. TypeScript everywhere. Work **one milestone at a time**, stop and report after each.
5. Commit after every working step. Run build + lint + type-check before reporting.
6. No features outside the current milestone scope. No video libs yet.

## Stack
- Next.js 16 (App Router, **static export** `output: "export"`) + TypeScript + Tailwind CSS v4
- next-intl v4 (i18n/request.ts, routing.ts, navigation.ts). Middleware/proxy NOT used (static export).
- Fonts via next/font: Nunito (Latin) + Hind Siliguri (Bengali) — self-hosted.
- `public/index.html` = root `/` redirect to `/en` or `/bn` (browser language + localStorage).
- Planned deps (not installed yet): jSquash codecs, fflate (ZIP), heic2any or libheif-js.

## Design tokens (app/globals.css, dark default + `.light` class on <html>)
bg #0B1220 / surface #121B2E / border #24304D / primary #3B82F6 / text #E6EDF7 / muted #9FB0CC
Accents: compress teal #2DD4BF, convert orange #FB923C, resize purple #C084FC (darker in light mode).
Theme: dark by default; toggle persists to localStorage `chobikit-theme`; pre-paint script prevents flash.

## Structure
- `app/[locale]/` — home, compress, convert, resize, about, privacy, terms, contact
- `components/` — header, footer, theme-toggle, language-switcher, privacy-badge,
  tool-page-shell, static-page-shell (StaticShell)
- `lib/tools-registry.ts` — single source of truth for tools (id, route, icon, accent)
- `config/limits.ts` — DEFAULT image limits (50 MB / 50 images, owner undecided)
- `config/site.ts` — DEFAULT contact email + NEXT_PUBLIC_SITE_URL (owner undecided)
- `messages/en.json`, `messages/bn.json`
- Full spec: `chobikit-master-prompt.md` (owner's document — follow it exactly)

## Defaults pending owner decision
Contact email (contact@chobikit.app placeholder), domain/site URL, analytics (off),
final image limits (50 MB / 50), monetization (none). Flag any changes in reports.
