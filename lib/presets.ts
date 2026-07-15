// ─────────────────────────────────────────────────────────────────────────
// Tool presets — programmatic SEO pages that open a tool pre-configured.
// Each preset renders at /tools/<tool>/<slug>, is statically generated,
// listed in the sitemap, and cross-linked from its parent tool page.
// ─────────────────────────────────────────────────────────────────────────

import type { Faq } from "@/lib/tools";

export interface ToolPreset {
  slug: string;                    // URL segment under the tool
  tool: string;                    // parent tool slug
  name: string;                    // H1 / card title
  metaTitle: string;               // <title>
  description: string;             // meta description + lede
  answer: string;                  // quick-answer callout (extractable)
  params: Record<string, string>;  // handed to the tool component
  chip: string;                    // short label for preset chips
  faqs: Faq[];
}

/* ── Resize-image size presets ───────────────────────────────────────── */

interface SizeDef {
  slug: string;
  label: string;      // "Instagram post"
  w: number;
  h: number;
  context: string;    // where this size is used, for copy
}

const SIZES: SizeDef[] = [
  { slug: "instagram-post",    label: "Instagram post",      w: 1080, h: 1080, context: "square Instagram feed posts" },
  { slug: "instagram-story",   label: "Instagram story",     w: 1080, h: 1920, context: "full-screen Instagram Stories and Reels covers" },
  { slug: "youtube-thumbnail", label: "YouTube thumbnail",   w: 1280, h: 720,  context: "YouTube video thumbnails" },
  { slug: "youtube-banner",    label: "YouTube banner",      w: 2560, h: 1440, context: "YouTube channel art" },
  { slug: "facebook-cover",    label: "Facebook cover",      w: 820,  h: 312,  context: "Facebook page cover photos" },
  { slug: "twitter-header",    label: "X / Twitter header",  w: 1500, h: 500,  context: "X (Twitter) profile headers" },
  { slug: "linkedin-banner",   label: "LinkedIn banner",     w: 1584, h: 396,  context: "LinkedIn profile background banners" },
  { slug: "pinterest-pin",     label: "Pinterest pin",       w: 1000, h: 1500, context: "standard Pinterest pins" },
  { slug: "og-image",          label: "Open Graph image",    w: 1200, h: 630,  context: "link-preview (Open Graph) images for websites" },
  { slug: "discord-avatar",    label: "Discord avatar",      w: 512,  h: 512,  context: "Discord profile pictures" },
  { slug: "whatsapp-dp",       label: "WhatsApp profile",    w: 500,  h: 500,  context: "WhatsApp profile photos" },
  { slug: "full-hd",           label: "Full HD (1080p)",     w: 1920, h: 1080, context: "Full HD wallpapers and video frames" },
  { slug: "4k",                label: "4K (2160p)",          w: 3840, h: 2160, context: "4K UHD wallpapers and displays" },
  { slug: "hd-720p",           label: "HD (720p)",           w: 1280, h: 720,  context: "HD displays and lightweight web images" },
  { slug: "passport-2x2",      label: "Passport 2×2 in",     w: 600,  h: 600,  context: "US passport photos (2×2 inches at 300 DPI)" },
  { slug: "a4-print",          label: "A4 print (300 DPI)",  w: 2480, h: 3508, context: "A4 documents printed at 300 DPI" },
];

const RESIZE_PRESETS: ToolPreset[] = SIZES.map((s) => ({
  slug: s.slug,
  tool: "resize-image",
  name: `Resize Image for ${s.label} (${s.w}×${s.h})`,
  metaTitle: `Resize Image to ${s.w}×${s.h} — ${s.label} Size, Free`,
  description: `Resize any photo to exactly ${s.w}×${s.h} pixels — the right size for ${s.context}. Free, private, in your browser: no upload, no sign-up.`,
  answer: `To resize an image for ${s.context}, set the dimensions to ${s.w}×${s.h} pixels. This tool is pre-configured with that size — drop your image, and the width and height are applied automatically. Everything runs in your browser; the image is never uploaded.`,
  params: { w: String(s.w), h: String(s.h) },
  chip: `${s.label} · ${s.w}×${s.h}`,
  faqs: [
    {
      q: `What is the correct image size for ${s.context}?`,
      a: `${s.w}×${s.h} pixels. This preset applies that size automatically when you load an image.`,
    },
    {
      q: "Will resizing distort my photo?",
      a: `If your photo has a different aspect ratio than ${s.w}:${s.h}, it will be stretched to fit. For a distortion-free result, crop it to the right ratio first with the Crop Image tool, then resize.`,
    },
    {
      q: "Is my image uploaded anywhere?",
      a: "No. Resizing happens entirely in your browser using the canvas API — the file never leaves your device.",
    },
  ],
}));

