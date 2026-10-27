# PLAN — Little Learners BD

Bilingual (Bangla + English) early-learning PWA for ages 1–5. Module-based; **Picture Words** is module #1.

## Architecture

```
app/                      Vite + React + TS + Tailwind v4 + Zustand + Framer Motion (npm workspace)
  src/
    config.ts             BRAND constant + VITE_ASSET_BASE_URL
    modules/registry.ts   THE module registry (one entry per module)
    modules/<id>/         one folder per module (lazy-loaded, mounted at /m/<id>/*)
    services/             speech, assetCache, downloader, content (zod-validated fetch), events (local bus)
    store/                settings, progress (stars/stickers), downloads — persisted to IndexedDB (idb)
    ui/                   BigTile, FlashCard, ProgressRing, StarBurst, Confetti, AudioButton, PageSwipe, GameShell, Img, shell
    pages/                Home, Parent (gated), Credits (gated)
    sw.ts                 Workbox service worker (injectManifest)
  e2e/  tests/            Playwright / Vitest
content/<module>/         versioned content JSON (source of truth)  → copied to app/public/content/
incoming/                 source photos extracted from the picture-book PDF
scripts/                  extract-pdf, prepare-assets, generate-icons, lighthouse
```

### Data flow
`scripts/prepare-assets.ts` → resizes photos to 480/960 WebP into `app/public/dev-assets/picture-words/img/…`, copies
`content/**` to `app/public/content/**` and writes `manifest.json` (version + per-section packs with byte sizes) and
`assets.json` (per-file bytes / hash / dominant colour). The app loads `/content/<module>/manifest.json`, validates with zod,
and builds image URLs as `${VITE_ASSET_BASE_URL || /dev-assets}/<module>/img/{480|960}/<file>?v=<hash>`.

### Offline
* **App shell** precached by Workbox (JS/CSS/fonts/icons/html). Navigation falls back to the cached `/index.html`.
* **Module images/audio**: CacheFirst, one cache per module+kind (`picture-words-img-v1`), statuses 0/200, ExpirationPlugin
  maxEntries 2000, no maxAge. **Content JSON**: NetworkFirst (3 s timeout) into `content-v1`.
* **Downloader** (`services/downloader.ts`): per section ("pack") or whole module, concurrency 6, retry with exponential
  backoff, skips already-cached files (so it is resumable), progress via a zustand store.
* Eviction check (iOS): packs recorded as downloaded are verified against the cache; a banner asks to re-download.

## Milestones (each committed)
a. scaffold + PWA shell + routing + registry + schemas
b. Picture Words UI + flashcards + speech
c. offline caching + downloads
d. games + rewards
e. parent corner + credits + settings
f. asset pipeline + Cloudflare docs
g. placeholder modules, tests, Lighthouse, polish

All milestones are done; see README for how to run and `DECISIONS.md` for the judgement calls.
