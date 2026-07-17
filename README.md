# ToolAnchor

**[toolanchor.com](https://toolanchor.com)** — 200+ free online tools that run entirely in your browser. No uploads, no sign-up, no watermarks, no "3 free conversions per day".

Merge PDFs, convert HEIC photos, remove image backgrounds, trim videos, count words, format JSON, calculate your EMI. It's all here, and your files never leave your device.

## Why this exists

Most "free online tools" sites upload your files to a server, throttle you until you pay, and slap a watermark on the result. That always felt backwards to me. A laptop from 2018 is perfectly capable of merging a PDF or converting a video on its own; the server is only there so the site can charge you for it.

So ToolAnchor takes the opposite approach. Everything that *can* run in the browser *does* run in the browser, using the Canvas API, WebAssembly, and a pile of excellent open-source libraries. Your 500 MB video gets trimmed on your machine. Your scanned contract gets OCR'd on your machine. The site works offline once you've visited it.

## What's inside

Around **207 tools** across six categories:

- **PDF** — merge, split, compress, protect/unlock, fill & sign, OCR scanned PDFs, PDF ↔ Word, PDF ↔ images ([pdf-lib](https://github.com/Hopding/pdf-lib), [pdf.js](https://mozilla.github.io/pdf.js/), qpdf compiled to WASM)
- **Image** — resize, crop, compress, convert (HEIC/WebP/AVIF/SVG…), background remover, EXIF viewer/editor/remover, passport photos, favicons, meme generator
- **Video & audio** — MP4 → MP3, video → GIF, trim, compress, screen & voice recorder ([ffmpeg.wasm](https://ffmpegwasm.netlify.app/) — the ~32 MB engine downloads once and is cached; your video never does)
- **Text** — word counter, case converter, paraphraser, readability checker, ATS resume checker, AI content detector, and a long tail of small text utilities
- **Developer** — JSON/XML/SQL formatters, JWT decoder, regex tester, QR & barcode generator/reader, CSV ↔ JSON ↔ Excel, cron explainer, color tools
- **Calculators** — loan/EMI, mortgage, SIP, compound interest, BMI, age, date math, time zones, unit conversion, and more

Plus a few things that grew around the tools:

- **Workflows** — guided multi-tool chains ("iPhone HEIC photos → A4 PDF"), with file handoff between steps so you don't re-download and re-upload
- **Presets** — deep links like `/tools/resize-image/instagram-post` that open a tool pre-configured
- **[/ask](https://toolanchor.com/ask)** — type what you're trying to do (or drop a file) and it routes you to the right tool. No AI involved, just a well-tuned intent matcher
- **Embeddable widgets** — 46 of the tools can go on your own site with one script tag
- **Three languages** — English, Spanish (`/es`), and Portuguese (`/pt`)
- **Installable PWA** that keeps working offline for every page you've visited

## The honest privacy note

~205 of the 207 tools are fully local, meaning files and text are processed in your browser and never touch a server. Two exceptions, both labeled in the UI:

1. **AI Content Detector.** The "deep analysis" mode sends your pasted text to a small API route, which can consult Gemini/Groq/HuggingFace if keys are configured. The basic stylometric analysis still runs locally.
2. **Speech to Text** uses the browser's built-in Web Speech API, so audio may be processed by your browser vendor (that's how Chrome implements it).

That's the whole list. Everything else — including the background remover and OCR, which people usually assume need a server — runs on your device.

## Works offline

ToolAnchor is an installable PWA with an offline-first service worker: every page you visit is cached on your device, so the calculators, text tools, developer tools, and PDF/image tools keep working with no connection at all. This falls out naturally from the architecture. When the "server" was only ever serving static HTML and the work happens on your device, losing the network doesn't break much. The exceptions are the tools that stream a large WASM engine on first use (video converter, OCR, background remover), which need to be online the first time.

## Embed the tools on your site

46 of the tools can be embedded on any website with two lines of HTML. No API key, no account, free for any site:

```html
<div data-toolanchor="bmi-calculator" data-theme="auto"></div>
<script async src="https://toolanchor.com/embed.js"></script>
```

The widget auto-resizes, follows the visitor's light/dark preference (or your override), and takes a custom accent color. Because embed pages load no analytics and process everything client-side, embedding one sends no data anywhere — not even to ToolAnchor. Builder and full widget list at [toolanchor.com/widgets](https://toolanchor.com/widgets).

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router) + React 19 + TypeScript
- [next-intl](https://next-intl.dev/) for i18n (en/es/pt)
- Heavy lifting in the browser: `pdf-lib`, `pdfjs-dist`, `@ffmpeg/ffmpeg`, `tesseract.js`, `@imgly/background-removal`, `heic2any`, `exifr`, `mammoth`, `docx`, `xlsx`, `qrcode`, `jsqr`, `jsbarcode`, `fflate`
- Fully static / ISR pages, deployed on Netlify
- A service worker (`public/sw.js`) for offline support

## Running it locally

```bash
git clone https://github.com/bishthub/toolanchor.git
cd toolanchor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). **No environment variables are required** — every optional integration degrades gracefully when its variable is unset. If you want the extras (AI detector providers, analytics, search-engine verification), copy `.env.example` to `.env.local` and fill in what you need.

## How the codebase is organized

Almost everything generates from a handful of typed registries in `lib/`:

| File | What it drives |
|---|---|
| `lib/tools.ts` | The single source of truth. One entry per tool → index pages, search, sitemap, JSON-LD, on-page copy. |
| `components/tools/registry.tsx` | Maps each tool slug to its lazy-loaded client component in `components/tools/`. |
| `lib/presets.ts` | Preset pages (`/tools/<tool>/<preset>`). |
| `lib/workflows.ts` | The guided multi-tool workflows. |
| `lib/guides.ts` / `lib/glossary.ts` / `lib/alternatives.ts` | Editorial content collections. |
| `app/sitemap.ts` | Builds itself from all of the above — new tools appear automatically. |

Adding a tool is two steps: add an entry to `lib/tools.ts`, and add a component in `components/tools/` wired up in the registry. Everything else (routing, sitemap, search, category pages) picks it up on its own.

## Contributing

Bug reports and tool suggestions are very welcome: [open an issue](https://github.com/bishthub/toolanchor/issues). If a tool gives you a wrong result or chokes on a file it should handle, an issue with the file type and browser version is gold.

---

Built and maintained as a solo project. If ToolAnchor saved you from a "free" converter with a watermark, [share it with someone](https://toolanchor.com). That's the whole growth strategy.
