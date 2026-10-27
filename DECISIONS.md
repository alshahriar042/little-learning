# DECISIONS

Judgement calls made autonomously (newest context at the bottom of each topic).

## Content & images
1. **Images come from the PDF, not `incoming/images`.** On the owner's instruction the old cut-out images were deleted and
   `scripts/extract-pdf.ts` (uses `mupdf`) renders each page of `My_First_Picture_Book_BigPhotos.pdf`
   (68 pages; every page is one full-page raster) and crops the 2×3 card grid's photo rectangles. Photos map to
   `items.json` in order; the count matches exactly (363). Spot-checked visually.
2. **"with background" was interpreted as: keep the photo backgrounds exactly as printed in the PDF** (no background removal).
   All items therefore have `hasCutout: false` and the UI uses framed photo cards (not floating cut-outs with drop-shadow).
   If background *removal* was intended, add a matting step to `extract-pdf.ts` and set `hasCutout: true`.
3. Native resolution of the PDF photos is ~700×410 px, so the 960 px variant is not up-scaled (`withoutEnlargement`);
   480/960 files differ only for photos wider than 480 px.
4. 100 of the 363 PDF cards are emoji-style artwork rather than photographs. Their `credit` is `null` in the source JSON, so they
   do not appear on the Credits page. **Owner should verify the licence of that artwork** (probably Noto Emoji / Apache 2.0)
   and the assumption that the existing `credit` data in `items.json` describes the PDF's photos.
5. Item order inside a section follows the PDF/JSON order (not alphabetical).

## Architecture
6. npm **workspace** (root `package.json`, project in `app/`) so `scripts/` at the repo root can use the same `node_modules`.
7. **Content JSON is not precached**; it is served NetworkFirst so content can be updated by redeploying only `content/`
   without an app release (the manifest `version` is a hash of content + asset hashes). It is cached on first visit, so the app
   still works offline after one online load.
8. Image URLs carry `?v=<8-char hash>` so assets can be `immutable` for a year yet still be updated.
9. `manifest.json` (small: packs, counts, byte sizes) is split from `assets.json` (≈75 KB per-file map) so Home can show progress
   without loading the big file.
10. Service worker uses **injectManifest** with `rollupFormat: "iife"` so cache names are derived per module from the URL
    (`/<module>/(img|audio)/` → `<module>-<kind>-v1`) — no per-module SW config; the same helper is used by the downloader.
11. `crossorigin="anonymous"` is set on images when `VITE_ASSET_BASE_URL` is an absolute URL, and the downloader uses CORS mode, so
    cached responses are not opaque (opaque responses are charged ~7 MB of quota each in Chromium). R2 therefore **must** send
    `Access-Control-Allow-Origin: *` (see `r2-cors.json`). The SW still accepts status 0 as a fallback.
12. When `VITE_ASSET_BASE_URL` is set, the build deletes `dist/dev-assets` so Cloudflare Pages doesn't host 25 MB of images.
13. Framer-Motion is used through `LazyMotion` + `domAnimation`; swipe is hand-written with pointer events (no drag feature) to keep
    the initial bundle at ~130 KB gzip.
14. The Poems module is registered `coming-soon` (greyed tile with ribbon) but its route has the full structure
    (list → player with line highlight, 2 sample poems, text-only timing, TTS for Bangla).
    Alphabet and Numbers share the generic `ComingSoon` component.

## UX
15. Default UI language is **Bangla** (parents in Bangladesh); every module tile shows both languages; the Parent corner switches
    UI language bn/en. Item names always show English + Bangla.
16. **Parental gate = arithmetic** (a + b with 6..9, four answer buttons) valid for 10 minutes in memory; press-and-hold was not
    added because a toddler can hold a button for 3 s. Credits links (external) live behind the gate too.
17. Positive-only game feedback: wrong → gentle shake + "try again 💛"; stars only for first-try answers.
18. Stickers: one per completed section (all cards viewed), emoji chosen deterministically from the section id.
19. Speech: recorded audio (`item.audio.en|bn` → `<module>/audio/<file>`) is preferred over Web Speech automatically; no code change
    needed when real recordings are dropped into R2. If no Bangla voice exists the parent corner says so.
20. Colours from the content (`sections.json`) are darkened (28 %) when used as backgrounds under white text so contrast passes.

## Testing / quality
21. Lighthouse **12** has no PWA category any more. PWA-ness is verified instead by: valid manifest, SW registered,
    installable icons (192/512 any + maskable), and the Playwright **offline** test. Mobile Lighthouse scores: see README.
22. Generated folders `app/public/dev-assets` and `app/public/content` are git-ignored and rebuilt by `npm run build` (prebuild).
    `incoming/images` (the extracted photos, ~19 MB) is committed so the pipeline is reproducible without the PDF.

## Not done / needs the owner
* Cloudflare R2 bucket, custom domain, CORS and Pages project (no credentials available) → README "Manual steps for the owner".
* Real recorded Bangla/English audio (optional, drop-in).
* Real-device testing on iOS Safari (only Chromium was available).