/* ── Compression presets ─────────────────────────────────────────────── */

const COMPRESS_PRESETS: ToolPreset[] = [
  {
    slug: "for-web",
    tool: "compress-image",
    name: "Compress Image for Web (70% quality)",
    metaTitle: "Compress Image for Web — Fast, Free, No Upload",
    description: "Compress a photo to web-friendly size at 70% JPEG quality — the sweet spot between sharpness and file size. Free and private, right in your browser.",
    answer: "For websites, 70% JPEG quality is the widely used sweet spot: files shrink by 60–80% with barely visible quality loss. This preset applies it automatically — drop an image and download the compressed result. Nothing is uploaded.",
    params: { q: "0.7" },
    chip: "For web · 70%",
    faqs: [
      { q: "What quality should I use for web images?", a: "70% JPEG quality is the standard recommendation — big savings with virtually no visible difference at normal viewing sizes." },
      { q: "How much smaller will my image get?", a: "Typically 60–80% smaller than an unoptimised original, depending on the source image." },
    ],
  },
  {
    slug: "for-email",
    tool: "compress-image",
    name: "Compress Image for Email (50% quality)",
    metaTitle: "Compress Image for Email Attachments — Free, No Upload",
    description: "Shrink a photo enough to attach to any email at 50% JPEG quality. Free, private, in-browser — no upload, no sign-up.",
    answer: "Email providers commonly cap attachments at 20–25 MB. Compressing at 50% JPEG quality typically cuts photo size by 75–90%, letting several photos fit in one email. This preset applies 50% automatically; your image never leaves your device.",
    params: { q: "0.5" },
    chip: "For email · 50%",
    faqs: [
      { q: "How do I compress photos to send via email?", a: "Load your photos on this page — each one is re-compressed at 50% JPEG quality, typically cutting the size by 75–90% — then download and attach the smaller copies to your email. It's free, and the photos never leave your device." },
      { q: "Why do my photos fail to send by email?", a: "Most providers cap attachments (Gmail: 25 MB). Modern phone photos can be 5–12 MB each, so a few photos exceed the cap — compressing them first fixes it." },
      { q: "Is 50% quality too low?", a: "For photos viewed in an email client, 50% is usually fine. If you see artifacts, try the 70% web preset instead." },
    ],
  },
  {
    slug: "for-email",
    tool: "compress-pdf",
    name: "Compress PDF for Email (small size)",
    metaTitle: "Compress PDF for Email — Under Attachment Limits, Free",
    description: "Shrink a PDF to fit email attachment limits with an aggressive size-focused preset. Free and private — the PDF is processed in your browser, never uploaded.",
    answer: "Email attachment limits are usually 20–25 MB. This preset re-renders PDF pages at reduced image quality (50%) and resolution (1.2×), which typically shrinks scanned or image-heavy PDFs by 70–90% — enough to attach to any email. Processing happens locally in your browser.",
    params: { q: "0.5", r: "1.2" },
    chip: "For email · small",
    faqs: [
      { q: "Why is my PDF too big to email?", a: "Scanned pages and embedded photos inflate PDFs quickly. Re-rendering them at lower quality and resolution removes most of that weight." },
      { q: "Will the text stay selectable?", a: "No — pages are re-rendered as images to achieve the size reduction, so text becomes part of the image. Keep the original if you need selectable text." },
    ],
  },
];

/* ── Target-size presets (compress to ≤ N KB) ────────────────────────── */
// Huge query volume around exam/job-portal upload limits — "compress image to
// 20kb", "compress pdf to 100kb". The tools read the `kb` param and search for
// the best quality that lands under it.

interface TargetDef {
  slug: string;
  kb: number;
  label: string;   // "100 KB"
  context: string; // where this limit shows up, for copy
}

const IMG_TARGETS: TargetDef[] = [
  { slug: "to-20kb",  kb: 20,  label: "20 KB",  context: "strict photo and signature fields on government exam and visa forms (SSC, UPSC, and similar)" },
  { slug: "to-50kb",  kb: 50,  label: "50 KB",  context: "photo upload fields on most online application and registration forms" },
  { slug: "to-100kb", kb: 100, label: "100 KB", context: "job-portal profile photos and document upload limits" },
  { slug: "to-200kb", kb: 200, label: "200 KB", context: "general web uploads and forums that cap images at 200 KB" },
];

