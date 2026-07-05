# ToolAnchor 10x Plan

This is the master implementation sheet for the next round of platform work. It is
self-contained: everything needed to execute is written here or discoverable from the
files it references. Work through the phases **in order** (each phase ships value on its
own; later phases build on earlier ones). One phase = one commit series. Do not start a
phase until the previous one builds cleanly.

**How to use this file:** pick the first unchecked phase, read its spec, implement it,
run the QA checklist at the bottom, tick the checkbox, commit. Update this file's
checkboxes as part of the same commit.

---

## 1. Platform snapshot (read before writing code)

ToolAnchor (toolanchor.com) is a free, privacy-first toolbox of ~110 browser-side tools
(PDF, image, media, text, developer, calculator). Next.js App Router, fully static
pages, deployed on **Netlify** with git auto-deploy (do NOT suggest or configure Vercel).

### Single sources of truth — everything generates from these

| File | What it drives |
|---|---|
| `lib/tools.ts` | The `TOOLS` array. A–Z index, category pages, homepage, search, nav, sitemap, JSON-LD, llms.txt, on-page SEO (intro/steps/faqs/answer). Add a tool = add one entry here. |
| `components/tools/registry.tsx` | slug → lazy-loaded client component map. Every tool component lives in `components/tools/` and receives `ToolProps { initialFiles?: File[]; preset?: Record<string,string> }`. |
| `lib/presets.ts` | `PRESETS` array → `/tools/<tool>/<preset>` static SEO pages. Resolved client-side by `usePreset()` in `lib/preset.ts` (URL query params override preset values). |
| `lib/intent.ts` | No-AI intent matcher for the `/ask` assistant. `ALIASES` (phrase → slug) and `FILE_AUTOLOAD` (tools that accept `initialFiles`). |
| `lib/handoff.ts` | Module-memory file handoff between tools (`setHandoff`/`takeHandoff`). Used by `components/SendToTool.tsx` ("Continue with →" chips, targets hardcoded in its `TARGETS` map). |
| `lib/usage.ts` | localStorage recents + pins (`ta:recents`, `ta:pins`), `USAGE_EVENT` window event for live UI updates. |
| `lib/ffmpeg.ts` | Shared lazy ffmpeg.wasm loader (single-threaded core from pinned CDN, ~32 MB, no COOP/COEP needed). Use for all media tools. |
| `lib/guides.ts`, `lib/alternatives.ts`, `lib/glossary.ts` | SEO content collections; sitemap + llms.txt pick them up automatically. |
| `app/sitemap.ts` | Auto-generates from all registries above — new tools/presets appear automatically, no manual edits. |
| `public/sw.js` | Offline-first service worker. Bump `VERSION` when shipping breaking changes. |

Key deps already installed: `pdf-lib`, `pdfjs-dist`, `@ffmpeg/ffmpeg`, `tesseract.js`,
`@imgly/background-removal`, `heic2any`, `exifr`, `qrcode`, `jsbarcode`, `yaml`.

The only server-side code is `app/api/ai-detect` (AI content detector) and
`app/api/indexnow`. Everything else must stay client-side — that is the product's moat.

### Conventions & guardrails

- **Design**: "Graphite" system — professional, neutral, Linear-grade. No playful
  visuals, no emoji in UI (use `components/CategoryIcon.tsx` SVG icons), no
  AI-generic gradients. Match existing components' look exactly; use existing CSS
  variables (`var(--muted)` etc. in `app/globals.css`).
- **Every new tool needs**: entry in `lib/tools.ts` (with `intro`, `steps`, `faqs`,
  `answer`, `keywords`), component in `components/tools/`, one line in
  `registry.tsx`, aliases in `lib/intent.ts` `ALIASES`, and — if it accepts a file —
  membership in `FILE_AUTOLOAD` + consider `SendToTool` `TARGETS`.
- **Client-side only** unless impossible. No file ever leaves the device.
- **Commits**: conventional style (`feat:`, `refactor:`), **never** add a
  `Co-Authored-By` trailer.