## Extra items (added after the first release)
23. `scripts/add-items.ts` adds 227 words (10 new sections: colours, shapes, clothes, at home, school, jobs, sky & nature, music,
    places, toys; plus extras in 11 existing sections) using Google **Noto Emoji** SVGs (Apache-2.0, fetched from jsDelivr, cached in
    `.cache/`) rendered onto a pastel 4:3 card (`incoming/images/*.webp`). They carry a credit. Total: 22 sections, 590 words.
    The script is idempotent. **Do not re-run `extract-pdf.ts` afterwards without re-running `add-items.ts`**, because extract-pdf
    rewrites `incoming/items.json` from the PDF only. Bangla meanings/pronunciations are my own and should be proof-read.
24. Words added to the 12 ORIGINAL sections now use **real photographs**, not emoji art: `scripts/add-photos.ts` replaced them with
    Wikimedia Commons images (CC BY / CC BY-SA / CC0 / public domain only; author, licence and source page are stored as the credit
    and shown on the Credits page). Picks were reviewed by eye on a contact sheet; some are the best available rather than ideal
    (e.g. *Bowling* is a rendered image, *Satellite* is a Soyuz craft, *Flying saucer* is a historic B/W photo). "Muscle" and
    "Pointing up" were dropped because no suitable photo was found. The 10 NEW sections still use Noto Emoji cards (decision 23).
    Total now: 22 sections, 588 words.
25. The 8 newer sections (clothes, at home, school, jobs, sky & nature, music, places, toys) were also switched to real photographs:
    first by Commons text search (`add-photos.ts`, `MODE=new`), then, for poor matches, by the lead photo of the matching English
    Wikipedia article (`add-wiki-photos.ts`). Every photo was reviewed on a contact sheet; 12 items with no good photo were put back
    to Noto Emoji cards (`REVERT=... add-items.ts`). **Colours and Shapes stay emoji/graphic cards**: a photo cannot show "red" or
    "triangle" unambiguously. Remaining emoji cards: colours 11, shapes 7, plus 12 single items. Wikimedia text search is weak for
    generic words, so a few photos are "best available" rather than ideal; replace any by editing `PICK`/`MAP` and re-running.
26. **Poems module is now `ready`** with 10 poems in `content/poems/poems.json`: 8 traditional Bengali nursery rhymes / public-domain
    poems (Madan Mohan Tarkalankar d.1858, Rabindranath Tagore d.1941 – opening lines only) plus 1 original rhyme for this app. Nazrul
    and other authors still in copyright were deliberately NOT used. Lines were typed from memory of the well-known versions (rhymes have
    variants) and the English is a loose meaning-translation, so **a Bangla speaker should proof-read** `poems.json`. Reading uses the
    device Bangla voice line by line (waits for each line to finish, so no fixed timings); recorded audio can be added later via `audioKey`.
27. Poems grew to **27, tagged Class 1-5** (`grade` field, filter chips on the list). Poems from the official NCTB Class 1-5 textbooks are
    still under copyright, so they were NOT copied. Instead: traditional rhymes, public-domain poems (D. L. Roy "ধনধান্যে", Tagore,
    Madan Mohan Tarkalankar) and **17 originals written for this app** on typical Class 1-5 topics (counting, mother, colours, hygiene,
    days, seasons, national symbols, trees, Language Day, time, honesty, village). Difficulty is graded by length and vocabulary only.
    Originals were written by an AI and **must be proof-read by a Bangla teacher/parent** (rhyme, wording, suitability) before wide release.
    Re-create with `node scripts/add-poems.mjs`.
28. Poems: 35 total. Added "নোটন নোটন পায়রাগুলি" (text copied exactly from Jogindranath Sarkar's খুকুমণির ছড়া, 1899, via Bengali Wikisource),
    "আমার পণ / সকালে উঠিয়া" (Madan Mohan Tarkalankar; opening 4 lines typed from memory, author confirmed by web search but the text
    could not be checked online) and 7 more originals. "আতা গাছে তোতা পাখি" was corrected to the text collected in Tagore's
    ছেলেভুলানো ছড়া. Other traditional rhymes (আগডুম বাগডুম, দোল দোল দোলুনি, হাট্টিমা টিম টিম, ঘুম পাড়ানি...) are the popular
    modern variants from memory; the 1899 originals differ in places (e.g. "ঘোড়ার ডিম সাজে"). Variants are normal for folk rhymes.
29. **No audio is taken from YouTube** (copyright + YouTube terms; this is a public site). No freely licensed Bengali recitations of these
    poems exist on Wikimedia Commons either. Instead the player supports recordings (`audioKey` + per-line `startMs/endMs`) and
    `scripts/add-poem-audio.mjs` attaches a recording you own / are licensed to use (auto-detects line timings from pauses). Until a
    recording is added the poem is read by the device voice. The service worker now answers byte-range requests from cached audio.