const IMG_TARGET_PRESETS: ToolPreset[] = IMG_TARGETS.map((t) => ({
  slug: t.slug,
  tool: "compress-image",
  name: `Compress Image to ${t.label}`,
  metaTitle: `Compress Image to ${t.label} — Free, No Upload`,
  description: `Compress a JPG or PNG photo to under ${t.label} for ${t.context}. Free and private — the image is resized and re-compressed in your browser, never uploaded.`,
  answer: `To compress an image to ${t.label}, this tool automatically searches for the highest JPEG quality that lands under ${t.label}, stepping the dimensions down if needed. Drop your photo and it targets ${t.label} for you. If a file genuinely can't reach ${t.label} while staying legible, it delivers the smallest possible version and tells you the exact size. Everything runs in your browser.`,
  params: { kb: String(t.kb) },
  chip: `≤ ${t.label}`,
  faqs: [
    { q: `How do I compress an image to ${t.label}?`, a: `Load your image on this page — it automatically finds the best quality that keeps the file under ${t.label}. You'll see the final size before you download.` },
    { q: `What if my photo can't reach ${t.label}?`, a: `The tool lowers quality and, if needed, the dimensions to get as close as possible. If ${t.label} is impossible without destroying the image, it shows you the smallest size it could achieve instead of pretending it worked.` },
    { q: "Is my image uploaded?", a: "No. Compression happens entirely in your browser — the file never leaves your device." },
  ],
}));

const PDF_TARGETS: TargetDef[] = [
  { slug: "to-50kb",  kb: 50,   label: "50 KB",  context: "the tightest form upload limits" },
  { slug: "to-100kb", kb: 100,  label: "100 KB", context: "government form and exam application uploads, which are often capped at 100 KB" },
  { slug: "to-200kb", kb: 200,  label: "200 KB", context: "common document upload limits on job and admission portals" },
  { slug: "to-500kb", kb: 500,  label: "500 KB", context: "portals that allow up to 500 KB per document" },
  { slug: "to-1mb",   kb: 1024, label: "1 MB",   context: "email attachments and general uploads with a 1 MB cap" },
];

const PDF_TARGET_PRESETS: ToolPreset[] = PDF_TARGETS.map((t) => ({
  slug: t.slug,
  tool: "compress-pdf",
  name: `Compress PDF to ${t.label}`,
  metaTitle: `Compress PDF to ${t.label} — Free, No Upload`,
  description: `Reduce a PDF's file size to under ${t.label} for ${t.context}. Free and private — pages are re-rendered at progressively lower quality in your browser until the file fits, never uploaded.`,
  answer: `To compress a PDF to ${t.label}, this tool re-renders the pages at progressively lower quality and resolution until the file drops under ${t.label}. Drop your PDF and it targets ${t.label} automatically. If ${t.label} isn't reachable, it delivers the smallest version it can and tells you the exact size rather than faking success. Processing happens locally in your browser.`,
  params: { kb: String(t.kb) },
  chip: `≤ ${t.label}`,
  faqs: [
    { q: `How do I reduce a PDF's size to ${t.label}?`, a: `Load your PDF here and it steps the image quality and resolution down until the file is under ${t.label}, then lets you download it. You'll see the final size first.` },
    { q: `Can I compress a PDF to ${t.label} without losing quality?`, a: `Some quality loss is unavoidable when targeting a fixed size — but the tool always uses the highest quality that still fits under ${t.label}, so it loses no more than necessary. The closer your original is to ${t.label}, the less visible the difference.` },
    { q: "Will the text stay selectable?", a: "No — to hit a strict size target, pages are re-rendered as images, so text becomes part of the image. Keep the original if you need selectable text." },
    { q: `What if the PDF can't reach ${t.label}?`, a: `Very long or dense PDFs may not fit ${t.label} while staying readable. In that case the tool shows the smallest size it achieved instead of claiming success.` },
    { q: "Is my PDF uploaded?", a: "No — compression runs entirely in your browser." },
  ],
}));

/* ── Case-converter mode presets ─────────────────────────────────────── */

interface CaseDef {
  slug: string;
  mode: string;
  label: string;     // "UPPERCASE"
  example: string;   // "HELLO WORLD"
  useCase: string;
}