- **Verify** with `npm run build` (static export must succeed) before every commit.
- Lazy-load heavy libs inside the tool component (the registry already code-splits
  per tool — keep it that way).

---

## 2. Phase overview

| # | Phase | Effort | Depends on |
|---|---|---|---|
| 1 | Universal drop zone | S–M | — |
| 2 | Batch processing | M | — |
| 3 | Target-size presets (programmatic SEO) | S | — |
| 4 | Privacy as the brand | S | — |
| 5 | New tools, wave 1 (media + PDF gaps) | L | — |
| 6 | New tools, wave 2 (generators + image) | L | — |
| 7 | Workflows (guided chains) | M | 1 |
| 8 | Shareable calculator state + "do next" strip | S | — |
| 9 | i18n | XL | do last |

---

## Phase 1 — Universal drop zone ☑ (done)

> Shipped: `components/UniversalDrop.tsx` mounted in `app/layout.tsx`; window-level
> drag/drop + paste, skips native inputs/`[data-owns-drop]`, pointer-events:none drag
> hint so it never steals a tool's own drop. `lib/intent.ts` gained `fileKind()` +
> `toolsForFile()`. Handoff now carries `File[]` (`lib/handoff.ts`), consumed by
> `ToolPageRunner`; `JpgToPdf` + `jpg-to-pdf` added to `FILE_AUTOLOAD` for multi-image
> → PDF drops. Hero drop hint added on the homepage.

**Goal:** drop (or paste) any file anywhere on the site → instantly see matching
actions → click one → land on that tool with the file already loaded. Turns the whole
site into one instrument. All plumbing exists; this is mostly wiring.

**Spec:**
1. New client component `components/UniversalDrop.tsx`, mounted once in
   `app/layout.tsx` (alongside `PwaRegister`/`CommandPalette`).
2. Listen for `dragover`/`drop` on `window`. On drag, show a full-viewport overlay
   ("Drop file to see what you can do") reusing the visual language of
   `components/FileDragGlow.tsx`. **Do not** hijack drops on tool pages that already
   handle their own drop targets — skip when the event target is inside a
   `[data-owns-drop]` element; add that attribute to existing tool drop zones.
3. On drop (or `paste` with a file/image on non-input targets): classify the file by
   MIME/extension and build an action list. Add a helper to `lib/intent.ts`:
   `toolsForFile(file: File): Tool[]` — reuse the existing file-type logic the
   assistant uses, restricted to `FILE_AUTOLOAD` members, ordered by usefulness
   (e.g. PDF → compress, merge, split, to-text, to-images; image → compress, resize,
   convert, background-remover, metadata; video → mp4-to-mp3, video-to-gif,
   trim-video; audio → future audio tools).
4. Render results in a bottom sheet / centered panel: file name + size, then one
   action chip per tool (icon via `CategoryIcon`, tool name). Clicking:
   `setHandoff(file, "drop")` then `router.push` to the tool. Tools already read
   `initialFiles` via the assistant path — confirm each target actually auto-loads
   handoff files on mount (pattern used by `/ask`); fix any that don't.
5. Multiple files dropped: if all same kind, offer the multi-file tools first
   (merge-pdf, jpg-to-pdf); otherwise use the first file.
6. Homepage hero: add a subtle "or drop a file anywhere" hint line under the search.

**Acceptance:** dropping a PDF on the homepage, a guide page, and a calculator page
all show the panel; choosing Compress lands on compress-pdf with the file loaded;
Esc/click-outside dismisses; existing per-tool drop zones behave unchanged; paste of
a screenshot offers image actions.

---

## Phase 2 — Batch processing ☑ (done)

> Shipped: `lib/zip.ts` (`downloadAsZip`, fflate, store-only, de-dupes names) +
> `lib/canvas.ts` (`loadImage`/`canvasBlob`/`renameExt`) + shared
> `components/tools/BatchFileList.tsx` (sequential run, per-row status/savings,
> per-file + .zip download, `runToken` re-run, `onClear`). Retrofitted CompressImage,
> ImageConverter (covers all 6 format converters), ResizeImage (batch = fit-inside
> box), CompressPdf (shared `compressPdf` pipeline), ImageMetadataRemover — each keeps
> its single-file UX and branches to batch when >1 file is selected. tools.ts copy +
> intent ALIASES updated; image category intro mentions batch. `dep: fflate`.

