# ChobiKit

Free image tools that run 100% in your browser — your files never leave your device.
Bengali + English. Built with Next.js (static export), TypeScript, Tailwind CSS.

## Run locally

```
npm install
npm run dev      # http://localhost:3000 redirects to /en or /bn
```

## Production build

```
npm run build    # static export to out/
```

## Deploy (Cloudflare Pages)

1. Push the repo to GitHub.
2. Cloudflare Pages → Create project → connect the repo.
3. Build command: `npm run build`  ·  Output directory: `out`
4. Set `NEXT_PUBLIC_SITE_URL` when the domain is bought.

Full spec lives in `chobikit-master-prompt.md`; project context in `CLAUDE.md`.