const CASES: CaseDef[] = [
  { slug: "uppercase",     mode: "upper",    label: "UPPERCASE",     example: "HELLO WORLD",  useCase: "headings, acronyms and emphasis" },
  { slug: "lowercase",     mode: "lower",    label: "lowercase",     example: "hello world",  useCase: "normalising shouty text or data cleanup" },
  { slug: "title-case",    mode: "title",    label: "Title Case",    example: "Hello World",  useCase: "headlines, book titles and UI labels" },
  { slug: "sentence-case", mode: "sentence", label: "Sentence case", example: "Hello world.", useCase: "fixing text typed in all-caps" },
];

const CASE_PRESETS: ToolPreset[] = CASES.map((c) => ({
  slug: c.slug,
  tool: "case-converter",
  name: `Convert Text to ${c.label}`,
  metaTitle: `Convert Text to ${c.label} — Free Online, Instant`,
  description: `Paste any text and convert it to ${c.label} instantly (e.g. “${c.example}”) — useful for ${c.useCase}. Free, private, in your browser.`,
  answer: `To convert text to ${c.label}, paste it into the box below — the conversion happens live as you type, then copy the result with one click. Everything runs in your browser; nothing is uploaded.`,
  params: { mode: c.mode },
  chip: c.label,
  faqs: [
    { q: `How do I convert text to ${c.label}?`, a: `Paste your text into this page — it converts to ${c.label} automatically as you type. Click “Copy result” when done.` },
    { q: "Is there a length limit?", a: "No. Conversion runs locally in your browser, so even very long documents convert instantly." },
    { q: "Is my text stored or uploaded?", a: "No — the text never leaves your device." },
  ],
}));

/* ── Countdown-timer duration presets ("5 minute timer" etc.) ────────── */

interface TimerDef { slug: string; m: number; label: string; useCase: string; }

const TIMERS: TimerDef[] = [
  { slug: "1-minute-timer",  m: 1,  label: "1 Minute",  useCase: "quick tasks, plank holds and speed rounds" },
  { slug: "5-minute-timer",  m: 5,  label: "5 Minute",  useCase: "short breaks, brewing tea and quick workouts" },
  { slug: "10-minute-timer", m: 10, label: "10 Minute", useCase: "power naps, study sprints and timed quizzes" },
  { slug: "15-minute-timer", m: 15, label: "15 Minute", useCase: "meetings, workouts and homework blocks" },
  { slug: "20-minute-timer", m: 20, label: "20 Minute", useCase: "exercise sets, cooking and focused work" },
  { slug: "25-minute-timer", m: 25, label: "25 Minute", useCase: "a classic Pomodoro focus session" },
  { slug: "30-minute-timer", m: 30, label: "30 Minute", useCase: "workouts, baking and deep-work blocks" },
  { slug: "60-minute-timer", m: 60, label: "1 Hour",    useCase: "exams, long study sessions and slow cooking" },
];

const TIMER_PRESETS: ToolPreset[] = TIMERS.map((t) => ({
  slug: t.slug,
  tool: "countdown-timer",
  name: `${t.label} Timer`,
  metaTitle: `${t.label} Timer — Online Countdown With Alarm`,
  description: `A free ${t.label.toLowerCase()} countdown timer with an alarm — great for ${t.useCase}. Starts with one click and keeps counting accurately in background tabs.`,
  answer: `This page opens a ${t.label.toLowerCase()} countdown timer — press Start and an alarm sounds when the time is up. It counts against a fixed end time, so it stays accurate even in a throttled background tab, and the remaining time shows in the tab title. Runs entirely in your browser.`,
  params: { m: String(t.m) },
  chip: `${t.label}`,
  faqs: [
    { q: `How do I set a ${t.label.toLowerCase()} timer?`, a: `The duration is already set on this page — just press Start. You can pause, resume or reset at any time.` },
    { q: "Will the alarm sound if I switch tabs?", a: "Yes — the countdown tracks a fixed end time, so it stays accurate in background tabs, and the remaining time shows in the tab title." },
    { q: "Is anything uploaded?", a: "No — the timer and alarm run entirely in your browser." },
  ],
}));

/* ── "Days until <holiday>" presets — evergreen countdown queries ────── */
// The tool resolves m/d to the NEXT occurrence, so these pages never go stale.

interface HolidayDef { slug: string; name: string; m: number; d: number; blurb: string; }