**Goal:** competitors gate batch behind paid plans (server costs); ours is free
client-side. "Compress 50 images at once — free, no upload" is a headline feature.

**Spec:**
1. Add dep `fflate` (tiny, fast ZIP). New helper `lib/zip.ts`:
   `downloadAsZip(files: {name: string; data: Blob|Uint8Array}[], zipName: string)`.
2. New shared component `components/tools/BatchFileList.tsx`: file rows with name,
   original size → result size (and % saved where relevant), per-file status
   (queued / processing / done / error), per-file download, "Download all (.zip)",
   "Clear". Process sequentially to bound memory; show overall progress.
3. Retrofit, in this order (each is an independent commit):
   - `CompressImage` (accept multi-select + multi-drop)
   - `ImageConverter` + the single-purpose converters (`heic-to-jpg`, `webp-to-jpg`,
     `jpg-to-webp`, `png-to-webp`, `avif-to-jpg` — they likely share internals; check
     before duplicating)
   - `ResizeImage`
   - `CompressPdf`
   - `ImageMetadataRemover`
4. Update each retrofitted tool's `lib/tools.ts` entry (description/intro/faqs) to
   say batch is supported ("compress up to N images at once — still 100% local"),
   and add batch phrasing to `ALIASES` ("compress multiple images", "bulk resize").
5. Homepage/category copy: mention batch where true.

**Acceptance:** 20 mixed-size JPGs compress in one go with correct per-file savings;
ZIP downloads and opens; a corrupt file errors on its row without killing the batch;
single-file flow is unchanged (no extra clicks for the common case).

---

## Phase 3 — Target-size compression presets ☑ (done)

> Shipped: 9 target presets in `lib/presets.ts` (compress-image to-20/50/100/200kb,
> compress-pdf to-50/100/200/500kb/1mb) via `params: { kb }`, India exam/job-portal
> copy. CompressImage reads `kb` and binary-searches JPEG quality, stepping dimensions
> down when needed (`compressToTarget`); CompressPdf steps quality/resolution down
> until it fits (`compressPdfToTarget`). Both honestly report the smallest achievable
> size when the target is impossible, hide manual sliders in target mode, and support
> target in batch. ALIASES cover "compress X to Nkb"/"under N kb". Pages generate
> statically, appear in sitemap + parent-tool preset chips; `?kb=` query override works.

**Goal:** "compress pdf to 100kb", "compress image to 20kb" are massive
exam-form/job-portal queries (already targeting India with GST/SIP/FD calculators).
Preset scaffolding exists; this is a compression mode + data entry.

