# ChobiKit: Master Prompt for Claude Code

You are building **ChobiKit**, a public website of free media tools that run **entirely in the user's browser**. Read this whole document before writing any code. Every decision below was made deliberately by the project owner. Follow them exactly. Where something is marked **DEFAULT**, the owner has not decided yet: use the suggested default, put it in a single config file so it is easy to change, and mention it in your final report.

---

## 0. How to work (read first)

1. First, create two files in the repo root:
   - `CLAUDE.md`: a condensed version of this document (goals, stack, rules, design tokens, decisions) so the project context survives across sessions.
   - `PLAN.md`: the milestone list from section 12 with checkboxes, which you update as you go.
2. Then implement **Milestone 1 only**. Stop, summarize what you built, how to run it, and what is next. Wait for the owner before starting the next milestone.
3. Do not ask questions unless something truly blocks you. For small gaps, choose a sensible default and note it.
4. Do not add features outside the scope in section 3. No server, no database, no accounts, no video tools yet.
5. Make a `git commit` after every working step with a clear message.
6. Use TypeScript everywhere. Keep components small and reusable. Keep the code clean and commented where logic is non-obvious.
7. After each milestone, run the build, lint, and type-check, and fix errors before reporting.

---

## 1. Project summary

- **Name:** ChobiKit ("chobi" means picture in Bengali). Wordmark: "ChobiKit".
- **Type:** Public website, free to use, mobile-first.
- **Core promise:** *"Your files never leave your device."* All processing happens client-side in the user's browser. No file content is ever uploaded to any server. This is the main selling point and must be visible in the UI.
- **Audience:** Mostly people in Bangladesh and India (many on phones, often mid-range Android), plus global users.
- **Languages:** Bengali (`bn`) and English (`en`), both fully supported from day one.
- **Hosting target:** Cloudflare Pages (static hosting, free tier). So the site must work as a **static export** with no server runtime.

### 1.1 CORE ARCHITECTURE RULE: everything runs locally on the visitor's own device

This is the most important rule of the project. Re-read it before every milestone.

- ChobiKit has **no backend**. The server only delivers the website files (HTML, JS, CSS, WASM). It never receives, stores, or processes any image or video.
- **All processing is done by the visitor's own phone or PC**, inside their own browser, using their own CPU, RAM, and (later, for video) GPU. When a user on a phone opens the site, their phone does the work. When a user on a PC opens it, their PC does the work.
- Therefore: **no API routes, no server actions, no serverless functions, no upload endpoints, no database, no cloud storage, no third-party image APIs.** If you ever feel you need a server, stop and tell the owner instead.
- Because the work happens on the user's device, **speed and memory depend on that device**. Design for that:
  - Detect device class (mobile vs desktop, `navigator.hardwareConcurrency`, `navigator.deviceMemory` where available) and adapt: on weak or low-memory phones process one image at a time, use smaller batch sizes, and show a gentle warning for very large files.
  - Never assume a powerful PC. A mid-range Android phone is the primary target.
  - Show honest progress so the user knows their device is working.