const HOLIDAYS: HolidayDef[] = [
  { slug: "christmas",       name: "Christmas",        m: 12, d: 25, blurb: "December 25th — the most counted-down day of the year" },
  { slug: "new-year",        name: "New Year",         m: 1,  d: 1,  blurb: "January 1st — the start of the new year" },
  { slug: "halloween",       name: "Halloween",        m: 10, d: 31, blurb: "October 31st — costumes, candy and pumpkins" },
  { slug: "valentines-day",  name: "Valentine's Day",  m: 2,  d: 14, blurb: "February 14th" },
  { slug: "4th-of-july",     name: "the 4th of July",  m: 7,  d: 4,  blurb: "US Independence Day" },
  { slug: "summer",          name: "Summer",           m: 6,  d: 21, blurb: "the June solstice — the astronomical start of northern-hemisphere summer" },
];

const DAYS_UNTIL_PRESETS: ToolPreset[] = HOLIDAYS.map((h) => ({
  slug: h.slug,
  tool: "days-until-calculator",
  name: `Days Until ${h.name.replace(/^the /, "The ")}`,
  metaTitle: `How Many Days Until ${h.name.replace(/^the /, "the ")}? — Live Countdown`,
  description: `Count down the exact days until ${h.name} (${h.blurb}) — plus weeks, hours and minutes. Always up to date, free, in your browser.`,
  answer: `This page counts the exact days until ${h.name}, always measured to the next occurrence — so it stays correct year after year. You'll also see the countdown in weeks, months, hours and minutes, and you can switch the target to any other date. It runs entirely in your browser.`,
  params: { m: String(h.m), d: String(h.d) },
  chip: `Until ${h.name.replace(/^the /, "")}`,
  faqs: [
    { q: `How many days until ${h.name}?`, a: `The live counter above shows the exact number of days until ${h.name}, calculated from today's date to the next occurrence — along with weeks, hours and minutes.` },
    { q: "Does it count today?", a: "The count is the number of midnights between today and the target date — the standard way countdowns are measured, so the day itself isn't included." },
    { q: "Can I count down to a different date?", a: "Yes — change the target date above to any day (a birthday, a deadline, a trip) and every figure updates instantly." },
  ],
}));

/* ── SIP duration presets — "sip calculator for 25 years" queries ─────── */

const SIP_YEARS = [10, 15, 20, 25, 30];

const SIP_PRESETS: ToolPreset[] = SIP_YEARS.map((y) => ({
  slug: `for-${y}-years`,
  tool: "sip-calculator",
  name: `SIP Calculator for ${y} Years`,
  metaTitle: `SIP Calculator for ${y} Years — Monthly Investment Growth`,
  description: `Calculate what a monthly SIP grows to in ${y} years: total invested, estimated returns and final value at your expected rate. Free, instant, private.`,
  answer: `To see what a SIP is worth after ${y} years, enter your monthly amount and expected annual return — the time period is already set to ${y} years. The calculator shows the total you'll invest (months × amount), the estimated returns from compounding, and the final value. Over ${y >= 20 ? "long horizons like this, compounding typically makes returns exceed the amount invested" : "this horizon, compounding contributes a substantial share of the final value"}. Everything runs in your browser.`,
  params: { y: String(y) },
  chip: `${y} years`,
  faqs: [
    { q: `How much will a SIP grow in ${y} years?`, a: `It depends on the monthly amount and the return rate: enter both above (the ${y}-year period is pre-filled) and you'll see the invested total, estimated returns and final value instantly. At 12% annual return, a ${y}-year SIP's final value is roughly ${y >= 25 ? "4–6×" : y >= 20 ? "3–4×" : y >= 15 ? "2.5–3×" : "2×"} the amount invested.` },
    { q: "Is a longer SIP better?", a: "Compounding accelerates with time — the last years of a long SIP typically add more value than the first years combined. That's why starting early matters more than starting big." },
    { q: "Are the returns guaranteed?", a: "No — the calculation assumes a constant annual return, but market returns vary year to year. Treat the result as an estimate for planning, not a promise." },
  ],
}));

export const PRESETS: ToolPreset[] = [
  ...RESIZE_PRESETS,
  ...COMPRESS_PRESETS,
  ...IMG_TARGET_PRESETS,
  ...PDF_TARGET_PRESETS,
  ...CASE_PRESETS,
  ...TIMER_PRESETS,
  ...DAYS_UNTIL_PRESETS,
  ...SIP_PRESETS,
];

export function presetsForTool(toolSlug: string): ToolPreset[] {
  return PRESETS.filter((p) => p.tool === toolSlug);
}

export function getPreset(toolSlug: string, presetSlug: string): ToolPreset | undefined {
  return PRESETS.find((p) => p.tool === toolSlug && p.slug === presetSlug);
}