**Spec:**
1. `CompressImage`: add target-size mode — binary-search `canvas.toBlob` quality
   (and step down dimensions if quality floor can't reach target) until output ≤
   target. Read target from preset key `kb` via `usePreset`.
2. `CompressPdf`: same idea — iterate image quality/DPI in the existing pipeline
   until under target; if impossible, deliver the smallest achievable and say so
   plainly (never fake success).
3. Add to `lib/presets.ts`:
   - compress-image: `to-20kb`, `to-50kb`, `to-100kb`, `to-200kb`
   - compress-pdf: `to-50kb`, `to-100kb`, `to-200kb`, `to-500kb`, `to-1mb`
   Each with real `context` copy (use cases: government forms, job applications,
   email limits). Follow the existing resize-image preset entry shape exactly —
   preset pages, sitemap and llms.txt then generate themselves.
4. Add matching `ALIASES` ("compress pdf to 100kb", "pdf under 100 kb", …).

**Acceptance:** `/tools/compress-pdf/to-100kb` builds statically, pre-fills the
target, and a 2 MB text-heavy PDF actually lands ≤ 100 KB; `?kb=300` query override
works; impossible targets produce an honest "smallest possible: X KB" result.

---

## Phase 4 — Privacy as the brand ☑ (done)

> Shipped: `local?: boolean` on the Tool interface (default true). Audit found only
> `ai-content-detector` touches a server — set `local: false`. `components/LocalBadge.tsx`
> (expandable "prove it → Network tab" note) renders on every tool + preset page header;
> shell-bar chip is variant-aware. Homepage hero now states the claim + verify framing;
> About gained a "How local processing works" section (privacy page already covered it).
> Also corrected the AI detector's copy, which falsely claimed "in-browser, no external
> AI service" — it's now honest that quick-check is local and deep analysis is opt-in
> server-side. Engine-from-CDN caveat worded around user *data*, not network requests.

**Goal:** "your files never leave your device" is the strongest claim we have and
it's currently buried in category intros. Make it explicit, verifiable, everywhere.

**Spec:**
1. Add `local?: boolean` (default true) to the `Tool` interface; set `local: false`
   on `ai-content-detector` (uses `/api/ai-detect`) and any other server-touching
   tool. Audit `app/api/` to be sure.
2. New `components/LocalBadge.tsx`: a quiet, Graphite-styled inline badge on every
   tool page header — "Runs locally — this file never leaves your device" (or, for
   `local: false`, an honest "Text is sent to our server for analysis and not
   stored"). Tooltip/expandable note: "Verify it: open DevTools → Network tab and
   watch — no upload happens." Honesty caveat: ffmpeg/background-removal tools do
   fetch their **engine** from a CDN on first use — word the badge "your files never
   leave your device" (about the user's data), not "no network requests".
3. Homepage hero: one added line making the claim site-wide. `/about` and
   `/privacy`: short "How local processing works" section.
4. JSON-LD/meta: fold the claim into tool `description`s opportunistically as other
   phases touch them (no mass rewrite).

**Acceptance:** badge renders on all tool pages with correct variant; no layout
shift; claim is accurate for every tool (verified against `app/api/` usage).

---

## Phase 5 — New tools, wave 1: media + PDF gaps ◐ (8/10 shipped)

> **Shipped (8), all building + in sitemap, tool count 104→112:**
> - Media (ffmpeg.wasm, patterned on TrimVideo/Mp4ToMp3): **compress-video** (H.264
>   presets + 720p), **mute-video** (lossless `-an -c:v copy`), **audio-converter**
>   (mp3/wav/ogg/m4a + bitrate), **trim-audio** (lossless stream copy).
> - Recorders (browser APIs, no dep): **voice-recorder** (getUserMedia + MediaRecorder,
>   level meter, MP3 export), **screen-recorder** (getDisplayMedia + optional mic).
>   Both feature-detect and show a fallback on unsupported/mobile.
> - PDF (pdf-lib / pdfjs, no dep): **delete-pdf-pages** (tap-to-delete grid),
>   **sign-pdf** (draw/upload signature, click-to-place, fraction→points burn-in).
> - Wiring: tools.ts, registry, FILE_AUTOLOAD, ALIASES; SendToTool gained a `media`
>   kind (+ delete-pdf-pages in pdf targets); the 4 media tools render chaining.
>   trending: compress-video, delete-pdf-pages, screen-recorder, sign-pdf.
>
> **DEFERRED (2) — `protect-pdf` + `unlock-pdf`:** these need qpdf-wasm (pdf-lib can't
> encrypt). Dependency vetted: `@neslinesli93/qpdf-wasm` v0.3.0 ≈ 1.4 MB unpacked
> (acceptable — lazy-load like ffmpeg). NOT shipped because it's an Emscripten module
> with a runtime (FS/callMain/locateFile) I can't verify headlessly, and getting
> encryption subtly wrong is high-impact. Next step: write `lib/qpdf.ts` (CDN blob-URL
> loader mirroring lib/ffmpeg.ts), build the two tools, and **browser-QA before trusting**.

Highest-search-volume gaps that reuse the ffmpeg/pdf-lib investment. For **each**
tool follow the "every new tool needs" checklist in §1. Suggested build order:

| Slug | Name | Cat | Implementation notes |
|---|---|---|---|
| `compress-video` | Video Compressor | media | ffmpeg.wasm: `-crf` presets (quality high/med/low) + optional 720p downscale. Single-threaded is slow — show honest progress via ffmpeg `progress` events, warn on files > ~200 MB. Output mp4 (H.264). |
| `audio-converter` | Audio Converter (MP3/WAV/OGG/M4A) | media | ffmpeg.wasm, straightforward transcode; bitrate select. |
| `trim-audio` | Trim Audio | media | ffmpeg `-ss/-to` copy or re-encode; waveform optional (canvas from decodeAudioData) — ship without if it drags. |
| `mute-video` | Remove Audio from Video | media | ffmpeg `-an -c:v copy` — near-instant, easy win. |
| `voice-recorder` | Voice Recorder | media | `getUserMedia` + `MediaRecorder` → webm/opus; offer MP3 export via ffmpeg. No file input — recorder UI with level meter. |
| `screen-recorder` | Screen Recorder | media | `getDisplayMedia` + `MediaRecorder` → webm; optional mic mix via AudioContext; optional mp4 convert via ffmpeg. Feature-detect and hide on unsupported browsers/mobile. |
| `protect-pdf` | Protect PDF (Add Password) | pdf | pdf-lib does **not** encrypt. Use a qpdf WASM build (e.g. `@jspawn/qpdf-wasm`) — vet bundle size and load it lazily like ffmpeg. AES-256. |
| `unlock-pdf` | Unlock PDF | pdf | qpdf with user-supplied password (`--decrypt`). Only with the correct password — this is legitimate self-service, not cracking. |
| `sign-pdf` | Fill & Sign PDF | pdf | Render pages with pdfjs-dist → click to place signature (draw on canvas, type, or reuse `signature-generator` output via handoff) and text boxes → burn in with pdf-lib `drawImage`/`drawText`. The biggest build in this wave; ship signature-placement first, form-field text second. |
| `delete-pdf-pages` | Delete PDF Pages | pdf | Thin variant of existing `organize-pdf` logic; huge query volume justifies its own page. Reuse internals, don't duplicate. |

Wire new media tools into `SendToTool` `TARGETS` (add a `media`/`video` kind) and
`FILE_AUTOLOAD`. Add `trending: true` to the 3–4 most searched (compress-video,
sign-pdf, unlock-pdf, screen-recorder).

**Acceptance per tool:** works on a real file in Chrome + Safari; page has
intro/steps/faqs/answer; appears in sitemap, search, category page, command palette;
`/ask` finds it from natural phrasing ("make my video smaller").

---

## Phase 6 — New tools, wave 2: generators + image ◐ (6/7 shipped)

> **Shipped (6), all building + in sitemap, tool count 112→118:**
> - Image (canvas, no dep): **svg-to-png** (1–8× rasterize), **screenshot-beautifier**
>   (padding/bg/radius/shadow, live preview), **collage-maker** (2–6 photos, auto grid).
> - Generators: **code-to-image** (canvas + regex highlighting + system monospace —
>   deviated from shiki to avoid webfont canvas-tainting I can't verify headlessly),
>   **email-signature-generator** (table-based inline HTML, copy rich/HTML),
>   **invoice-generator** (pdf-lib, line items + tax/GST + currency incl. ₹→"Rs" in PDF,
>   localStorage draft).
> - Wiring: tools.ts, registry, ALIASES; image tools added to FILE_AUTOLOAD +
>   universal-drop actions (collage-maker multi-file). trending: screenshot-beautifier,
>   code-to-image, invoice-generator.
>
> **DEFERRED (1) — `image-upscaler`:** needs onnxruntime-web + a Real-ESRGAN model
> (heavy). Plan already flags it experimental "validate perf first; skip if it
> disappoints" — perf can't be validated headlessly, so deferred alongside qpdf.

| Slug | Name | Cat | Implementation notes |
|---|---|---|---|
| `invoice-generator` | Invoice Generator | image→(new "docs"?) | Form (seller/buyer/line items/tax/currency incl. ₹ + GST) → live preview → PDF via pdf-lib. localStorage draft. Keep category `calculator` or add a `docs` category if ≥3 doc tools land — adding a `CategoryId` fans out automatically, just update `CATEGORIES`. |
| `screenshot-beautifier` | Screenshot Beautifier | image | Canvas composite: padding, background (solid/gradient presets — keep tasteful/neutral), rounded corners, shadow, optional browser-chrome frame. Paste-from-clipboard support. Viral/backlink magnet. |
| `code-to-image` | Code to Image | developer | Syntax highlight with `shiki` (lazy) → render to SVG → rasterize to PNG. Theme + language + padding options. |
| `collage-maker` | Photo Collage Maker | image | Fixed grid layouts (2–6 photos), gap + corner radius controls, canvas export. No freeform dragging in v1. |
| `svg-to-png` | SVG to PNG | image | Rasterize via Image + canvas at chosen scale. Trivial; high volume. |
| `email-signature-generator` | Email Signature Generator | text | Form → table-based HTML (email-client-safe) → copy rich text + copy HTML. No images beyond a URL field. |
| `image-upscaler` | AI Image Upscaler | image | Real-ESRGAN via onnxruntime-web, lazy model download like background-remover. **Experimental — build last**; validate performance on a mid-range laptop first; skip if quality/speed disappoints. |

Same wiring checklist as Phase 5. Skip resume-builder and chart-maker for now
(scope too large relative to payoff — revisit after i18n).

---

## Phase 7 — Workflows: guided chains ☑ (done)

> Shipped: `lib/workflows.ts` (6 workflows) + `lib/workflow.ts` (sessionStorage state,
> survives reload) + handoff carries workflow context. `SendToTool` is workflow-aware
> (primary "Next: X" CTA that produces output + advances; "Finish" on last step);
> `WorkflowBar` in ToolPageRunner shows step n/N + dots + Exit. Added SendToTool handoff
> to JpgToPdf, ImageConverter (now `slug`-aware so heic-to-jpg detects correctly),
> BackgroundRemover, TrimVideo. `/workflows` + `/workflows/[slug]` static pages (HowTo +
> FAQ JSON-LD, client Start button); wired into sitemap, llms.txt, command palette,
> header + footer nav. Note: workflow "Next" CTA navigates directly (independent of
> SendToTool TARGETS), so cross-kind hops like resize→jpg-to-pdf work.
> **Needs browser QA:** the end-to-end multi-step flow (esp. job-application-pdf) and
> reload-resume — can't be verified headlessly.

**Goal:** promote one-hop handoff into named multi-step pipelines, each of which is
also a programmatic SEO page. V1 is a **guided chain**, not a new execution engine:
the user moves tool → tool with the file auto-carried and each step pre-configured.

**Spec:**
1. `lib/workflows.ts`: `{ slug, name, description, intro, steps: { tool: string;
   preset?: Record<string,string>; note: string }[] }`. Launch set (~6):
   - `iphone-photos-to-pdf`: heic-to-jpg → resize-image (a4-print) → jpg-to-pdf
   - `email-ready-photos`: compress-image (to-200kb) → *(done — batch from Phase 2)*
   - `scan-to-searchable-text`: image-to-text → *(copy/download)*
   - `job-application-pdf`: jpg-to-pdf → compress-pdf (to-100kb)
   - `video-to-social-clip`: trim-video → video-to-gif
   - `clean-photo-for-web`: background-remover → resize-image → compress-image
2. Extend `lib/handoff.ts` with an optional workflow context
   `{ workflow: string; step: number }` carried alongside the file.
3. `components/WorkflowBar.tsx`: when a workflow context is active, tool pages show
   a slim progress bar (step n of N, next-step name). On completing a step, the
   existing SendToTool area shows one primary "Next: <tool> →" action that sets the
   next handoff. Abandoning (navigating elsewhere) silently drops the context.
4. Pages: `/workflows` index + `/workflows/[slug]` (static, generated from the
   registry; explains steps, links tools, FAQ + HowTo JSON-LD; "Start" begins step
   1). Add both to `app/sitemap.ts` and the llms.txt route.
5. Add workflows to CommandPalette search and `/ask` intent aliases ("convert
   iphone photos to pdf").

**Acceptance:** completing `job-application-pdf` end-to-end takes a JPG to a
sub-100 KB PDF with zero re-uploads; refresh mid-flow degrades gracefully (file
re-select, workflow resumes); workflow pages build statically and appear in sitemap.

---

## Phase 8 — Shareable calculator state + "do next" strip ☑ (done)

> Shipped: `lib/share.ts` (`readShared`) + `components/ShareResult.tsx` (debounced
> replaceState URL sync + Copy-link button). Wired into all 9 calculators (loan-emi p/r/y,
> sip amt/r/y, fd p/r/y/f, compound-interest p/r/y/f, gst amt/r/mode, discount price/disc,
> percentage mode/a/b, age dob/at, bmi u/h/w) — each reads its keys on mount and syncs.
> `lib/usage.ts` gained transition tracking (`ta:transitions`, capped; `recordTransition`
> in addRecent, `getTopNext`); `components/DoNext.tsx` renders a "Do this next" strip on
> tool pages (local history first, then curated related; excludes current + dead slugs).
> **Needs browser QA:** paste a shared link → inputs refill + same result (client-only).

**Spec:**
1. Calculators (`loan-emi`, `sip`, `fd`, `percentage`, `compound-interest`, `gst`,
   `discount`, `age`, `bmi` first): write inputs to the URL via
   `history.replaceState` (debounced) using the same keys `usePreset` reads, and add
   a "Copy link" button. Every shared link becomes a long-tail landing page.
2. `lib/usage.ts`: also record tool→tool transitions
   (`ta:transitions`, capped map of "from→to" counts). New strip on tool result
   areas: "People often do next: …" — merge curated `related` + top local
   transitions + SendToTool targets. Purely local data; no analytics changes.

**Acceptance:** pasting a copied EMI link reproduces the exact calculation;
transition counts survive reload; strip never shows the current tool or dead slugs.

---

## Phase 9 — i18n ☐ (do last — multiplies everything above)

**Goal:** tool queries are heavily non-English (iLovePDF's moat is ~25 locales).
Even 4 locales roughly multiplies the indexable surface. This is an XL refactor —
plan it as its own project when reached; high-level shape:

1. `next-intl` with `app/[locale]/` route groups; default `en` stays at bare URLs
   (no `/en/` prefix), locales at `/hi/`, `/es/`, `/pt/`, `/id/`.
2. Localize the **chrome first** (nav, buttons, tool UI strings), then tool
   `name`/`description`/`intro`/`steps`/`faqs` via per-locale content files keyed by
   slug (keep `lib/tools.ts` as the structural registry; move prose to
   `content/<locale>/tools.ts`). Machine-translate + human-spot-check; ship locale
   by locale, not tool by tool.
3. `hreflang` alternates in sitemap + metadata; localized keywords in `ALIASES`
   (the intent matcher must understand "pdf chhota karo").
4. Static generation for every locale × page; watch build time and Netlify limits.

**Acceptance (per locale):** all live tool pages render translated and build
statically; hreflang validates; `/ask` matches at least the top-20 tools from
native-language phrasing.

---

## QA checklist (run for every phase)

- [ ] `npm run build` succeeds (static export, no new warnings)
- [ ] New pages appear in `/sitemap.xml` and `app/llms.txt` output automatically
- [ ] New tools: registered in `lib/tools.ts` + `registry.tsx` + `ALIASES`
      (+ `FILE_AUTOLOAD`/`SendToTool` if file-based); findable in CommandPalette,
      `/tools` A–Z, category page, and `/ask`
- [ ] Tested in Chrome and Safari (WebKit differs on canvas/MediaRecorder/wasm)
- [ ] Mobile viewport sanity check (tools are heavily mobile-trafficked)
- [ ] No file/network leak: user data must not leave the device (DevTools Network
      check) except documented `local: false` tools
- [ ] Graphite design: neutral, no emoji, matches existing components
- [ ] Heavy libs lazy-loaded inside the tool component, not in shared bundles
- [ ] `public/sw.js` VERSION bumped if cached routes/assets changed shape
- [ ] Commit messages: conventional style, **no Co-Authored-By trailer**