- **Verifiable test (must pass in every milestone):** load a tool page, then turn the internet off (or use the browser's offline mode), then compress, convert, or resize an image. It must still work. If it fails, something is wrongly depending on a server.
- The UI must communicate this clearly to users in both languages: "Processed on your device. Nothing is uploaded."

---

## 2. Long-term roadmap (for architecture only, do NOT build now)

Later the site will also get **video tools**: change resolution, change codec, change container, all client-side. Decisions already made for that future:

- Video size limits: **100 MB on phones, 200 MB on PC/desktop**.
- Strategy: try **WebCodecs** first (hardware accelerated), fall back to **ffmpeg.wasm**.
- Start with H.264 and VP9 only. H.265 and AV1 encoding only if the browser supports it.
- Show a warning on phones for large files ("faster on a PC").

**What this means now:** structure the code so a new tool can be added as a new route plus a new processing module without touching existing tools. Keep a shared "tool registry" (name, route, icon, accent color, translations) that the home page and navigation read from. Do not install any video libraries yet.

---

## 3. Scope of Phase 1: Image tools only

Three tools, each on its **own page** (not one combined page):

| Route | Tool |
|---|---|
| `/[locale]/compress` | Image Compressor |
| `/[locale]/convert` | Image Format Converter |
| `/[locale]/resize` | Image Resizer |

Plus: home page, About, Privacy, Terms, Contact.

### 3.1 Image Compressor (`/compress`)
- Accept multiple images via drag-and-drop and a file picker (the picker must work well on phones).
- Per-image controls: quality slider (1 to 100), with a sensible default (about 80).
- **Target size mode:** "Make it under ___ KB". The tool searches for the best quality that fits under the target (binary search over quality) and reports if the target could not be reached.
- Show for each image: original size, new size, percentage saved, and a thumbnail.
- **Before/after comparison slider** (drag to compare) for the selected image.
- Keep the original format by default; allow choosing an output format too.
- Download single files, or **Download all as ZIP**.

### 3.2 Image Converter (`/convert`)
- Input formats: JPG/JPEG, PNG, WebP, AVIF, GIF (first frame), BMP, **HEIC/HEIF** (iPhone photos). SVG as input is optional.
- Output formats: **JPG, PNG, WebP, AVIF**.
- When converting an image with transparency to JPG, let the user pick the **background color** (default white).
- Quality slider for lossy outputs.
- Multiple files at once, with ZIP download.
- If a browser cannot encode a format, show a clear friendly message instead of failing silently.

### 3.3 Image Resizer (`/resize`)
- Set width and height in pixels, with an **aspect-ratio lock** (on by default).
- Resize by percentage.
- **Presets** (data-driven, easy to extend): Facebook post, Facebook cover, Instagram square, Instagram story, YouTube thumbnail, WhatsApp DP, passport-style photo (width/height only).
- Fit modes for presets: contain, cover (crop to center). Keep it simple.
- Output format and quality selectable.
- Multiple files at once, with ZIP download.

### 3.4 Shared features across all three tools
- **Strip metadata (EXIF, GPS location) option**, ON by default, explained in simple words as a privacy feature.
- Progress indicator per image and overall. Processing in **Web Workers** so the UI never freezes.
- Cancel button for batch work.
- Clear, friendly error messages (corrupt file, unsupported format, file too large, out of memory).
- **Image size limit: DEFAULT 50 MB per image, 50 images per batch** (put in `config/limits.ts`; the owner has not set an image limit yet). On low-memory phones, process images one at a time and warn when a batch is large.
- Nothing is uploaded. Do not make any network request containing file data.

---

## 4. Tech stack (decided)

- **Next.js (App Router) + TypeScript + Tailwind CSS**, configured for **static export** (`output: 'export'`).
- **i18n:** `next-intl` (or an equivalent that fully supports static export with App Router). URLs: `/en/...` and `/bn/...`. Root `/` redirects to a locale (default `en`; optionally detect browser language on the client).
- **Image codecs:** **jSquash** packages (Squoosh WASM codecs), because browser Canvas compression is lower quality and AVIF encoding is not available in every browser:
  - `@jsquash/jpeg` (MozJPEG), `@jsquash/webp`, `@jsquash/avif`, `@jsquash/png` and `@jsquash/oxipng`, `@jsquash/resize` if useful.
  - Use **Canvas/OffscreenCanvas** for decoding and simple resizing, and as a fallback.
- **HEIC decoding:** `heic2any` or `libheif-js` (choose the one that works best in a static build and a Web Worker; note the choice).
- **ZIP:** `fflate` or `JSZip`.
- **Workers:** all heavy work in Web Workers. Wrap them in a small typed helper (message protocol with progress, result, error, cancel).
- **State:** keep it simple (React state plus a small store such as Zustand if needed).
- **Analytics:** privacy-friendly only (Plausible or Umami), added behind an environment variable, disabled by default. No Google Analytics. No cookies banner needed if no cookies are used.
- **Fonts:** self-host via `next/font`:
  - Bengali: **Hind Siliguri** (or Noto Sans Bengali).
  - English/Latin: **Nunito** (or Poppins).
  - Make sure Bengali glyphs render correctly everywhere, including buttons and the language switch.

---

## 5. Internationalization (important)

- **All user-facing text lives in translation files** (`messages/en.json`, `messages/bn.json`). No hard-coded strings in components. Not even button labels, error messages, or alt text.
- Provide complete Bengali translations written in natural, simple Bengali (not stiff or machine-sounding). Technical words like "JPG", "PNG", "ZIP", "KB" stay in English letters.
- Language switcher visible in the header on every page. Remember the choice (localStorage is fine).
- SEO: per-locale `<title>` and meta description, `hreflang` alternates, `lang` attribute on `<html>` set per locale, a sitemap that includes both locales.
- Numbers and file sizes display with a locale-aware formatter (Bengali digits are optional; keep a setting to switch, default to Latin digits for clarity).

---

## 6. Design system (decided)

**Theme:** Dark by default, with a light mode toggle (remember the choice). **Main color: Blue.** **Feel: colorful and playful.**

### Color tokens (define as CSS variables / Tailwind theme)
- Background: `#0B1220` (deep navy)
- Surface/card: slightly lighter navy (about `#121B2E`), with a subtle border
- Primary: `#3B82F6` (bright blue)
- Text: near-white (about `#E6EDF7`), muted text a softer blue-gray
- **Per-tool accent colors** (this is what makes it colorful):
  - Compress: green/teal
  - Convert: orange
  - Resize: purple
- Success, warning, error colors that are clearly visible on dark.

Create a matching light theme with the same hues.

### Style rules
- Large rounded corners, soft shadows, friendly spacing.
- Emoji or small friendly illustrations as tool icons (e.g. 🗜️ compress, 🔄 convert, 📐 resize).
- Playful micro-interactions: the drop zone gently bounces/glows on drag-over, smooth animated progress bars, and a small **confetti** celebration when a job finishes. Respect `prefers-reduced-motion` (disable confetti and heavy animation).
- Playful success messages that show the real result, e.g. "🎉 70% smaller!" (translated in both languages).
- **Contrast warning:** playful designs often fail contrast. All text must meet **WCAG AA** contrast on its background, especially muted text on dark surfaces and on colored accents. Must be readable on a phone in bright sunlight.
- **Mobile-first**: design for a 360px-wide phone first, then scale up. Touch targets at least 44px. No horizontal scrolling. The file picker, sliders, and download buttons must be easy to use with one thumb.

---

## 7. Page layouts

### Header (all pages)
Logo/wordmark, tool links (Compress, Convert, Resize), language switch (বাংলা / EN), theme toggle. On phones, collapse into a clean menu or a bottom/top tab bar.

### Tool pages (Compress / Convert / Resize share one layout shell)
1. Page title and one-line description (translated), with the tool's accent color and icon.
2. Tool tabs for quick switching between the three tools.
3. A large **drag-and-drop zone** in the middle ("Drop images here or tap to choose").
4. After files are added: a list of image cards, each with thumbnail, file name, original size, tool-specific controls, result size, saved percentage, and a download button for that file.
5. Before/after slider for the selected image (Compress page at minimum).
6. A bottom action bar: **"Download all (ZIP)"**, plus Clear all.
7. A **privacy badge** near the drop zone and in the footer: "🔒 Your images stay on your device" (translated).
8. Below the tool: a short, genuinely helpful "How it works / FAQ" section in both languages (also good for SEO).

### Home page
Hero with the promise ("Free image tools. Your files never leave your device."), three big colorful tool cards (from the tool registry), a short "Why ChobiKit" section (private, free, fast, works on phone, Bengali and English), and a footer.

### Footer
Links to About, Privacy, Terms, Contact. Privacy summary line.

### Static pages
- **Privacy:** explain clearly that files are processed locally and never uploaded; list what little data (if any) analytics collects.
- **Terms**, **About**, **Contact** (a simple email link or mailto form; no backend). These pages are also needed if the owner later applies for ad networks.

---

## 8. Phase 1b (after Milestone 6): SEO landing pages

Data-driven pages such as `/[locale]/jpg-to-png`, `/png-to-jpg`, `/png-to-webp`, `/webp-to-jpg`, `/heic-to-jpg`, `/jpg-to-webp`, `/avif-to-jpg`. These reuse the Convert tool with the formats pre-selected, and each has its own translated title, description, and short FAQ. Generate them from a single config array so adding more is trivial. Include them in the sitemap.

---

## 9. Privacy, security, and quality requirements

- No upload of file content, ever. Add a **Content-Security-Policy** (via `_headers` file for Cloudflare Pages) that blocks unexpected network destinations.
- Revoke object URLs and free memory after use to avoid leaks. Large batches must not crash the tab.
- Validate file type by content/extension and handle unknown files gracefully.
- Handle EXIF orientation correctly (photos must not come out rotated wrongly).
- Preserve or intentionally drop metadata according to the toggle.
- Works offline-friendly where easy (optional PWA later, not now).
- Browser support: latest Chrome, Edge, Firefox, Safari, and Chrome on Android. Feature-detect and degrade gracefully (for example, if AVIF encoding is unavailable, hide or disable it with an explanation).
- Accessibility: keyboard usable, proper labels and ARIA for the drop zone and sliders, visible focus states.
- Performance: aim for Lighthouse 90+ on mobile for Performance, Accessibility, Best Practices, SEO. Lazy-load WASM codecs only when needed (do not ship them on the home page).

---

## 10. Suggested project structure

```
/app/[locale]/(pages: page, compress, convert, resize, privacy, terms, about, contact)
/components (ui, layout, tools, dropzone, image-card, compare-slider, ...)
/lib/tools-registry.ts
/lib/image (codecs, decode, encode, resize, metadata, zip)
/workers (image-worker.ts + typed messaging helper)
/config/limits.ts, /config/presets.ts, /config/seo-pages.ts
/messages/en.json, /messages/bn.json
/public (favicons, og image)
CLAUDE.md, PLAN.md, README.md
```

---

## 11. Not decided yet (do not invent final answers; use defaults and flag them)

- Domain name (owner will buy it later; keep the site URL in one env variable).
- Logo (use a simple text wordmark with a small icon for now).
- Monetization (owner may later consider ads; keep the layout able to host ad slots without redesign, but add no ads now).
- Analytics provider (Plausible vs Umami; disabled by default).
- Final image size limits (defaults in section 3.4).

---

## 12. Milestones

Work one at a time. After each, stop and report.

1. **Foundation:** Next.js + TypeScript + Tailwind + static export, next-intl with `en` and `bn`, fonts, design tokens, dark/light theme, header/footer, tool registry, home page, empty tool pages. Writes `CLAUDE.md` and `PLAN.md`.
2. **Shared tool engine:** drop zone, file list, image card, Web Worker messaging helper, ZIP download, error handling, privacy badge, limits config.
3. **Image Compressor:** codecs (jSquash), quality slider, target-size mode, size stats, before/after slider, ZIP.
4. **Image Converter:** all formats including HEIC, transparency background color, format support detection.
5. **Image Resizer:** dimensions with aspect lock, percent, presets, fit modes.
6. **Polish:** playful animations and confetti (with reduced-motion support), full Bengali and English copy review, FAQ sections, Privacy/Terms/About/Contact pages, accessibility pass, performance pass, CSP headers, sitemap, hreflang, meta tags, README with deploy steps for Cloudflare Pages.
7. **Phase 1b:** SEO landing pages from section 8.

---

## 13. Definition of done for each milestone

- `npm run build`, lint, and type-check all pass with no errors.
- Works on a 360px phone viewport and on desktop, in both languages, in both themes.
- No hard-coded user-facing strings.
- **Offline test passes:** after the page loads, with the network disabled, the tool still processes images (proves nothing is sent to or needed from a server).
- Manually test with: a large JPG, a PNG with transparency, a HEIC file, a tiny image, a corrupt file, and a batch of 20 images.
- A short summary for the owner: what was built, how to run it, what you assumed (DEFAULT items), and what the next milestone is.

**Begin now with step 0 and Milestone 1.**
