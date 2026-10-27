# Little Learners BD

A calm, ad-free, **offline-first** bilingual (Bangla + English) early-learning PWA for children aged 1–5.
Module 1 is **Picture Words / ছবিতে শব্দ** (22 sections, 588 words) with flashcards, speech and three games.
Module 2 is **Poems / ছড়া** (35 Bangla children's poems read aloud line by line). Alphabet and Numbers exist as "coming soon" modules. No ads, no tracking, no login, no cookies.

See [PLAN.md](PLAN.md) (architecture) and [DECISIONS.md](DECISIONS.md) (judgement calls).

## Local development

Requirements: Node 20+ (tested on Node 26).

```bash
npm install                 # installs the root + app workspace
npm run assets              # (optional) resize photos -> app/public/dev-assets, copy content -> app/public/content
npm run dev                 # http://localhost:5173  (assets served from /dev-assets, no R2 needed)

npm run build               # prebuild runs the asset step, then tsc + vite build  -> app/dist
npm run preview             # serve the production build on http://127.0.0.1:4173 (service worker active)
npm test                    # Vitest (25 unit tests)
npx playwright install chromium   # once
npm run test:e2e            # Playwright smoke + OFFLINE test (builds and serves the app itself)
bash scripts/lighthouse.sh  # mobile Lighthouse on key pages (needs `npm run preview` running + CHROME_PATH)
```

The service worker is only active in the production build / preview, not in `npm run dev`.

## Content & asset preparation

* Source photos: `incoming/images/<itemId>.webp` (extracted from the picture-book PDF by
  `npx tsx scripts/extract-pdf.ts "<path>/My_First_Picture_Book_BigPhotos.pdf"`, which also rewrites `incoming/items.json`).
* Content JSON (source of truth): `content/picture-words/{sections,items}.json`, `content/poems/*`.
* `npm run assets` (`scripts/prepare-assets.ts`):
  1. produces 480 px and 960 px WebP (sharp, alpha kept) in `app/public/dev-assets/picture-words/img/{480,960}/`,
  2. copies `content/**` to `app/public/content/**`,
  3. writes `content/picture-words/manifest.json` (version hash, section packs, sizes) and `assets.json` (per-file bytes, hash, dominant colour).
* `npm run assets:upload` also uploads the 480/960 files to R2 with `Cache-Control: public, max-age=31536000, immutable`
  (via `wrangler r2 object put`). Set `R2_BUCKET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; without them the upload is skipped with a clear message.
* Icons / splash screens: `npm run icons` (original SVG mark → `app/public/icons`).

## Creating the R2 bucket, custom domain and CORS

1. Cloudflare dashboard → **R2** → *Create bucket* `little-learners-assets`.
2. Bucket → **Settings → Custom Domains** → add e.g. `assets.yourdomain.com` (enables the CDN cache).
3. Bucket → **Settings → CORS policy** → paste `r2-cors.json` (allows `GET/HEAD` from `*`). This is required so cached images are
   not opaque and the offline downloader can read them. (`wrangler r2 bucket cors set little-learners-assets --file r2-cors.json`)
4. Upload: `R2_BUCKET=little-learners-assets npm run assets:upload` (after `npx wrangler login`, or with an API token).
5. Content that lives in R2 must keep the layout `picture-words/img/{480|960}/<file>` (audio: `picture-words/audio/<file>`).

## Deploying the app shell to Cloudflare Pages

```bash
cp app/.env.example app/.env.production        # set VITE_ASSET_BASE_URL=https://assets.yourdomain.com
npm run build                                  # with the variable set, dist/dev-assets is removed (images come from R2)
npx wrangler pages deploy app/dist --project-name little-learners-bd
```

Or connect the Git repo in Pages: build command `npm install && npm run build`, output directory `app/dist`, env var
`VITE_ASSET_BASE_URL`. `app/public/_headers` (security + cache headers) and `_redirects` (SPA fallback) ship with the build;
`wrangler.toml` documents the project.

## Adding a section or an item

1. Add the section to `content/picture-words/sections.json` (`id`, `nameEn`, `nameBn`, `color`, `order`).
2. Add items to `content/picture-words/items.json`:
   `{ id, sectionId, en, bnPron, bnMeaning, emoji, image:{file,w,h,hasCutout}|null, credit:{author,license,sourceUrl,title}|null, audio?:{en?,bn?} }`
   (`image: null` → the emoji is shown). Put `<file>` in `incoming/images/`.
3. `npm run assets` (or `npm run build`) regenerates sizes + manifest; the version hash changes, so the Parent corner shows
   **"New content available"** to anyone who downloaded the module, and updating re-downloads only what is needed.
4. Recorded audio: upload `picture-words/audio/<file>` to R2 and set `audio` on the item — no code change.

## Adding a new module (example: Poems)

Poems is already stubbed as `coming-soon`; to build it for real:

1. Content: `content/poems/poems.json` (schema `{ id, titleBn, titleEn, lines:[{bn,en?,startMs,endMs}], audioKey, illustrationKey }`)
   and `content/poems/manifest.json` (`{ module, version, files, assetsFile, packs }`). Bump `version` on every change.
2. Code: `app/src/modules/poems/index.tsx` — default export a component with its own `<Routes>` (already exists: list → player).
   Use shared services (`speak`, `useProgress`, `GameShell`, `Screen`, `BigTile`…).
3. Assets: put recordings/illustrations on R2 under `poems/audio/…` / `poems/img/…`. The service worker caches
   `/<module>/(img|audio)/…` into `poems-img-v1` / `poems-audio-v1` automatically; the Parent corner lists the module's packs from the manifest.
4. Registry: in `app/src/modules/registry.ts` flip the single entry to `status: "ready"` and set `offlinePackSize`
   (and optionally `loadCredits`). **No change** to the shell, caching, settings or Parent corner is needed.

Brand name lives in one constant: `app/src/config.ts` (`BRAND`).

## Features (acceptance checklist)

Home with module tiles + progress rings · section grid · flashcards (swipe, arrows, auto-play, tap = bounce + speak) ·
Web Speech EN/BN with recorded-audio fallback · games *Find it!*, *Match* (3/4/6 pairs), *Which word?* on a shared `GameShell` ·
stars + section stickers · Parent corner behind an arithmetic gate (language, sound, speed, auto-play, game sections, per-section /
per-module / all downloads with progress and size, remove downloads, storage usage + `navigator.storage.persist()`, progress reset,
content-update check, About, Privacy, install help) · Credits page (every author/licence/source) · offline chip · "New version available" toast.

## Test & quality results

| Check | Result |
|---|---|
| `npm run build` (tsc + vite) | passes |
| `npm test` (Vitest) | 25 / 25 pass |
| `npm run test:e2e` (Playwright, Chromium, Pixel 7) | 5 / 5 pass, incl. **offline**: download section → offline → reload → browse + flashcard from cache |
| Lighthouse 12, mobile, 5 pages | Performance 90–93, Accessibility 100, Best Practices 100, SEO 100 |
| Initial JS | ≈ 130 KB gzip (limit 200 KB) |

Lighthouse 12 removed the PWA category, so installability is covered by the manifest (192/512 + maskable icons, shortcuts,
standalone/portrait), the registered service worker and the offline e2e test.

## Manual steps for the owner

1. **Cloudflare**: create the R2 bucket + custom domain + CORS, upload assets, create the Pages project and set
   `VITE_ASSET_BASE_URL` (no credentials were available here). Until then the app serves images from `/dev-assets` inside the build.
2. **Verify image rights**: the PDF photos are assumed to be the ones credited in `items.json`; 100 emoji-style cards have no credit on file (see DECISIONS #4).
3. **Real-device checks** on iOS Safari / Android Chrome: Bangla voice availability (install Bangla TTS if missing), install to home screen,
   airplane-mode test after "Download everything".
4. Optional: record human audio and add `audio` to items.
5. Optional: decide whether backgrounds should be *removed* from the photos (see DECISIONS #2).
