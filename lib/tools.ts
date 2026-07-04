// ─────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every tool on the site.
// The A-Z index, category pages, homepage, search, nav, sitemap, JSON-LD and
// on-page SEO content all generate themselves from this array.
// To add a tool: add one entry here, then register its component in
// components/tools/registry.tsx (slug must match).
// ─────────────────────────────────────────────────────────────────────────

import { LAST_REVIEWED } from "./site";

export type CategoryId =
  | "pdf"
  | "image"
  | "media"
  | "text"
  | "developer"
  | "calculator";

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  blurb: string;
  intro?: string;                                  // longer intro paragraph for the category page
  chooser?: { need: string; toolSlug: string }[];  // "which tool should I use?" decision list
  faqs?: Faq[];                                     // category-level FAQ → FAQPage schema
}

export interface Faq {
  q: string;
  a: string;
}

export interface Tool {
  slug: string; // URL: /tools/<slug>
  name: string; // H1 + link text
  category: CategoryId;
  description: string; // <meta description> + card subtitle (~155 chars)
  keywords: string[]; // search + meta keywords
  status: "live" | "soon";
  intro: string; // on-page lead paragraph (SEO body copy)
  steps: string[]; // "How to use" list → rendered + HowTo JSON-LD
  faqs: Faq[]; // rendered as content + FAQPage JSON-LD
  trending?: boolean; // surfaced in the homepage "New & Trending" section
  // Optional 40–60 word self-contained answer, rendered as a "quick answer"
  // callout at the top of the page — the most extractable passage for AI
  // answer engines. Falls back to `description` when omitted.
  answer?: string;
  // ISO yyyy-mm-dd this tool was last reviewed. Falls back to LAST_REVIEWED.
  updated?: string;
  // Optional explicit related tool slugs (may cross categories). When present,
  // these lead the "Related tools" list; the rest is filled from the category.
  related?: string[];
  // Whether the tool processes the user's data entirely on-device. Defaults to
  // true — the whole site is local-first. Set false only for tools that send
  // user data to a server (e.g. the AI content detector's model API).
  local?: boolean;
}

export const CATEGORIES: Category[] = [
  {
    id: "pdf", name: "PDF Tools", emoji: "📄",
    blurb: "Merge, split, rotate and convert PDFs — right in your browser, no uploads.",
    intro: "These PDF tools handle the everyday document jobs — combining files, pulling out pages, fixing orientation, shrinking file size and converting to and from images and text. Unlike most online PDF services, every tool here runs locally in your browser using the pdf-lib and pdf.js libraries, so your documents are never uploaded to a server. That makes them fast and safe for sensitive files like contracts and statements.",
    chooser: [
      { need: "Combine several PDFs into one file", toolSlug: "merge-pdf" },
      { need: "Pull specific pages out of a PDF", toolSlug: "split-pdf" },
      { need: "Make a PDF small enough to email", toolSlug: "compress-pdf" },
      { need: "Turn photos or scans into a PDF", toolSlug: "jpg-to-pdf" },
      { need: "Copy the text out of a PDF", toolSlug: "pdf-to-text" },
    ],
    faqs: [
      { q: "Are my PDFs uploaded to a server?", a: "No. Every PDF tool here processes your file entirely in your browser, so the document never leaves your device." },
      { q: "Is there a file-size or daily limit?", a: "There are no artificial limits — you're bounded only by your device's available memory." },
      { q: "Do I need to install anything or sign up?", a: "No. The tools run in any modern browser with no installation and no account." },
    ],
  },
  {
    id: "image", name: "Image Tools", emoji: "🖼️",
    blurb: "Resize, crop, compress and convert images. Nothing leaves your device.",
    intro: "From resizing and cropping to background removal, compression, format conversion and metadata stripping, these image tools cover the common photo tasks. Compress, convert, resize and clean-metadata handle whole batches at once — process dozens of images in one pass and download them together as a .zip. They use the browser's Canvas API and, for background removal, an AI model that runs on your device via WebAssembly — so your images are processed locally and never uploaded, at full resolution and with no watermark.",
    chooser: [
      { need: "Change an image's pixel dimensions", toolSlug: "resize-image" },
      { need: "Reduce an image's file size", toolSlug: "compress-image" },
      { need: "Cut out the background", toolSlug: "background-remover" },
      { need: "Convert between JPG, PNG and WebP", toolSlug: "jpg-to-png" },
      { need: "Remove EXIF/GPS data before sharing", toolSlug: "image-metadata-remover" },
    ],
    faqs: [
      { q: "Are my photos uploaded?", a: "No — image tools run in your browser, so your photos stay on your device at full resolution." },
      { q: "Is there a watermark or resolution limit?", a: "Never. Downloads are free at full resolution with no watermark." },
      { q: "Which formats are supported?", a: "The common web formats — JPG/JPEG, PNG and WebP — are supported across the tools." },
    ],
  },
  {
    id: "media", name: "Video & Audio", emoji: "🎬",
    blurb: "Convert, trim and turn videos into GIFs — right in your browser, no uploads.",
    intro: "Extract audio, cut clips and turn video into GIFs without uploading a thing. These tools run FFmpeg compiled to WebAssembly (ffmpeg.wasm) directly in your browser, so your footage never leaves your device. The video engine (~32 MB) downloads once on first use and is then cached — after that, processing is fully local. Best suited to short clips; very large files can exceed a browser tab's memory.",
    chooser: [
      { need: "Get the audio (MP3) out of a video", toolSlug: "mp4-to-mp3" },
      { need: "Turn a video clip into a GIF", toolSlug: "video-to-gif" },
      { need: "Cut a shorter clip from a video", toolSlug: "trim-video" },
    ],
    faqs: [
      { q: "Are my videos uploaded?", a: "No — everything runs locally in your browser via ffmpeg.wasm. Only the engine binary is downloaded (once), not your video." },
      { q: "Why does the first run take a moment?", a: "The FFmpeg engine (~32 MB) downloads and initialises on first use, then it's cached for the rest of your session." },
      { q: "Is there a file-size limit?", a: "There's no upload, but browser memory limits very large videos. Short clips work best; trim long videos first." },
    ],
  },
  {
    id: "text", name: "Text Tools", emoji: "🔤",
    blurb: "Count, convert and transform text instantly and privately.",
    intro: "These text tools count, clean, convert and transform writing and data — word and character counts, case conversion, find-and-replace, sorting, de-duplication and more. Everything runs instantly in your browser as you type, with nothing sent to a server, which makes them safe for private notes, drafts and confidential text.",
    chooser: [
      { need: "Count words, characters and reading time", toolSlug: "word-counter" },
      { need: "Change text to UPPER, lower or Title Case", toolSlug: "case-converter" },
      { need: "Find and replace text in bulk", toolSlug: "find-and-replace" },
      { need: "Sort or de-duplicate a list of lines", toolSlug: "sort-text-lines" },
      { need: "Strip line breaks from pasted text", toolSlug: "remove-line-breaks" },
    ],
    faqs: [
      { q: "Is my text stored or uploaded?", a: "No — text tools run entirely in your browser, so nothing you type is sent anywhere." },
      { q: "Do they work offline?", a: "Once the page has loaded, most text tools keep working even without a connection." },
      { q: "Is there a length limit?", a: "No practical limit beyond your device's memory — paste as much as you need." },
    ],
  },
  {
    id: "developer", name: "Developer Tools", emoji: "⚙️",
    blurb: "Encoders, formatters and generators for everyday dev work.",
    intro: "A toolbox for everyday development: encode and decode Base64 and URLs, format and convert JSON/CSV/YAML, decode JWTs, generate hashes, UUIDs, QR codes and passwords, test regular expressions and look up HTTP status codes and MIME types. Each runs locally in your browser — safe for tokens, keys and other sensitive input — and pairs with a plain-English definition in our Glossary.",
    chooser: [
      { need: "Encode or decode Base64", toolSlug: "base64" },
      { need: "Inspect a JSON Web Token", toolSlug: "jwt-decoder" },
      { need: "Format and validate JSON", toolSlug: "json-formatter" },
      { need: "Generate a secure random password", toolSlug: "password-generator" },
      { need: "Create a QR code from a link", toolSlug: "qr-code-generator" },
    ],
    faqs: [
      { q: "Is my input (tokens, keys) sent to a server?", a: "No — developer tools run in your browser, so it's safe to paste sensitive tokens and data." },
      { q: "Where can I learn what these terms mean?", a: "See the Glossary for plain-English, cited definitions of JWT, Base64, UUID, MIME type and more." },
      { q: "Are they free?", a: "Yes — every developer tool is free with no sign-up." },
    ],
  },
  {
    id: "calculator", name: "Calculators", emoji: "🧮",
    blurb: "Fast, accurate calculators for everyday math.",
    intro: "Quick, accurate calculators for money, health, dates and everyday math — percentages, discounts, loan EMIs, compound interest, BMI and calories, tips, GPA, age and date differences, and more. Each shows its result instantly as you type, runs in your browser, and stores nothing.",
    chooser: [
      { need: "Work out a percentage", toolSlug: "percentage-calculator" },
      { need: "Estimate a loan repayment (EMI)", toolSlug: "loan-emi-calculator" },
      { need: "Project savings with compound interest", toolSlug: "compound-interest-calculator" },
      { need: "Check your BMI", toolSlug: "bmi-calculator" },
      { need: "Split a bill and tip", toolSlug: "tip-calculator" },
    ],
    faqs: [
      { q: "Are the calculators free and private?", a: "Yes — every calculator is free, needs no sign-up, and runs entirely in your browser." },
      { q: "Should I rely on these for financial or medical decisions?", a: "They're accurate estimates for everyday use, but not a substitute for professional financial or medical advice." },
      { q: "Do results update as I type?", a: "Yes — results recalculate instantly as you change the inputs." },
    ],
  },
];

export const TOOLS: Tool[] = [
  // ── PDF ──────────────────────────────────────────────────────────────
  {
    slug: "merge-pdf", name: "Merge PDF", category: "pdf", status: "live",
    description: "Combine multiple PDF files into one document in any order — free, fast and 100% private. Files never leave your browser.",
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger", "merge pdf free"],
    intro: "Merge PDF lets you combine two or more PDF files into a single document, in whatever order you choose. Everything runs locally in your browser, so your files are never uploaded to a server.",
    steps: ["Click “Add PDF files” and select two or more PDFs.", "Drag the arrows to reorder them as needed.", "Click “Merge PDFs” to download your combined file."],
    faqs: [
      { q: "Is this PDF merger free?", a: "Yes. Merging is completely free with no sign-up, watermarks, or file limits." },
      { q: "Are my files uploaded anywhere?", a: "No. The merge happens entirely in your browser using JavaScript — your PDFs never leave your device." },
      { q: "Can I change the order of the files?", a: "Yes. Use the up/down arrows next to each file to set the exact order before merging." },
    ],
  },
  {
    slug: "split-pdf", name: "Split PDF", category: "pdf", status: "live",
    description: "Extract pages or page ranges from a PDF into a new file — free, private and entirely in your browser. No uploads, no sign-up.",
    keywords: ["split pdf", "extract pdf pages", "pdf splitter", "separate pdf pages"],
    intro: "Split PDF extracts the exact pages you need — single pages or ranges like 1-3, 5 — into a brand-new PDF. It runs fully in your browser, so nothing is uploaded.",
    steps: ["Choose a PDF file.", "Enter the pages or ranges you want, e.g. 1-3, 5, 8.", "Click “Extract pages” to download the new PDF."],
    faqs: [
      { q: "How do I select pages to extract?", a: "Type page numbers and ranges separated by commas, like “1-3, 5, 9-10”. The new PDF keeps them in that order." },
      { q: "Is splitting free and private?", a: "Yes — there are no limits and your file is processed locally in your browser, never uploaded." },
      { q: "Can it split a large PDF?", a: "Yes, limited only by your device's available memory." },
    ],
  },
  {
    slug: "rotate-pdf", name: "Rotate PDF", category: "pdf", status: "live",
    description: "Rotate the pages of a PDF by 90°, 180° or 270° and download the fixed file. Free, private, runs entirely in your browser.",
    keywords: ["rotate pdf", "turn pdf pages", "fix pdf orientation", "rotate pdf pages"],
    intro: "Rotate PDF turns every page of your document by 90, 180 or 270 degrees so sideways or upside-down scans read correctly. Processing is local — your file is never uploaded.",
    steps: ["Choose a PDF file.", "Pick a rotation: 90°, 180° or 270°.", "Click “Rotate & download”."],
    faqs: [
      { q: "Does this permanently rotate the pages?", a: "Yes. The downloaded PDF has the new orientation baked in, so it opens correctly everywhere." },
      { q: "Can I rotate just one page?", a: "This tool rotates all pages by the chosen angle. For single-page control, use Split PDF first to isolate the page." },
      { q: "Is it free?", a: "Completely free, no watermark, no sign-up." },
    ],
  },
  {
    slug: "jpg-to-pdf", name: "JPG to PDF", category: "pdf", status: "live",
    description: "Convert JPG, PNG and WebP images into a single PDF document — free and private, with no uploads. Reorder images before converting.",
    keywords: ["jpg to pdf", "image to pdf", "png to pdf", "convert jpg to pdf", "photos to pdf"],
    intro: "JPG to PDF turns one or more images (JPG, PNG or WebP) into a single, shareable PDF. Each image becomes its own page. Everything is processed in your browser.",
    steps: ["Add one or more image files.", "Reorder them if needed.", "Click “Create PDF” to download."],
    faqs: [
      { q: "Which image formats are supported?", a: "JPG/JPEG and PNG are embedded directly; other formats are auto-converted in the browser." },
      { q: "Will image quality drop?", a: "No — images are embedded at their original resolution." },
      { q: "Are my images uploaded?", a: "No. The PDF is built locally in your browser and never sent to a server." },
    ],
  },

  {
    slug: "compress-pdf", name: "Compress PDF", category: "pdf", status: "live",
    description: "Reduce PDF file size for free, right in your browser. Adjustable quality, no uploads — your file never leaves your device.",
    keywords: ["compress pdf", "reduce pdf size", "shrink pdf", "make pdf smaller", "pdf compressor"],
    intro: "Compress PDF shrinks a PDF's file size by re-rendering its pages at an adjustable quality — ideal for email attachments and uploads. Select several PDFs to compress them all in one pass and download them together as a .zip. Everything runs in your browser, so your files are never uploaded.",
    steps: ["Choose one or more PDF files.", "Adjust the quality and resolution sliders.", "Click Compress, then download the smaller PDF — or “Download all” as a .zip for a batch."],
    faqs: [
      { q: "How does the compression work?", a: "Each page is re-rendered to a compressed image and rebuilt into a new PDF. This works especially well for scanned or image-heavy PDFs." },
      { q: "Can I compress several PDFs at once?", a: "Yes. Select multiple PDFs and they're compressed one at a time (to keep memory low), then offered as individual downloads or a single .zip." },
      { q: "Will the text still be selectable?", a: "No — because pages are rasterised, text becomes part of the image. Use PDF to Text first if you need the text." },
      { q: "Is my PDF uploaded?", a: "No, compression happens entirely in your browser." },
    ],
  },

  // ── IMAGE ────────────────────────────────────────────────────────────
  {
    slug: "resize-image", name: "Resize Image", category: "image", status: "live",
    description: "Resize any image (JPG, PNG, WebP) to exact pixel dimensions for free. Runs entirely in your browser — no upload, no quality loss in resampling.",
    keywords: ["resize image", "image resizer", "resize photo", "resize jpg", "resize png online"],
    intro: "Resize Image scales any photo to the exact width and height you need — perfect for social posts, avatars and thumbnails. Drop in several images to resize them all to fit a shared box (keeping each one's aspect ratio) and download them as a .zip. It runs locally in your browser, so your images are never uploaded.",
    steps: ["Choose one or more images.", "Enter new dimensions (or a max width/height for a batch).", "Download the resized image, or “Download all” as a .zip."],
    faqs: [
      { q: "Will resizing reduce quality?", a: "Downscaling stays crisp. Upscaling beyond the original size can look soft, as with any resizer." },
      { q: "Can I resize many images at once?", a: "Yes. Select multiple images and set a maximum width and height; each one scales to fit that box while keeping its aspect ratio, then downloads individually or as a .zip." },
      { q: "Is my photo uploaded?", a: "No. Resizing uses your browser's Canvas — the image never leaves your device." },
      { q: "What formats can I resize?", a: "Any image your browser can open: JPG, PNG, WebP, GIF and more. Output is PNG." },
    ],
  },
  {
    slug: "compress-image", name: "Compress Image", category: "image", status: "live",
    description: "Compress JPG and PNG images to reduce file size with a quality slider — free, private, in-browser. Compress one or many images at once and see the saving instantly.",
    keywords: ["compress image", "compress jpg", "reduce image size", "image compressor", "shrink photo size", "bulk compress images", "compress multiple images"],
    intro: "Compress Image shrinks the file size of your photos using adjustable JPEG quality, ideal for faster websites and email attachments. Select several images to compress them all at once and download them together as a .zip. Compression happens locally — nothing is uploaded.",
    steps: ["Choose one or more images.", "Drag the quality slider to balance size vs. clarity.", "Download a single image, or “Download all” as a .zip for a batch."],
    faqs: [
      { q: "How much smaller will my image get?", a: "Typically 40–80% smaller, depending on the quality setting and the original photo." },
      { q: "Can I compress many images at once?", a: "Yes. Select multiple images and they're compressed in a batch, each with its own saving; grab them individually or all together as a .zip." },
      { q: "Does compressing change dimensions?", a: "No — only the file size changes. Use Resize Image to change dimensions." },
      { q: "Is it private?", a: "Yes. Compression runs in your browser; your images are never uploaded, no matter how many you process." },
    ],
  },
  {
    slug: "crop-image", name: "Crop Image", category: "image", status: "live",
    description: "Crop any image to a custom region by dragging a selection box — free and private, runs in your browser. Download the cropped result instantly.",
    keywords: ["crop image", "image cropper", "crop photo", "crop jpg", "crop picture online"],
    intro: "Crop Image lets you draw a selection box over your photo and keep only that area. Great for removing unwanted edges or framing a subject. It all runs in your browser.",
    steps: ["Choose an image.", "Drag on the preview to draw a crop region.", "Click “Crop & download”."],
    faqs: [
      { q: "Can I crop to an exact size?", a: "Drag the selection box to frame your crop; the pixel dimensions are shown live as you drag." },
      { q: "Is the image uploaded?", a: "No. Cropping is done locally with your browser's Canvas." },
      { q: "What format is the output?", a: "The cropped image downloads as a PNG." },
    ],
  },
  {
    slug: "jpg-to-png", name: "Image Converter (JPG / PNG / WebP)", category: "image", status: "live",
    description: "Convert images between JPG, PNG and WebP for free, instantly, in your browser. No uploads — pick a format and download.",
    keywords: ["jpg to png", "png to jpg", "webp to jpg", "image converter", "convert image format"],
    intro: "This image converter changes a photo's format between JPG, PNG and WebP. Choose your target format and download — or select several images to convert them all at once and download them as a .zip. Conversion runs entirely in your browser.",
    steps: ["Choose one or more images.", "Select an output format (PNG, JPG or WebP).", "Download the converted image, or “Download all” as a .zip for a batch."],
    faqs: [
      { q: "Which conversions are supported?", a: "Any direction between JPG, PNG and WebP — for example WebP to JPG, JPG to PNG, or PNG to WebP." },
      { q: "Can I convert many images at once?", a: "Yes. Select multiple images, pick one output format, and they're all converted and offered as individual downloads or a single .zip." },
      { q: "Will I lose transparency?", a: "PNG and WebP keep transparency. Converting to JPG fills transparent areas with white, since JPG has no alpha channel." },
      { q: "Are files uploaded?", a: "No. Everything is converted locally in your browser." },
    ],
  },

  // ── TEXT ─────────────────────────────────────────────────────────────
  {
    slug: "word-counter", name: "Word Counter", category: "text", status: "live",
    description: "Free word counter and character counter. Count words, characters, sentences, paragraphs and reading time as you type. Private and instant.",
    answer: "A word counter tallies the words, characters (with and without spaces), sentences and paragraphs in your text, plus an estimated reading time based on an average adult reading speed of about 230 words per minute. It updates live as you type or paste, which helps you hit essay targets and platform limits. Everything runs in your browser — no text is uploaded.",
    keywords: ["word counter", "character counter", "word count", "count words", "letter counter"],
    intro: "Word Counter tallies your words, characters, sentences, paragraphs and estimated reading time in real time as you type or paste text. Nothing is sent anywhere — it all runs in your browser.",
    steps: ["Type or paste your text into the box.", "Watch the live counts update instantly.", "Use the stats for essays, posts and SEO limits."],
    faqs: [
      { q: "Does it count characters with and without spaces?", a: "Yes, both totals are shown so you can match strict character limits." },
      { q: "How is reading time calculated?", a: "Based on an average reading speed of about 200 words per minute." },
      { q: "Is my text stored?", a: "No. Counting happens entirely in your browser; your text is never uploaded." },
    ],
  },
  {
    slug: "case-converter", name: "Case Converter", category: "text", status: "live",
    description: "Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case and kebab-case instantly. Free and private.",
    keywords: ["case converter", "uppercase", "lowercase", "title case", "text case converter"],
    intro: "Case Converter transforms your text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case and kebab-case with one click, then lets you copy the result.",
    steps: ["Paste your text.", "Click the case you want.", "Copy the converted text."],
    faqs: [
      { q: "What case styles are supported?", a: "UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case and kebab-case." },
      { q: "Can I undo a conversion?", a: "Each button works on the current text, so just pick another case or re-paste the original." },
      { q: "Is it free and private?", a: "Yes — free with no limits, and all conversion happens locally in your browser." },
    ],
  },

  // ── DEVELOPER ────────────────────────────────────────────────────────
  {
    slug: "uuid-generator", name: "UUID Generator", category: "developer", status: "live",
    description: "Generate random v4 UUIDs (GUIDs) in bulk and copy them with one click. Free, instant and fully in-browser using the secure crypto API.",
    keywords: ["uuid generator", "guid generator", "generate uuid", "random uuid", "uuid v4"],
    intro: "UUID Generator creates cryptographically-random version 4 UUIDs (also called GUIDs). Generate one or many at once and copy them instantly. It uses your browser's secure crypto API.",
    steps: ["Choose how many UUIDs to generate.", "Click “Generate”.", "Copy a single UUID or all of them at once."],
    faqs: [
      { q: "What kind of UUIDs are these?", a: "Random version 4 UUIDs, generated with the Web Crypto API for strong randomness." },
      { q: "Can I generate many at once?", a: "Yes — pick a count and generate them all in one go, then copy with one click." },
      { q: "Are they unique?", a: "v4 UUIDs have an astronomically low collision probability, so they are treated as unique in practice." },
    ],
  },
  {
    slug: "base64", name: "Base64 Encode / Decode", category: "developer", status: "live",
    description: "Encode text to Base64 or decode Base64 back to text instantly. Free, private, in-browser — supports full Unicode (UTF-8).",
    answer: "Base64 (specified in RFC 4648) encodes binary or text data using 64 printable ASCII characters, so it can travel safely through systems that only handle text — such as email or data URIs. Encoding increases size by roughly 33%, since every 3 bytes become 4 characters. This tool encodes and decodes with full Unicode (UTF-8) support, entirely in your browser.",
    keywords: ["base64", "base64 decode", "base64 encode", "base64 converter", "encode decode base64"],
    intro: "This Base64 tool encodes plain text to Base64 and decodes Base64 back to text, with full Unicode (UTF-8) support. Everything runs in your browser.",
    steps: ["Paste your text or Base64 string.", "Choose Encode or Decode.", "Copy the result."],
    faqs: [
      { q: "Does it support emoji and non-English text?", a: "Yes. The tool encodes via UTF-8, so emoji and all Unicode characters work correctly." },
      { q: "What happens with invalid Base64?", a: "When decoding, malformed input shows a clear error instead of producing garbage." },
      { q: "Is my data sent anywhere?", a: "No. Encoding and decoding happen entirely in your browser." },
    ],
  },
  {
    slug: "json-formatter", name: "JSON Formatter & Validator", category: "developer", status: "live",
    description: "Format, beautify, minify and validate JSON instantly. Free, private, in-browser JSON formatter with clear error messages.",
    keywords: ["json formatter", "json beautifier", "json validator", "format json", "json minify"],
    intro: "JSON Formatter beautifies messy JSON with proper indentation, minifies it to a single line, and validates it with clear error messages — all in your browser.",
    steps: ["Paste your JSON.", "Click “Format” to beautify or “Minify” to compact.", "Copy the result; errors are shown if the JSON is invalid."],
    faqs: [
      { q: "Does it validate my JSON?", a: "Yes. Invalid JSON produces a clear error message pointing to the problem." },
      { q: "Can it minify JSON too?", a: "Yes — one click compacts your JSON to a single line with no whitespace." },
      { q: "Is my JSON uploaded?", a: "No. Parsing and formatting are done locally in your browser." },
    ],
  },

  // ── CALCULATOR ───────────────────────────────────────────────────────
  {
    slug: "age-calculator", name: "Age Calculator", category: "calculator", status: "live",
    description: "Calculate exact age in years, months and days from any date of birth — plus total months, weeks and days. Free and instant.",
    keywords: ["age calculator", "date of birth calculator", "how old am i", "calculate age", "age in days"],
    intro: "Age Calculator works out your exact age in years, months and days from a date of birth, and also shows totals in months, weeks and days. Pick a date and get the answer instantly.",
    steps: ["Enter a date of birth.", "Optionally change the “age at” date (defaults to today).", "Read your exact age and totals."],
    faqs: [
      { q: "How is the age calculated?", a: "It counts complete years, then remaining months, then remaining days up to the target date — the standard calendar method." },
      { q: "Can I calculate age on a future or past date?", a: "Yes. Change the second date to compute age as of any day." },
      { q: "Is my date of birth stored?", a: "No. The calculation runs entirely in your browser." },
    ],
  },
  {
    slug: "percentage-calculator", name: "Percentage Calculator", category: "calculator", status: "live",
    description: "Calculate percentages three ways: X% of a number, what % one number is of another, and percentage increase or decrease. Free and instant.",
    keywords: ["percentage calculator", "percent calculator", "percentage increase", "what percent", "percent of a number"],
    intro: "Percentage Calculator handles the three everyday percentage questions: what is X% of a number, what percent one number is of another, and the percentage change between two numbers.",
    steps: ["Pick the calculation you need.", "Enter your two numbers.", "Read the result instantly."],
    faqs: [
      { q: "What calculations does it cover?", a: "“X% of Y”, “X is what percent of Y”, and percentage increase/decrease between two values." },
      { q: "Does it handle decreases?", a: "Yes. The percentage-change mode shows a negative result for a decrease." },
      { q: "Is it free?", a: "Yes, completely free with instant results and no sign-up." },
    ],
  },
  {
    slug: "bmi-calculator", name: "BMI Calculator", category: "calculator", status: "live",
    description: "Calculate your Body Mass Index (BMI) in metric or imperial units and see your weight category instantly. Free and private.",
    keywords: ["bmi calculator", "body mass index", "calculate bmi", "bmi metric", "bmi imperial"],
    intro: "BMI Calculator works out your Body Mass Index from your height and weight, in metric or imperial units, and tells you which standard weight category you fall into.",
    steps: ["Choose metric or imperial units.", "Enter your height and weight.", "Read your BMI and category instantly."],
    faqs: [
      { q: "How is BMI calculated?", a: "BMI = weight (kg) ÷ height (m)². For imperial, it uses 703 × lb ÷ in²." },
      { q: "What do the categories mean?", a: "Under 18.5 is underweight, 18.5–24.9 is normal, 25–29.9 is overweight, and 30+ is obese." },
      { q: "Is BMI accurate for everyone?", a: "BMI is a general guide and doesn't account for muscle mass or body composition, so treat it as a rough indicator." },
    ],
  },
  {
    slug: "loan-emi-calculator", name: "Loan / EMI Calculator", category: "calculator", status: "live",
    description: "Calculate your monthly loan EMI, total interest and total payment from the loan amount, interest rate and tenure. Free and instant.",
    keywords: ["emi calculator", "loan calculator", "monthly payment calculator", "interest calculator", "loan emi"],
    intro: "Loan / EMI Calculator shows your fixed monthly instalment (EMI) for any loan, plus the total interest you'll pay and the total amount repaid, from the principal, annual interest rate and tenure.",
    steps: ["Enter the loan amount (principal).", "Enter the annual interest rate and tenure.", "Read your monthly EMI, total interest and total payment."],
    faqs: [
      { q: "How is EMI calculated?", a: "It uses the standard formula EMI = P·r·(1+r)ⁿ ÷ ((1+r)ⁿ−1), where r is the monthly rate and n the number of months." },
      { q: "Does it include taxes or fees?", a: "No — it calculates the core principal-and-interest EMI. Processing fees and insurance are not included." },
      { q: "Is it free?", a: "Yes, free and instant with no sign-up." },
    ],
  },
  {
    slug: "date-difference-calculator", name: "Date Difference Calculator", category: "calculator", status: "live",
    description: "Calculate the exact difference between two dates in years, months, days and total days, weeks and hours. Free and instant.",
    keywords: ["date difference calculator", "days between dates", "date duration", "time between dates", "how many days"],
    intro: "Date Difference Calculator finds the precise gap between two dates — broken into years, months and days, plus handy totals in days, weeks and hours.",
    steps: ["Pick a start date.", "Pick an end date.", "Read the duration and totals."],
    faqs: [
      { q: "Does it count both endpoints?", a: "It measures the span from the start date up to the end date, the standard duration between them." },
      { q: "Can the dates be in the past or future?", a: "Yes — any two valid dates work, in any order." },
      { q: "Is my data stored?", a: "No, the calculation runs entirely in your browser." },
    ],
  },
  {
    slug: "tip-calculator", name: "Tip Calculator", category: "calculator", status: "live",
    description: "Calculate the tip and total bill, and split it between any number of people. Free, instant tip calculator with custom percentages.",
    keywords: ["tip calculator", "gratuity calculator", "split bill", "how much to tip", "bill splitter"],
    intro: "Tip Calculator works out the tip amount and final total for any bill, at any tip percentage, and splits the total evenly between your group.",
    steps: ["Enter the bill amount.", "Choose a tip percentage.", "Set the number of people to see the per-person total."],
    faqs: [
      { q: "Can I split the bill?", a: "Yes — enter how many people are sharing and it shows the amount each person pays." },
      { q: "Can I use a custom tip percentage?", a: "Yes, type any percentage you like in addition to the quick presets." },
      { q: "Is it free?", a: "Completely free with no sign-up." },
    ],
  },
  {
    slug: "discount-calculator", name: "Discount Calculator", category: "calculator", status: "live",
    description: "Calculate the sale price and how much you save from an original price and a discount percentage. Free and instant.",
    keywords: ["discount calculator", "sale price calculator", "percent off", "how much do i save", "price after discount"],
    intro: "Discount Calculator instantly shows the final sale price and the amount you save when a given percentage is taken off an original price.",
    steps: ["Enter the original price.", "Enter the discount percentage.", "Read the final price and your savings."],
    faqs: [
      { q: "What does it show?", a: "The discounted (final) price and the total amount saved." },
      { q: "Can I stack discounts?", a: "Apply one discount, then use the result as the new original price to apply another." },
      { q: "Is it private?", a: "Yes, the calculation runs locally in your browser." },
    ],
  },
  {
    slug: "qr-code-generator", name: "QR Code Generator", category: "developer", status: "live",
    description: "Generate a QR code from any text, link, email or phone number and download it as a PNG. Free, instant and fully in-browser.",
    answer: "A QR code generator converts a link, text, email, phone number or Wi-Fi credentials into a scannable 2D barcode. These are static QR codes — the data is encoded directly in the image (up to 4,296 alphanumeric characters per the ISO/IEC 18004 standard), so they never expire and need no server. Generate and download a high-resolution PNG free, entirely in your browser.",
    keywords: ["qr code generator", "create qr code", "qr code maker", "free qr code", "url to qr code"],
    intro: "QR Code Generator turns any text or link into a scannable QR code you can download as a high-resolution PNG. Everything is generated in your browser.",
    steps: ["Type or paste a URL or any text.", "Adjust the size if needed.", "Click “Download PNG” to save your QR code."],
    faqs: [
      { q: "What can I encode in a QR code?", a: "Any text — a website URL, plain text, an email address, a phone number, Wi-Fi details and more." },
      { q: "Do these QR codes expire?", a: "No. These are static QR codes encoded directly in the image, so they never expire or rely on a server." },
      { q: "Is it free?", a: "Yes — free, watermark-free, and generated entirely in your browser." },
    ],
  },
  {
    slug: "password-generator", name: "Password Generator", category: "developer", status: "live",
    description: "Generate strong, random passwords with custom length and character sets, using the secure Web Crypto API. Free and fully private.",
    answer: "A password generator creates strong, random passwords you can't easily guess or reuse. This one draws randomness from the browser's cryptographically secure Web Crypto API (crypto.getRandomValues), not Math.random, and lets you set length and character sets. A 16-character password mixing upper, lower, digits and symbols has roughly 105 bits of entropy — far beyond brute-force reach. Nothing is stored or uploaded.",
    keywords: ["password generator", "random password", "strong password generator", "secure password", "create password"],
    intro: "Password Generator creates strong, random passwords using your browser's secure Web Crypto API. Pick the length and which character types to include, then copy with one click.",
    steps: ["Choose a length and character types.", "Click “Generate”.", "Copy your new password."],
    faqs: [
      { q: "Are these passwords secure?", a: "Yes — they're generated with the cryptographically-secure Web Crypto API, not predictable random functions." },
      { q: "Is my password sent anywhere?", a: "Never. Generation happens entirely in your browser; nothing is transmitted or stored." },
      { q: "What makes a strong password?", a: "Length matters most — aim for 16+ characters mixing uppercase, lowercase, numbers and symbols." },
    ],
  },
  {
    slug: "number-base-converter", name: "Number Base Converter", category: "developer", status: "live",
    description: "Convert numbers between binary, octal, decimal and hexadecimal instantly. Free in-browser hex-to-decimal and base converter.",
    keywords: ["number base converter", "hex to decimal", "binary to decimal", "decimal to hex", "base converter"],
    intro: "Number Base Converter translates a value between binary, octal, decimal and hexadecimal at once — type in any base and see all four instantly.",
    steps: ["Enter a value.", "Select which base you typed it in.", "Read the value in binary, octal, decimal and hex."],
    faqs: [
      { q: "Which bases are supported?", a: "Binary (base 2), octal (base 8), decimal (base 10) and hexadecimal (base 16)." },
      { q: "Can it convert hex to decimal?", a: "Yes — enter a hex value and the decimal equivalent (and binary/octal) appear instantly." },
      { q: "Is it free and private?", a: "Yes, the conversion runs locally in your browser." },
    ],
  },
  {
    slug: "color-converter", name: "Color Converter (HEX / RGB / HSL)", category: "developer", status: "live",
    description: "Convert colors between HEX, RGB and HSL, with a live colour picker and preview. Free, instant in-browser color converter.",
    keywords: ["color converter", "hex to rgb", "rgb to hex", "hsl converter", "color picker"],
    intro: "Color Converter turns a colour between HEX, RGB and HSL formats, with a live picker and preview swatch so you can copy whichever value you need.",
    steps: ["Pick a colour or type a HEX value.", "Read the equivalent RGB and HSL values.", "Copy the format you need."],
    faqs: [
      { q: "Which formats does it convert?", a: "HEX, RGB and HSL, kept in sync as you change any of them." },
      { q: "Can I use the colour picker?", a: "Yes — use the swatch picker, or type a HEX code directly." },
      { q: "Is it free?", a: "Yes, free and fully in-browser." },
    ],
  },
  {
    slug: "unix-timestamp-converter", name: "Unix Timestamp Converter", category: "developer", status: "live",
    description: "Convert Unix epoch timestamps to human-readable dates and back, in local time and UTC. Free, instant, in-browser.",
    keywords: ["unix timestamp converter", "epoch converter", "timestamp to date", "date to timestamp", "epoch time"],
    intro: "Unix Timestamp Converter turns epoch timestamps into readable dates (local and UTC) and converts a date back into a Unix timestamp.",
    steps: ["Enter a Unix timestamp, or pick a date.", "Read the converted value.", "Copy whichever you need."],
    faqs: [
      { q: "Does it support seconds and milliseconds?", a: "Yes — it auto-detects 10-digit (seconds) and 13-digit (milliseconds) timestamps." },
      { q: "Does it show UTC?", a: "Yes, both your local time and UTC are shown." },
      { q: "Is it private?", a: "Yes, conversion happens entirely in your browser." },
    ],
  },
  {
    slug: "lorem-ipsum-generator", name: "Lorem Ipsum Generator", category: "text", status: "live",
    description: "Generate Lorem Ipsum placeholder text by paragraphs, sentences or words, and copy it instantly. Free dummy text generator.",
    keywords: ["lorem ipsum generator", "placeholder text", "dummy text generator", "lorem ipsum", "filler text"],
    intro: "Lorem Ipsum Generator produces classic placeholder text in the amount you need — by paragraphs, sentences or words — ready to copy into your design or mockup.",
    steps: ["Choose paragraphs, sentences or words.", "Set how many you want.", "Generate and copy the text."],
    faqs: [
      { q: "What is Lorem Ipsum?", a: "It's standard placeholder text used in design and publishing to show layout without meaningful content distracting the viewer." },
      { q: "Can I control the amount?", a: "Yes — generate a set number of paragraphs, sentences or words." },
      { q: "Is it free?", a: "Yes, free with one-click copy." },
    ],
  },
  {
    slug: "text-to-speech", name: "Text to Speech", category: "text", status: "live",
    description: "Convert text to spoken audio in your browser with selectable voices, speed and pitch. Free text-to-speech, no upload required.",
    keywords: ["text to speech", "tts", "read text aloud", "text to voice", "speech synthesis"],
    intro: "Text to Speech reads your text aloud using your browser's built-in voices, with adjustable speed and pitch. It works offline and nothing is uploaded.",
    steps: ["Type or paste your text.", "Pick a voice, speed and pitch.", "Press Play to hear it read aloud."],
    faqs: [
      { q: "Which voices are available?", a: "The voices installed in your browser and operating system, which vary by device and language." },
      { q: "Does it work offline?", a: "Yes — it uses the browser's built-in Speech Synthesis, so no upload or connection is needed once the page loads." },
      { q: "Can I change the speed?", a: "Yes, both reading speed and pitch are adjustable." },
    ],
  },

  // ── Batch 3 ──────────────────────────────────────────────────────────
  {
    slug: "slug-generator", name: "Slug Generator", category: "text", status: "live",
    description: "Convert any title or text into a clean, URL-friendly slug. Lowercase, hyphenated and stripped of special characters. Free and instant.",
    keywords: ["slug generator", "url slug", "permalink generator", "seo slug", "text to slug"],
    intro: "Slug Generator turns a title or phrase into a clean, SEO-friendly URL slug — lowercase, spaces replaced with hyphens, and accents and symbols removed.",
    steps: ["Type or paste your title.", "The URL slug updates instantly.", "Copy it for your page or blog post."],
    faqs: [
      { q: "What is a URL slug?", a: "The readable part of a URL that identifies a page, e.g. “my-blog-post”. Clean slugs help SEO and shareability." },
      { q: "Does it handle accents and symbols?", a: "Yes — accented letters are simplified and special characters removed for a safe, web-friendly slug." },
      { q: "Is it free?", a: "Yes, free with one-click copy." },
    ],
  },
  {
    slug: "remove-line-breaks", name: "Remove Line Breaks", category: "text", status: "live",
    description: "Remove line breaks and extra spaces from text, or join paragraphs into one line. Free, instant text cleaner — runs in your browser.",
    keywords: ["remove line breaks", "remove line breaks online", "text cleaner", "join lines", "strip newlines"],
    intro: "Remove Line Breaks strips unwanted newlines and collapses extra spaces from pasted text — perfect for cleaning up copied PDFs, emails and code output.",
    steps: ["Paste your text.", "Choose to remove all breaks or just collapse extra ones.", "Copy the cleaned text."],
    faqs: [
      { q: "Can it keep paragraph breaks?", a: "Yes — one mode removes only single line breaks while preserving blank lines between paragraphs." },
      { q: "Does it remove double spaces too?", a: "Yes, it can collapse repeated spaces into single spaces." },
      { q: "Is my text uploaded?", a: "No, cleaning happens entirely in your browser." },
    ],
  },
  {
    slug: "find-and-replace", name: "Find and Replace Text", category: "text", status: "live",
    description: "Find and replace text online with optional case-sensitivity and regex. Free, instant, in-browser — replace all occurrences at once.",
    keywords: ["find and replace", "replace text online", "find replace text", "bulk replace", "regex replace"],
    intro: "Find and Replace swaps every occurrence of a word or pattern in your text, with optional case-sensitivity and regular-expression support.",
    steps: ["Paste your text.", "Enter what to find and what to replace it with.", "Copy the updated text."],
    faqs: [
      { q: "Does it support regular expressions?", a: "Yes — toggle regex mode to use patterns; otherwise it does a plain text replace." },
      { q: "Can I make it case-sensitive?", a: "Yes, case-sensitivity is an option you can switch on or off." },
      { q: "Is it private?", a: "Yes, all processing happens in your browser." },
    ],
  },
  {
    slug: "reverse-text", name: "Reverse Text", category: "text", status: "live",
    description: "Reverse text by characters, words or lines, and flip text upside down. Free, instant, in-browser text reverser.",
    keywords: ["reverse text", "backwards text", "flip text", "reverse string", "mirror text"],
    intro: "Reverse Text flips your text by characters, words or whole lines — handy for fun, puzzles, or quickly reversing a string.",
    steps: ["Paste your text.", "Choose reverse by characters, words or lines.", "Copy the result."],
    faqs: [
      { q: "What can it reverse?", a: "The whole string by characters, the word order, or the order of lines." },
      { q: "Does it support emoji?", a: "Yes — reversal is Unicode-aware so multi-byte characters and emoji stay intact." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "hash-generator", name: "Hash Generator (SHA-256)", category: "developer", status: "live",
    description: "Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes of any text using the secure Web Crypto API. Free, instant, in-browser.",
    keywords: ["hash generator", "sha256 generator", "sha256 hash", "sha512", "online hash"],
    intro: "Hash Generator computes SHA-1, SHA-256, SHA-384 and SHA-512 digests of your text using the browser's secure SubtleCrypto API — useful for checksums and integrity checks.",
    steps: ["Paste your text.", "Pick a hash algorithm.", "Copy the resulting hex digest."],
    faqs: [
      { q: "Which algorithms are supported?", a: "SHA-1, SHA-256, SHA-384 and SHA-512, via the standard Web Crypto API." },
      { q: "Is MD5 available?", a: "No — browsers' SubtleCrypto doesn't include MD5 as it's considered insecure. SHA-256 is the recommended default." },
      { q: "Is my input sent anywhere?", a: "No. Hashing happens entirely in your browser." },
    ],
  },
  {
    slug: "jwt-decoder", name: "JWT Decoder", category: "developer", status: "live",
    description: "Decode a JSON Web Token (JWT) to read its header and payload instantly. Free, private, in-browser — no token is uploaded.",
    answer: "A JWT (JSON Web Token, defined in RFC 7519) is a compact, URL-safe token made of three Base64url-encoded parts separated by dots: header, payload and signature. This decoder splits the token and shows the readable header and payload JSON — including standard claims like exp, iat and iss — entirely in your browser. It does not verify the signature, which requires the signing key.",
    keywords: ["jwt decoder", "decode jwt", "json web token decoder", "jwt parser", "read jwt"],
    intro: "JWT Decoder splits a JSON Web Token into its header and payload and decodes them to readable JSON, so you can inspect claims like expiry and issuer.",
    steps: ["Paste your JWT.", "Read the decoded header and payload.", "Inspect the claims."],
    faqs: [
      { q: "Does it verify the signature?", a: "No — decoding only reads the header and payload. Signature verification needs the secret/key and is intentionally not done here." },
      { q: "Is my token uploaded?", a: "Never. Decoding is purely local in your browser, so it's safe for sensitive tokens." },
      { q: "What does it show?", a: "The decoded header and payload JSON, including standard claims like exp, iat and iss." },
    ],
  },
  {
    slug: "url-encoder", name: "URL Encode / Decode", category: "developer", status: "live",
    description: "Encode text for safe use in URLs or decode percent-encoded URLs back to text. Free, instant, in-browser URL encoder/decoder.",
    keywords: ["url encode", "url decode", "percent encoding", "uri encoder", "encode url online"],
    intro: "URL Encoder converts text to percent-encoded form that's safe to use in URLs and query strings, and decodes encoded URLs back to readable text.",
    steps: ["Paste your text or encoded URL.", "Choose Encode or Decode.", "Copy the result."],
    faqs: [
      { q: "What does URL encoding do?", a: "It replaces characters that aren't URL-safe (spaces, &, ?, etc.) with percent-encoded equivalents like %20." },
      { q: "Does it support full encoding?", a: "Yes — it uses encodeURIComponent, which encodes reserved characters for use inside query parameters." },
      { q: "Is it private?", a: "Yes, encoding and decoding run in your browser." },
    ],
  },
  {
    slug: "html-encoder", name: "HTML Encode / Decode", category: "developer", status: "live",
    description: "Encode HTML special characters to entities or decode entities back to text. Free, instant, in-browser HTML entity encoder/decoder.",
    keywords: ["html encode", "html decode", "html entities", "escape html", "html entity converter"],
    intro: "HTML Encoder converts characters like <, > and & into safe HTML entities (and back), so you can display code or untrusted text without breaking your markup.",
    steps: ["Paste your text or HTML.", "Choose Encode or Decode.", "Copy the result."],
    faqs: [
      { q: "Why encode HTML?", a: "Encoding special characters prevents them from being interpreted as markup, avoiding broken layouts and XSS when displaying user content." },
      { q: "Which characters are encoded?", a: "The HTML-significant ones: <, >, &, \" and '." },
      { q: "Is it free?", a: "Yes, free and fully in-browser." },
    ],
  },
  {
    slug: "image-to-base64", name: "Image to Base64", category: "image", status: "live",
    description: "Convert an image to a Base64 data URI for embedding in HTML or CSS. Free, instant, in-browser — your image is never uploaded.",
    keywords: ["image to base64", "base64 image", "image data uri", "convert image to base64", "png to base64"],
    intro: "Image to Base64 encodes any image into a data URI string you can paste directly into HTML or CSS, avoiding a separate image request. It all runs in your browser.",
    steps: ["Choose an image.", "Copy the generated Base64 data URI.", "Paste it into your HTML or CSS."],
    faqs: [
      { q: "When should I use a Base64 image?", a: "For tiny images and icons, embedding as Base64 saves an HTTP request. For large images it's usually better to keep them as files." },
      { q: "Does it include the data URI prefix?", a: "Yes — the output is a ready-to-use data: URI including the MIME type." },
      { q: "Is my image uploaded?", a: "No. Encoding happens locally in your browser." },
    ],
  },
  {
    slug: "flip-image", name: "Flip & Rotate Image", category: "image", status: "live",
    description: "Flip an image horizontally or vertically and rotate it 90°, free and in-browser. Download the result instantly — no upload.",
    keywords: ["flip image", "mirror image", "rotate image", "flip photo", "rotate picture online"],
    intro: "Flip & Rotate Image mirrors your photo horizontally or vertically and rotates it in 90° steps, then lets you download the result — all processed in your browser.",
    steps: ["Choose an image.", "Flip horizontally/vertically or rotate 90°.", "Download the edited image."],
    faqs: [
      { q: "Can I combine flips and rotation?", a: "Yes — apply any combination; the preview updates and the download reflects all changes." },
      { q: "What format is the output?", a: "The edited image downloads as a PNG." },
      { q: "Is my image uploaded?", a: "No, editing is done locally with your browser's Canvas." },
    ],
  },
  {
    slug: "gpa-calculator", name: "GPA Calculator", category: "calculator", status: "live",
    description: "Calculate your GPA from course grades and credit hours on a 4.0 scale. Free, instant, in-browser GPA calculator.",
    keywords: ["gpa calculator", "grade point average", "calculate gpa", "college gpa", "gpa 4.0 scale"],
    intro: "GPA Calculator works out your grade point average on a 4.0 scale from each course's letter grade and credit hours, including a live weighted total.",
    steps: ["Add each course with its grade and credit hours.", "The weighted GPA updates as you go.", "Read your overall GPA."],
    faqs: [
      { q: "What scale does it use?", a: "The standard US 4.0 scale (A = 4.0, B = 3.0, and so on), weighted by credit hours." },
      { q: "Can I add as many courses as I want?", a: "Yes — add a row per course and the GPA recalculates instantly." },
      { q: "Is it private?", a: "Yes, the calculation runs entirely in your browser." },
    ],
  },
  {
    slug: "compound-interest-calculator", name: "Compound Interest Calculator", category: "calculator", status: "live",
    description: "Calculate compound interest and final balance from principal, rate, time and compounding frequency. Free, instant compound interest calculator.",
    keywords: ["compound interest calculator", "compound interest", "investment calculator", "interest growth", "future value calculator"],
    intro: "Compound Interest Calculator projects how an investment grows over time given the principal, annual rate, duration and how often interest compounds.",
    steps: ["Enter the principal, annual rate and number of years.", "Choose the compounding frequency.", "Read the final balance and interest earned."],
    faqs: [
      { q: "What compounding frequencies are supported?", a: "Annually, semi-annually, quarterly, monthly and daily." },
      { q: "What's the formula?", a: "Future value = P × (1 + r/n)^(n·t), where n is the compounds per year and t the number of years." },
      { q: "Does it include contributions?", a: "This version calculates growth on a single lump sum. Treat additional deposits separately." },
    ],
  },
  {
    slug: "average-calculator", name: "Average / Mean Calculator", category: "calculator", status: "live",
    description: "Calculate the mean, median, sum, count, min and max of a list of numbers. Free, instant average calculator — paste any numbers.",
    keywords: ["average calculator", "mean calculator", "median calculator", "calculate average", "sum of numbers"],
    intro: "Average Calculator computes the mean, median, sum, count and range of any list of numbers you paste — separated by spaces, commas or new lines.",
    steps: ["Paste or type your numbers.", "They can be separated by spaces, commas or lines.", "Read the mean, median, sum and more."],
    faqs: [
      { q: "What statistics does it show?", a: "Mean (average), median, sum, count, minimum and maximum." },
      { q: "How do I separate the numbers?", a: "Any mix of spaces, commas or new lines works." },
      { q: "Is it private?", a: "Yes, the calculation runs locally in your browser." },
    ],
  },

  // ── Batch 4 ──────────────────────────────────────────────────────────
  {
    slug: "json-to-csv", name: "JSON to CSV", category: "developer", status: "live",
    description: "Convert a JSON array of objects into CSV you can open in Excel or Sheets. Free, instant, in-browser JSON to CSV converter.",
    keywords: ["json to csv", "convert json to csv", "json to excel", "json array to csv", "json csv converter"],
    intro: "JSON to CSV converts an array of JSON objects into comma-separated values, with headers taken from the object keys — ready to open in Excel or Google Sheets.",
    steps: ["Paste a JSON array of objects.", "Click Convert.", "Copy or download the CSV."],
    faqs: [
      { q: "What JSON shape does it expect?", a: "An array of flat objects, e.g. [{\"name\":\"Sam\",\"age\":30}]. Keys become the CSV header row." },
      { q: "Does it handle commas and quotes in values?", a: "Yes — values containing commas, quotes or newlines are properly quoted and escaped." },
      { q: "Is my data uploaded?", a: "No, conversion happens entirely in your browser." },
    ],
  },
  {
    slug: "csv-to-json", name: "CSV to JSON", category: "developer", status: "live",
    description: "Convert CSV data into a JSON array of objects using the header row as keys. Free, instant, in-browser CSV to JSON converter.",
    keywords: ["csv to json", "convert csv to json", "csv json converter", "csv to array", "parse csv"],
    intro: "CSV to JSON parses comma-separated data and turns each row into a JSON object keyed by the header row — handy for APIs, configs and quick data wrangling.",
    steps: ["Paste your CSV (first row = headers).", "Click Convert.", "Copy the formatted JSON."],
    faqs: [
      { q: "Does the first row become the keys?", a: "Yes — the header row defines the object keys for every following row." },
      { q: "Does it handle quoted fields?", a: "Yes, it understands quoted values that contain commas or line breaks." },
      { q: "Is it private?", a: "Yes, parsing is done locally in your browser." },
    ],
  },
  {
    slug: "text-diff", name: "Text Diff Checker", category: "developer", status: "live",
    description: "Compare two blocks of text and see added and removed lines highlighted. Free, instant, in-browser diff checker.",
    keywords: ["text diff", "diff checker", "compare text", "text compare", "difference between two texts"],
    intro: "Text Diff Checker compares two versions of text line by line and highlights what was added and removed — useful for proofreading, code and config changes.",
    steps: ["Paste the original text on the left.", "Paste the changed text on the right.", "Review the highlighted differences."],
    faqs: [
      { q: "How does it compare?", a: "It uses a line-based longest-common-subsequence diff, marking lines as added, removed or unchanged." },
      { q: "Is there a size limit?", a: "It works on large texts, limited only by your device's memory." },
      { q: "Is my text uploaded?", a: "No, the comparison runs entirely in your browser." },
    ],
  },
  {
    slug: "binary-text-converter", name: "Text to Binary Converter", category: "developer", status: "live",
    description: "Convert text to binary and binary back to text (UTF-8). Free, instant, in-browser text-to-binary converter.",
    keywords: ["text to binary", "binary to text", "binary translator", "text binary converter", "ascii to binary"],
    intro: "Text to Binary Converter turns text into 8-bit binary and decodes binary back into readable text, with full UTF-8 support.",
    steps: ["Paste text or binary.", "Choose the conversion direction.", "Copy the result."],
    faqs: [
      { q: "What encoding does it use?", a: "UTF-8, so accented characters and emoji convert correctly." },
      { q: "How is the binary formatted?", a: "As space-separated 8-bit bytes, the most common readable format." },
      { q: "Is it private?", a: "Yes, conversion happens in your browser." },
    ],
  },
  {
    slug: "roman-numeral-converter", name: "Roman Numeral Converter", category: "developer", status: "live",
    description: "Convert numbers to Roman numerals and Roman numerals back to numbers. Free, instant, in-browser converter (1–3999).",
    keywords: ["roman numeral converter", "number to roman numerals", "roman numerals to number", "roman numeral translator", "convert roman numerals"],
    intro: "Roman Numeral Converter translates between regular numbers and Roman numerals in both directions, covering the standard range 1 to 3999.",
    steps: ["Enter a number or a Roman numeral.", "The converted value appears instantly.", "Copy the result."],
    faqs: [
      { q: "What range is supported?", a: "Standard Roman numerals from 1 (I) to 3999 (MMMCMXCIX)." },
      { q: "Does it validate Roman numerals?", a: "Yes — invalid sequences are flagged rather than mis-converted." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "random-number-generator", name: "Random Number Generator", category: "developer", status: "live",
    description: "Generate random numbers in any range, with optional uniqueness, using the secure Web Crypto API. Free, instant, in-browser.",
    keywords: ["random number generator", "rng", "pick a random number", "random number between", "number picker"],
    intro: "Random Number Generator produces random whole numbers within a range you set — one or many at a time, optionally all unique — using your browser's secure crypto API.",
    steps: ["Set the minimum and maximum.", "Choose how many numbers and whether they must be unique.", "Generate and copy."],
    faqs: [
      { q: "Are the numbers truly random?", a: "They use the cryptographically-secure Web Crypto API, far better than typical pseudo-random functions." },
      { q: "Can I generate unique numbers?", a: "Yes — enable “unique” to draw without repeats (like a lottery draw)." },
      { q: "Is it private?", a: "Yes, generation runs entirely in your browser." },
    ],
  },
  {
    slug: "word-frequency-counter", name: "Word Frequency Counter", category: "text", status: "live",
    description: "Count how often each word appears in your text, ranked by frequency. Free, instant, in-browser word frequency analyser.",
    keywords: ["word frequency counter", "word frequency", "keyword density", "most common words", "word count by frequency"],
    intro: "Word Frequency Counter analyses your text and lists each word with how many times it appears, ranked from most to least frequent — useful for SEO and writing analysis.",
    steps: ["Paste your text.", "Optionally ignore common stop words.", "Review the ranked frequency table."],
    faqs: [
      { q: "Can it ignore common words?", a: "Yes — toggle stop-word filtering to hide words like “the”, “and” and “of”." },
      { q: "Is it case sensitive?", a: "No — words are counted case-insensitively so “The” and “the” are grouped together." },
      { q: "Is my text uploaded?", a: "No, analysis happens entirely in your browser." },
    ],
  },
  {
    slug: "sort-text-lines", name: "Sort Text Lines", category: "text", status: "live",
    description: "Sort lines of text alphabetically or numerically, reverse them, and remove duplicates. Free, instant, in-browser line sorter.",
    keywords: ["sort text", "sort lines", "alphabetical order", "sort list", "remove duplicate lines"],
    intro: "Sort Text Lines orders your lines alphabetically or numerically, can reverse the order, and optionally removes duplicate and blank lines.",
    steps: ["Paste your lines.", "Choose sort order and options.", "Copy the sorted result."],
    faqs: [
      { q: "Can it sort numbers correctly?", a: "Yes — numeric mode sorts by value so 2 comes before 10, unlike plain alphabetical sorting." },
      { q: "Can it remove duplicates?", a: "Yes, there's an option to remove duplicate lines while sorting." },
      { q: "Is it private?", a: "Yes, sorting happens in your browser." },
    ],
  },
  {
    slug: "markdown-preview", name: "Markdown Preview", category: "text", status: "live",
    description: "Write Markdown and see a live HTML preview, then copy the generated HTML. Free, instant, in-browser Markdown previewer.",
    keywords: ["markdown preview", "markdown to html", "markdown editor", "md preview", "markdown viewer"],
    intro: "Markdown Preview renders your Markdown to formatted HTML live as you type, and lets you copy the generated HTML. It supports headings, lists, links, bold, italic, code and quotes.",
    steps: ["Type or paste Markdown on the left.", "See the live preview on the right.", "Copy the HTML if you need it."],
    faqs: [
      { q: "Which Markdown features are supported?", a: "Headings, bold, italic, inline code, code blocks, links, blockquotes and ordered/unordered lists." },
      { q: "Is my content safe?", a: "Input is HTML-escaped before formatting, and everything stays in your browser." },
      { q: "Can I get the HTML output?", a: "Yes, copy the rendered HTML with one click." },
    ],
  },
  {
    slug: "gst-calculator", name: "GST / Sales Tax Calculator", category: "calculator", status: "live",
    description: "Add or remove GST / sales tax from a price at any rate, and see the net, tax and gross amounts. Free, instant calculator.",
    keywords: ["gst calculator", "sales tax calculator", "vat calculator", "add gst", "remove gst"],
    intro: "GST / Sales Tax Calculator adds tax to a net price or extracts the tax from a gross price at any rate, showing the net amount, tax amount and total.",
    steps: ["Enter an amount and tax rate.", "Choose to add or remove tax.", "Read the net, tax and gross figures."],
    faqs: [
      { q: "Can it remove tax from a gross price?", a: "Yes — “remove” mode back-calculates the original net price and the tax included." },
      { q: "Does it work for VAT too?", a: "Yes, it works for any percentage-based tax: GST, VAT or sales tax." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "time-duration-calculator", name: "Time Duration Calculator", category: "calculator", status: "live",
    description: "Calculate the duration between two times in hours and minutes. Free, instant, in-browser time difference calculator.",
    keywords: ["time duration calculator", "time difference", "hours between times", "time calculator", "duration between two times"],
    intro: "Time Duration Calculator works out how much time elapses between a start and end time, in hours and minutes — handy for timesheets and scheduling.",
    steps: ["Enter a start time.", "Enter an end time.", "Read the duration in hours and minutes."],
    faqs: [
      { q: "Does it handle overnight times?", a: "Yes — if the end time is earlier than the start, it assumes the next day." },
      { q: "What format are the results?", a: "Hours and minutes, plus the total in minutes." },
      { q: "Is it private?", a: "Yes, the calculation runs in your browser." },
    ],
  },
  {
    slug: "temperature-converter", name: "Temperature Converter", category: "calculator", status: "live",
    description: "Convert temperatures between Celsius, Fahrenheit and Kelvin instantly. Free, in-browser temperature converter.",
    keywords: ["temperature converter", "celsius to fahrenheit", "fahrenheit to celsius", "celsius to kelvin", "convert temperature"],
    intro: "Temperature Converter instantly translates a temperature between Celsius, Fahrenheit and Kelvin — type any one and the others update.",
    steps: ["Type a value in any unit.", "The other units update instantly.", "Read or copy the result."],
    faqs: [
      { q: "Which units does it support?", a: "Celsius (°C), Fahrenheit (°F) and Kelvin (K)." },
      { q: "Does it handle negative temperatures?", a: "Yes, including values below freezing." },
      { q: "Is it free?", a: "Yes, free and instant in your browser." },
    ],
  },

  // ── Batch 5 — heavier, library-backed tools ──────────────────────────
  {
    slug: "pdf-to-images", name: "PDF to Images (JPG / PNG)", category: "pdf", status: "live",
    description: "Convert each page of a PDF into a high-quality PNG image and download them. Free, private, in-browser — no uploads.",
    keywords: ["pdf to images", "pdf to jpg", "pdf to png", "convert pdf to image", "pdf pages to images"],
    intro: "PDF to Images renders every page of your PDF to a crisp PNG you can download individually. Rendering happens in your browser, so your file is never uploaded.",
    steps: ["Choose a PDF file.", "Pick a render quality.", "Download each page image."],
    faqs: [
      { q: "What image format do I get?", a: "Each page is rendered to a PNG. You can choose a higher scale for sharper output." },
      { q: "Are my PDF and images uploaded?", a: "No — rendering runs entirely in your browser using PDF.js." },
      { q: "Does it work for multi-page PDFs?", a: "Yes, every page is rendered and offered as a separate download." },
    ],
  },
  {
    slug: "pdf-to-text", name: "PDF to Text", category: "pdf", status: "live",
    description: "Extract all text from a PDF and copy or download it. Free, private, in-browser PDF text extractor — no uploads.",
    keywords: ["pdf to text", "extract text from pdf", "pdf text extractor", "copy text from pdf", "pdf to txt"],
    intro: "PDF to Text pulls the selectable text out of your PDF, page by page, so you can copy or save it as plain text. It runs locally in your browser.",
    steps: ["Choose a PDF file.", "Wait a moment while the text is extracted.", "Copy or download the text."],
    faqs: [
      { q: "Does it work on scanned PDFs?", a: "Only PDFs with real (selectable) text. For scanned image PDFs, use the Image to Text (OCR) tool instead." },
      { q: "Is my PDF uploaded?", a: "No — extraction runs in your browser with PDF.js; nothing is sent to a server." },
      { q: "Does it keep formatting?", a: "It extracts the raw text content; complex layout and styling are not preserved." },
    ],
  },
  {
    slug: "image-to-text", name: "Image to Text (OCR)", category: "image", status: "live",
    description: "Extract text from an image or screenshot using free in-browser OCR. Copy the recognised text instantly — your image is never uploaded.",
    keywords: ["image to text", "ocr", "extract text from image", "picture to text", "photo to text"],
    intro: "Image to Text uses optical character recognition (OCR) to read the text in a photo or screenshot, right in your browser. The recognised text can be copied or downloaded.",
    steps: ["Choose an image containing text.", "Wait while it is recognised (the OCR engine loads on first use).", "Copy the extracted text."],
    faqs: [
      { q: "Does my image get uploaded?", a: "No — OCR runs locally in your browser with Tesseract. The first run downloads the recognition engine." },
      { q: "Which languages are supported?", a: "This tool recognises English text. Clear, high-contrast images give the best results." },
      { q: "Why is the first run slower?", a: "The OCR engine and language data are downloaded once, then cached for subsequent runs." },
    ],
  },
  {
    slug: "background-remover", name: "Background Remover", category: "image", status: "live",
    description: "Remove the background from any image automatically, free and private, right in your browser. Download a transparent PNG — no uploads.",
    keywords: ["background remover", "remove background", "remove bg", "transparent background", "remove image background"],
    intro: "Background Remover uses an AI segmentation model to erase the background from your photo and give you a transparent PNG — all processed locally in your browser, with no uploads.",
    steps: ["Choose an image.", "Wait while the background is removed (the model loads on first use).", "Download your transparent PNG."],
    faqs: [
      { q: "Is my photo uploaded to a server?", a: "No — the AI model runs entirely in your browser. Your image never leaves your device." },
      { q: "Why does the first run take a while?", a: "The background-removal model (several MB) is downloaded once on first use, then cached for next time." },
      { q: "What do I get back?", a: "A PNG with a transparent background, ready to drop onto any colour or design." },
    ],
  },

  // ── Batch 6 ──────────────────────────────────────────────────────────
  // Text
  {
    slug: "fancy-text-generator", name: "Fancy Text Generator", category: "text", status: "live",
    description: "Turn plain text into fancy Unicode fonts — bold, italic, script, bubble, strikethrough and more — to copy into Instagram, TikTok and bios. Free.",
    keywords: ["fancy text generator", "stylish text", "instagram fonts", "cool text", "unicode font generator"],
    intro: "Fancy Text Generator converts your text into dozens of stylish Unicode fonts — bold, italic, cursive, bubble, monospace, strikethrough and more — that you can paste anywhere, including social bios.",
    steps: ["Type your text.", "Browse the generated styles.", "Click a style to copy it."],
    faqs: [
      { q: "How does this work without installing fonts?", a: "It maps your letters to Unicode characters that look stylised, so they display the same everywhere — no font install needed." },
      { q: "Can I use these on Instagram or TikTok?", a: "Yes — copy any style and paste it into your bio, captions or messages." },
      { q: "Is it free?", a: "Yes, free with one-click copy." },
    ],
  },
  {
    slug: "number-to-words", name: "Number to Words Converter", category: "text", status: "live",
    description: "Convert numbers into written words (e.g. 1234 → one thousand two hundred thirty-four). Free, instant, in-browser.",
    keywords: ["number to words", "number to text", "spell number", "amount in words", "numbers to words converter"],
    intro: "Number to Words spells out any number in plain English words — handy for cheques, invoices and documents.",
    steps: ["Enter a number.", "Read the words instantly.", "Copy the result."],
    faqs: [
      { q: "How large a number can it handle?", a: "It handles numbers well into the trillions, including decimals." },
      { q: "Does it do currency wording?", a: "It spells the number; you can add “dollars/cents” as needed for cheques." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "caesar-cipher", name: "Caesar Cipher / ROT13", category: "text", status: "live",
    description: "Encode and decode text with a Caesar cipher or ROT13 by shifting letters. Free, instant, in-browser cipher tool.",
    keywords: ["caesar cipher", "rot13", "letter shift cipher", "encode decode cipher", "caesar cipher decoder"],
    intro: "Caesar Cipher shifts each letter by a chosen amount to encode or decode text. Set the shift to 13 for classic ROT13.",
    steps: ["Type your text.", "Choose a shift amount (13 = ROT13).", "Copy the encoded or decoded result."],
    faqs: [
      { q: "What is ROT13?", a: "A Caesar cipher with a shift of 13 — applying it twice returns the original text." },
      { q: "Does it keep punctuation?", a: "Yes, only letters are shifted; numbers and symbols are left unchanged." },
      { q: "Is it secure encryption?", a: "No — the Caesar cipher is a simple, easily-broken cipher meant for fun and puzzles, not real security." },
    ],
  },
  {
    slug: "whitespace-remover", name: "Whitespace Remover", category: "text", status: "live",
    description: "Remove extra spaces, tabs and blank lines from text, or trim every line. Free, instant, in-browser whitespace cleaner.",
    keywords: ["whitespace remover", "remove extra spaces", "trim spaces", "remove double spaces", "clean whitespace"],
    intro: "Whitespace Remover collapses repeated spaces, trims each line and can strip blank lines — perfect for tidying up copied or generated text.",
    steps: ["Paste your text.", "Pick which whitespace to remove.", "Copy the cleaned text."],
    faqs: [
      { q: "What can it remove?", a: "Double spaces, tabs, leading/trailing spaces on each line, and blank lines." },
      { q: "Does it touch line breaks?", a: "Only if you enable blank-line removal; single line breaks are preserved otherwise." },
      { q: "Is it private?", a: "Yes, cleaning runs in your browser." },
    ],
  },
  {
    slug: "repeat-text", name: "Repeat Text Generator", category: "text", status: "live",
    description: "Repeat a word, phrase or line any number of times, with an optional separator. Free, instant, in-browser text repeater.",
    keywords: ["repeat text", "text repeater", "repeat word", "duplicate text", "repeat string"],
    intro: "Repeat Text Generator outputs your text repeated as many times as you want, optionally separated by a space, comma or new line.",
    steps: ["Enter your text.", "Set how many times and the separator.", "Copy the repeated output."],
    faqs: [
      { q: "Can I add a separator between repeats?", a: "Yes — choose a new line, space, comma or none." },
      { q: "Is there a limit?", a: "Very large counts are capped to keep your browser responsive." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "online-notepad", name: "Online Notepad", category: "text", status: "live",
    description: "A distraction-free online notepad that auto-saves to your browser. Free, private — your notes never leave your device.",
    keywords: ["online notepad", "notepad online", "text editor online", "quick notes", "scratchpad"],
    intro: "Online Notepad is a simple, distraction-free place to jot notes. Your text auto-saves locally in your browser, so it's there when you come back — and it never leaves your device.",
    steps: ["Start typing.", "Your note auto-saves as you go.", "Come back anytime — it's still here."],
    faqs: [
      { q: "Where are my notes stored?", a: "In your browser's local storage on this device — nothing is uploaded to a server." },
      { q: "Will my note persist?", a: "Yes, until you clear it or clear your browser data. It's per-device and per-browser." },
      { q: "Is there a word count?", a: "Yes, a live word and character count is shown." },
    ],
  },

  // Developer
  {
    slug: "http-status-codes", name: "HTTP Status Codes", category: "developer", status: "live",
    description: "Look up any HTTP status code (200, 301, 404, 500…) with its meaning and category. Free, instant, searchable reference.",
    keywords: ["http status codes", "http status code list", "404 meaning", "500 error", "http response codes"],
    intro: "HTTP Status Codes is a searchable reference for every standard HTTP response code, with its name, category and a plain-English explanation.",
    steps: ["Search by code or keyword.", "Read the meaning and category.", "Use it to debug requests."],
    faqs: [
      { q: "Which codes are included?", a: "All standard 1xx–5xx status codes, grouped by category (informational, success, redirect, client error, server error)." },
      { q: "Can I search by name?", a: "Yes — search “not found”, “redirect” or a number like 404." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "mime-type-lookup", name: "MIME Type Lookup", category: "developer", status: "live",
    description: "Find the MIME type for any file extension, or the extensions for a MIME type. Free, instant, searchable reference.",
    keywords: ["mime type lookup", "content type", "file extension mime", "mime types list", "media type"],
    intro: "MIME Type Lookup maps file extensions to their MIME (content) types and back — useful for setting correct Content-Type headers.",
    steps: ["Search by extension (e.g. .pdf) or type.", "Read the matching MIME type.", "Copy it into your headers."],
    faqs: [
      { q: "What is a MIME type?", a: "A label like application/pdf that tells browsers and servers what kind of file is being sent." },
      { q: "Can I search both ways?", a: "Yes — search by extension or by MIME type." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "css-gradient-generator", name: "CSS Gradient Generator", category: "developer", status: "live",
    description: "Create linear and radial CSS gradients visually and copy the code. Free, instant, in-browser gradient generator.",
    keywords: ["css gradient generator", "gradient generator", "linear gradient css", "background gradient", "css gradient code"],
    intro: "CSS Gradient Generator lets you pick colours and direction to build linear or radial gradients, with a live preview and ready-to-copy CSS.",
    steps: ["Pick two colours and a type.", "Adjust the angle or position.", "Copy the CSS."],
    faqs: [
      { q: "Does it support radial gradients?", a: "Yes — switch between linear and radial, and adjust the angle for linear gradients." },
      { q: "What do I copy?", a: "A ready-to-use background CSS declaration." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "box-shadow-generator", name: "CSS Box Shadow Generator", category: "developer", status: "live",
    description: "Design CSS box-shadows visually with sliders and copy the code. Free, instant, in-browser box-shadow generator.",
    keywords: ["box shadow generator", "css box shadow", "shadow generator", "box-shadow css", "css shadow code"],
    intro: "CSS Box Shadow Generator gives you sliders for offset, blur, spread, colour and inset, with a live preview and copyable box-shadow CSS.",
    steps: ["Adjust the shadow sliders.", "See the live preview.", "Copy the CSS."],
    faqs: [
      { q: "Does it support inset shadows?", a: "Yes — toggle inset on or off." },
      { q: "Can I control the colour and opacity?", a: "Yes, including the shadow colour and its transparency." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "cron-explainer", name: "Cron Expression Explainer", category: "developer", status: "live",
    description: "Explain a cron expression in plain English and see its next run times. Free, instant, in-browser cron parser.",
    keywords: ["cron expression", "cron explainer", "crontab generator", "cron parser", "cron schedule"],
    intro: "Cron Expression Explainer translates a 5-field cron schedule into plain English and lists the upcoming run times, so you can be sure your job runs when you expect.",
    steps: ["Enter a cron expression (e.g. 0 9 * * 1).", "Read the plain-English description.", "Check the next run times."],
    faqs: [
      { q: "What cron format is supported?", a: "Standard 5-field cron: minute, hour, day-of-month, month and day-of-week, including ranges, lists and steps." },
      { q: "Does it show next runs?", a: "Yes — it lists the next several times the schedule will fire." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "json-to-yaml", name: "JSON to YAML Converter", category: "developer", status: "live",
    description: "Convert JSON to YAML and YAML back to JSON instantly. Free, private, in-browser converter with validation.",
    keywords: ["json to yaml", "yaml to json", "json yaml converter", "convert json to yaml", "yaml converter"],
    intro: "JSON to YAML converts between JSON and YAML in both directions, with clear errors for invalid input — handy for config files and CI pipelines.",
    steps: ["Paste JSON or YAML.", "Choose the conversion direction.", "Copy the result."],
    faqs: [
      { q: "Does it convert both ways?", a: "Yes — JSON → YAML and YAML → JSON." },
      { q: "What happens with invalid input?", a: "You get a clear error message instead of broken output." },
      { q: "Is my data uploaded?", a: "No, conversion runs entirely in your browser." },
    ],
  },
  {
    slug: "regex-tester", name: "Regex Tester", category: "developer", status: "live",
    description: "Test regular expressions against your text with live match highlighting and capture groups. Free, instant, in-browser regex tester.",
    keywords: ["regex tester", "regex test online", "regular expression tester", "regex match", "test regex"],
    intro: "Regex Tester runs your regular expression against sample text and highlights every match live, with flags and capture-group details.",
    steps: ["Enter a regex pattern and flags.", "Paste your test text.", "See matches highlighted instantly."],
    faqs: [
      { q: "Which flavour of regex is this?", a: "JavaScript regular expressions, with support for the g, i, m, s and u flags." },
      { q: "Does it show capture groups?", a: "Yes — it lists matches and their captured groups." },
      { q: "Is my text uploaded?", a: "No, matching runs entirely in your browser." },
    ],
  },
  {
    slug: "barcode-generator", name: "Barcode Generator", category: "developer", status: "live",
    description: "Generate barcodes (CODE128, EAN, UPC and more) from any text and download as PNG. Free, instant, in-browser.",
    keywords: ["barcode generator", "create barcode", "code128 generator", "ean barcode", "free barcode maker"],
    intro: "Barcode Generator turns text or numbers into a scannable barcode in several formats and lets you download it as a PNG. It all runs in your browser.",
    steps: ["Enter the value and choose a format.", "Preview the barcode.", "Download the PNG."],
    faqs: [
      { q: "Which barcode formats are supported?", a: "Common 1D formats including CODE128, EAN-13, UPC and CODE39." },
      { q: "Can I download it?", a: "Yes — save the barcode as a PNG image." },
      { q: "Is it free?", a: "Yes, free and generated in your browser." },
    ],
  },

  // Image
  {
    slug: "favicon-generator", name: "Favicon Generator", category: "image", status: "live",
    description: "Generate favicon PNGs in all the standard sizes (16, 32, 48, 180, 192, 512) from one image. Free, private, in-browser.",
    keywords: ["favicon generator", "create favicon", "favicon from image", "favicon png", "site icon generator"],
    intro: "Favicon Generator resizes one image into all the favicon sizes browsers and devices expect, ready to download — processed entirely in your browser.",
    steps: ["Choose a square image.", "Preview the generated sizes.", "Download each favicon PNG."],
    faqs: [
      { q: "Which sizes does it create?", a: "16×16, 32×32, 48×48, 180×180 (Apple), 192×192 and 512×512 (PWA)." },
      { q: "Do I get an .ico file?", a: "It outputs PNGs, which modern browsers fully support via link tags. Many setups no longer need .ico." },
      { q: "Is my image uploaded?", a: "No, resizing happens locally in your browser." },
    ],
  },
  {
    slug: "watermark-image", name: "Add Watermark to Image", category: "image", status: "live",
    description: "Add a text watermark to any image with adjustable position, size and opacity. Free, private, in-browser — no upload.",
    keywords: ["watermark image", "add watermark", "watermark photo", "text watermark", "image watermark online"],
    intro: "Add Watermark to Image stamps custom text across your photo with control over position, size and opacity, then lets you download the result — all in your browser.",
    steps: ["Choose an image and type your watermark.", "Adjust position, size and opacity.", "Download the watermarked image."],
    faqs: [
      { q: "Can I control where the watermark goes?", a: "Yes — choose the position and adjust size and opacity." },
      { q: "Is my image uploaded?", a: "No, watermarking is done locally with your browser's Canvas." },
      { q: "What format is the output?", a: "The watermarked image downloads as a PNG." },
    ],
  },
  {
    slug: "image-color-picker", name: "Image Color Picker", category: "image", status: "live",
    description: "Pick colours from any image and extract its palette as HEX/RGB. Free, private, in-browser color picker — no upload.",
    keywords: ["image color picker", "color picker from image", "get color from image", "extract colors", "image palette"],
    intro: "Image Color Picker lets you click anywhere on an uploaded image to read the exact colour, and extracts a palette of its dominant colours as copyable HEX values.",
    steps: ["Choose an image.", "Click a pixel to read its colour, or view the palette.", "Copy the HEX/RGB value."],
    faqs: [
      { q: "Can I get the dominant colours?", a: "Yes — it shows a palette of the most common colours in the image." },
      { q: "Is my image uploaded?", a: "No, colours are read locally in your browser." },
      { q: "What formats are shown?", a: "HEX and RGB, both copyable." },
    ],
  },
  {
    slug: "meme-generator", name: "Meme Generator", category: "image", status: "live",
    description: "Add bold top and bottom text to any image to make a meme, then download it. Free, private, in-browser meme maker.",
    keywords: ["meme generator", "meme maker", "caption image", "add text to image", "make a meme"],
    intro: "Meme Generator adds the classic bold top and bottom caption to your image and lets you download the finished meme — all processed in your browser.",
    steps: ["Choose an image.", "Type your top and bottom text.", "Download your meme."],
    faqs: [
      { q: "Is my image uploaded?", a: "No, the meme is rendered locally with your browser's Canvas." },
      { q: "Can I style the text?", a: "It uses the classic bold white-with-outline meme style, sized to fit." },
      { q: "What format is the output?", a: "A downloadable PNG." },
    ],
  },

  // Calculator
  {
    slug: "aspect-ratio-calculator", name: "Aspect Ratio Calculator", category: "calculator", status: "live",
    description: "Calculate a missing width or height that keeps your aspect ratio (16:9, 4:3, etc.). Free, instant aspect ratio calculator.",
    keywords: ["aspect ratio calculator", "ratio calculator", "16:9 calculator", "resize ratio", "pixel aspect ratio"],
    intro: "Aspect Ratio Calculator finds the missing dimension that preserves a given ratio — enter a ratio and one side, and it computes the other.",
    steps: ["Enter the aspect ratio (e.g. 16:9).", "Enter a known width or height.", "Read the matching dimension."],
    faqs: [
      { q: "What can it solve?", a: "Given a ratio and one dimension, it finds the other while keeping proportions." },
      { q: "Can I use it for video and images?", a: "Yes — any case where you need to preserve an aspect ratio." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "calorie-calculator", name: "Calorie / TDEE Calculator", category: "calculator", status: "live",
    description: "Estimate your daily calorie needs (BMR and TDEE) from age, sex, height, weight and activity level. Free, instant.",
    keywords: ["calorie calculator", "tdee calculator", "bmr calculator", "daily calorie needs", "maintenance calories"],
    intro: "Calorie / TDEE Calculator estimates your Basal Metabolic Rate and Total Daily Energy Expenditure using the Mifflin-St Jeor formula and your activity level.",
    steps: ["Enter age, sex, height and weight.", "Pick your activity level.", "Read your BMR and daily calorie needs."],
    faqs: [
      { q: "What formula does it use?", a: "The Mifflin-St Jeor equation for BMR, multiplied by an activity factor for TDEE." },
      { q: "Is this medical advice?", a: "No — it's an estimate for general guidance, not a substitute for professional advice." },
      { q: "Is my data stored?", a: "No, the calculation runs entirely in your browser." },
    ],
  },
  {
    slug: "unit-converter", name: "Unit Converter", category: "calculator", status: "live",
    description: "Convert between units of length, weight, temperature, volume, area and speed. Free, instant, in-browser unit converter.",
    keywords: ["unit converter", "measurement converter", "cm to inches", "kg to lbs", "metric converter"],
    intro: "Unit Converter handles everyday conversions across length, weight, temperature, volume, area and speed — pick a category and convert instantly.",
    steps: ["Choose a category.", "Enter a value and pick the from/to units.", "Read the converted value."],
    faqs: [
      { q: "Which categories are supported?", a: "Length, weight/mass, temperature, volume, area and speed." },
      { q: "Does it handle metric and imperial?", a: "Yes — convert freely between metric and imperial units." },
      { q: "Is it free?", a: "Yes, free and instant in your browser." },
    ],
  },
  {
    slug: "add-subtract-days", name: "Date Calculator (Add / Subtract Days)", category: "calculator", status: "live",
    description: "Add or subtract days, weeks, months or years from a date to find the resulting date. Free, instant date calculator.",
    keywords: ["add days to date", "date calculator", "subtract days from date", "days from today", "date plus days"],
    intro: "Date Calculator adds or subtracts days, weeks, months or years from any starting date and shows you the resulting date.",
    steps: ["Pick a start date.", "Enter an amount and unit to add or subtract.", "Read the resulting date."],
    faqs: [
      { q: "Can I subtract as well as add?", a: "Yes — use a negative amount or the subtract option to go backwards in time." },
      { q: "Which units are supported?", a: "Days, weeks, months and years." },
      { q: "Is it private?", a: "Yes, the calculation runs in your browser." },
    ],
  },
  {
    slug: "markup-calculator", name: "Markup & Margin Calculator", category: "calculator", status: "live",
    description: "Calculate selling price, profit, markup % and margin % from cost and price. Free, instant business calculator.",
    keywords: ["markup calculator", "margin calculator", "profit margin", "markup vs margin", "selling price calculator"],
    intro: "Markup & Margin Calculator works out profit, markup percentage and margin percentage from a cost and selling price — essential for pricing decisions.",
    steps: ["Enter your cost and selling price.", "Read the profit, markup % and margin %.", "Adjust to hit your target."],
    faqs: [
      { q: "What's the difference between markup and margin?", a: "Markup is profit as a percentage of cost; margin is profit as a percentage of selling price." },
      { q: "Can it find a price from a target margin?", a: "Enter cost and price to see both percentages; adjust price to reach your target." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "salary-to-hourly", name: "Salary to Hourly Converter", category: "calculator", status: "live",
    description: "Convert an annual salary to hourly, daily, weekly and monthly pay (and back). Free, instant pay converter.",
    keywords: ["salary to hourly", "hourly to salary", "annual salary calculator", "hourly wage calculator", "pay converter"],
    intro: "Salary to Hourly Converter breaks an annual salary down into hourly, daily, weekly and monthly pay based on your working hours — and converts back from an hourly rate.",
    steps: ["Enter a salary or hourly rate.", "Set hours per week and weeks per year.", "Read all the pay breakdowns."],
    faqs: [
      { q: "Can it convert hourly to salary too?", a: "Yes — enter either an annual salary or an hourly rate." },
      { q: "Are taxes included?", a: "No — these are gross figures before tax and deductions." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "dice-roller", name: "Dice Roller & Random Picker", category: "calculator", status: "live",
    description: "Roll virtual dice or pick a random item from a list, using the secure crypto API. Free, instant, in-browser.",
    keywords: ["dice roller", "roll dice online", "random picker", "random name picker", "decision maker"],
    intro: "Dice Roller & Random Picker rolls any number of dice with any number of sides, or picks a random winner from a list you paste — using your browser's secure randomness.",
    steps: ["Choose dice (count and sides), or paste a list.", "Click Roll or Pick.", "See the random result."],
    faqs: [
      { q: "Is the randomness fair?", a: "Yes — it uses the cryptographically-secure Web Crypto API for unbiased results." },
      { q: "Can it pick from a custom list?", a: "Yes — paste names or options and it picks one at random." },
      { q: "Is it free?", a: "Yes, free and instant." },
    ],
  },
  {
    slug: "stopwatch-timer", name: "Stopwatch & Timer", category: "calculator", status: "live",
    description: "A free online stopwatch with laps and a countdown timer with an alarm. Runs in your browser, no sign-up.",
    keywords: ["stopwatch", "online timer", "countdown timer", "stopwatch online", "timer with alarm"],
    intro: "Stopwatch & Timer gives you a precise stopwatch with lap times and a countdown timer that alerts you when it finishes — right in your browser.",
    steps: ["Switch between stopwatch and timer.", "Start, pause and reset as needed.", "For the timer, set a duration and get an alert at zero."],
    faqs: [
      { q: "Does the stopwatch record laps?", a: "Yes — capture lap times while it runs." },
      { q: "Does the timer alert me?", a: "Yes — it plays a sound and shows a notice when the countdown reaches zero." },
      { q: "Is it free?", a: "Yes, free with no sign-up." },
    ],
  },

  // ── Batch 7 — AI & metadata tools ────────────────────────────────────
  {
    slug: "ai-content-detector", name: "AI Content Detector", category: "text", status: "live", trending: true,
    local: false,
    description: "Free AI content detector. The quick check runs in your browser; an optional deep analysis sends your text to our server for a more accurate score. No sign-up.",
    keywords: ["ai content detector", "ai detector", "ai checker", "chatgpt detector", "detect ai writing", "is this ai written"],
    intro: "AI Content Detector estimates how likely a piece of text was written by AI. The quick check runs entirely in your browser using writing-pattern analysis — sentence-length variance (“burstiness”), repetition, and common AI filler phrases. An optional deep analysis, which you trigger by clicking a button, sends your text to our server (and on to AI models) for a more accurate, blended score; it is analysed for that and not stored.",
    steps: ["Paste the text you want to check.", "Read the instant, in-browser quick-check score and the signals behind it.", "Optionally click “Run deep AI analysis” for a more accurate score — this one sends your text to our server."],
    faqs: [
      { q: "Is this 100% accurate?", a: "No. No AI detector is reliable — even paid ones produce false positives. This is an indicator based on writing patterns and model estimates, not proof. Never use it alone to accuse someone of cheating." },
      { q: "How does it work?", a: "The quick check scores statistical writing signals in your browser (sentence-length variance, repetition, vocabulary diversity, known AI filler phrases). The optional deep analysis blends those with one or more AI detection models run on our server." },
      { q: "Is my text uploaded?", a: "Only if you choose to. The quick check is 100% in your browser. The text is sent to our server (and the AI models it uses) only when you click “Run deep AI analysis” — it's analysed for the score and not stored. Avoid pasting anything sensitive if you use deep analysis." },
    ],
  },
  {
    slug: "ai-image-checker", name: "AI Image Detector", category: "image", status: "live", trending: true,
    description: "Check whether an image was AI-generated by inspecting its metadata and Content Credentials (C2PA) — free, private, in-browser. No upload.",
    keywords: ["ai image detector", "is this image ai", "ai generated image checker", "detect ai image", "c2pa content credentials", "midjourney stable diffusion checker"],
    intro: "AI Image Detector inspects an image's metadata for signs it was AI-generated — embedded Stable Diffusion / ComfyUI prompts, generator software tags, and C2PA Content Credentials from tools like DALL·E and Adobe Firefly. It runs entirely in your browser.",
    steps: ["Choose an image.", "We scan its metadata and content credentials.", "Read the verdict and any AI signals found."],
    faqs: [
      { q: "Can it detect any AI image?", a: "No. It detects AI images that still carry metadata or Content Credentials. If the metadata was stripped (e.g. a screenshot or re-saved file), this check can't tell — analysing raw pixels would require an ML model." },
      { q: "What signals does it look for?", a: "Embedded generation prompts in PNG text chunks (Stable Diffusion/ComfyUI), generator software tags (Midjourney, DALL·E, Firefly, etc.) and C2PA provenance manifests." },
      { q: "Is my image uploaded?", a: "No — the file is read locally in your browser and never sent anywhere." },
    ],
  },
  {
    slug: "image-metadata-viewer", name: "Image Metadata Viewer (EXIF)", category: "image", status: "live", trending: true,
    description: "View an image's hidden EXIF metadata — camera, date, settings and GPS location — free and privately in your browser. No upload.",
    keywords: ["image metadata viewer", "exif viewer", "see image metadata", "exif data", "photo metadata", "gps from photo"],
    intro: "Image Metadata Viewer reveals the hidden EXIF data inside your photos — camera and lens, capture date, exposure settings and even GPS coordinates — so you can see exactly what a file discloses. It reads everything locally in your browser.",
    steps: ["Choose a JPEG or supported image.", "Review all the metadata fields found.", "Check whether it contains GPS location you may want to remove."],
    faqs: [
      { q: "Which formats are supported?", a: "JPEG carries the richest EXIF; many PNG/TIFF/HEIC files also include metadata, which is shown when present." },
      { q: "Does it show GPS location?", a: "Yes — if the photo embeds GPS coordinates, they're shown with a map link. Use the Metadata Remover to strip them before sharing." },
      { q: "Is my photo uploaded?", a: "No — metadata is read locally in your browser." },
    ],
  },
  {
    slug: "image-metadata-remover", name: "Image Metadata Remover", category: "image", status: "live", trending: true,
    description: "Remove EXIF and all hidden metadata (including GPS location) from an image for privacy. Free, in-browser, no upload — download a clean copy.",
    keywords: ["image metadata remover", "remove exif", "strip metadata", "remove gps from photo", "clear exif data", "remove photo location"],
    intro: "Image Metadata Remover strips EXIF and all embedded metadata — including GPS location — from your photo by re-encoding it cleanly, so you can share it without revealing where or when it was taken. Select several photos to clean them all at once and download them as a .zip. Everything happens in your browser.",
    steps: ["Choose one or more images.", "We show what metadata it contains, then strip it by re-encoding.", "Download the clean copy, or “Download all” as a .zip for a batch."],
    faqs: [
      { q: "What gets removed?", a: "All EXIF/metadata — camera info, timestamps, GPS location and any embedded thumbnails — by re-encoding the image fresh." },
      { q: "Can I clean many photos at once?", a: "Yes. Select multiple images and each is re-encoded metadata-free, then offered as individual downloads or a single .zip." },
      { q: "Will the image quality change?", a: "It re-encodes once; choose PNG for lossless output or JPEG for a smaller file. Dimensions stay the same." },
      { q: "Is my photo uploaded?", a: "No — stripping happens locally; your images never leave your device." },
    ],
  },

  // ── BATCH 8 — trending additions (2026) ───────────────────────────────
  {
    slug: "heic-to-jpg", name: "HEIC to JPG", category: "image", status: "live", trending: true,
    description: "Convert iPhone HEIC/HEIF photos to JPG for free, right in your browser. No upload, no app — decode and download instantly.",
    keywords: ["heic to jpg", "heic to jpeg", "convert heic", "iphone photo to jpg", "heif to jpg"],
    answer: "HEIC to JPG converts Apple's High Efficiency Image format (used by iPhones) into the universally supported JPG. It's needed because many websites, forms and Windows apps can't open HEIC. This tool decodes the HEIC file and re-encodes it as JPG entirely in your browser, so your photo is never uploaded to a server.",
    intro: "iPhones save photos as HEIC to keep files small, but lots of sites and apps can't open them. HEIC to JPG converts them to the universal JPG format, right in your browser.",
    steps: ["Choose a HEIC or HEIF photo.", "Wait a moment while it decodes (the decoder loads on first use).", "Keep JPG selected and click “Convert & download”."],
    faqs: [
      { q: "Why won't my iPhone photo open on Windows or a website?", a: "Because it's in HEIC format, which many apps and upload forms don't support. Converting to JPG fixes it everywhere." },
      { q: "Is my photo uploaded?", a: "No — the HEIC file is decoded and converted locally in your browser." },
      { q: "Will I lose quality?", a: "JPG is re-encoded at high quality (92%). For most photos the difference is invisible." },
    ],
    related: ["jpg-to-png", "compress-image", "resize-image"], updated: "2026-07-01",
  },
  {
    slug: "webp-to-jpg", name: "WebP to JPG", category: "image", status: "live",
    description: "Convert WebP images to JPG for free, instantly, in your browser. No upload — pick JPG and download.",
    keywords: ["webp to jpg", "webp to jpeg", "convert webp", "webp converter", "change webp to jpg"],
    answer: "WebP to JPG converts Google's WebP image format into the widely compatible JPG. WebP saves images downloaded from the web often use, but some editors and older apps can't open them. This converter re-encodes the image to JPG entirely in your browser, filling any transparency with white, so nothing is uploaded.",
    intro: "WebP is great for the web but awkward in older apps and editors. WebP to JPG converts it to the universal JPG format, in your browser.",
    steps: ["Choose a WebP image.", "Keep JPG selected as the target format.", "Click “Convert & download”."],
    faqs: [
      { q: "Why convert WebP to JPG?", a: "Some editors, email clients and older software can't open WebP. JPG works everywhere." },
      { q: "Are my images uploaded?", a: "No — conversion runs entirely in your browser." },
    ],
    related: ["jpg-to-webp", "png-to-webp", "jpg-to-png"], updated: "2026-07-01",
  },
  {
    slug: "jpg-to-webp", name: "JPG to WebP", category: "image", status: "live",
    description: "Convert JPG images to WebP for smaller, faster-loading files — free and in your browser. No upload required.",
    keywords: ["jpg to webp", "jpeg to webp", "convert to webp", "webp converter", "image to webp"],
    answer: "JPG to WebP converts standard JPG photos into Google's WebP format, which typically produces 25–35% smaller files at the same visual quality — ideal for faster-loading websites. This tool re-encodes the image to WebP entirely in your browser, so your photo is never uploaded.",
    intro: "WebP files are noticeably smaller than JPG at the same quality, which speeds up websites. JPG to WebP converts your images in the browser.",
    steps: ["Choose a JPG image.", "Keep WebP selected as the target format.", "Click “Convert & download”."],
    faqs: [
      { q: "Why use WebP?", a: "WebP images are usually 25–35% smaller than JPG at similar quality, so pages load faster and use less bandwidth." },
      { q: "Are my images uploaded?", a: "No — conversion runs entirely in your browser." },
    ],
    related: ["webp-to-jpg", "png-to-webp", "compress-image"], updated: "2026-07-01",
  },
  {
    slug: "png-to-webp", name: "PNG to WebP", category: "image", status: "live",
    description: "Convert PNG images to WebP for much smaller files that keep transparency — free and in your browser. No upload.",
    keywords: ["png to webp", "convert png to webp", "webp converter", "png webp", "shrink png"],
    answer: "PNG to WebP converts PNG images into Google's WebP format, which supports transparency like PNG but produces far smaller files — often 60–80% smaller for graphics. This tool re-encodes the image to WebP entirely in your browser, so nothing is uploaded.",
    intro: "PNG keeps transparency but the files are large. WebP keeps transparency too, at a fraction of the size. PNG to WebP converts them in your browser.",
    steps: ["Choose a PNG image.", "Keep WebP selected as the target format.", "Click “Convert & download”."],
    faqs: [
      { q: "Does WebP keep PNG transparency?", a: "Yes — WebP supports an alpha channel, so transparent areas are preserved." },
      { q: "How much smaller are the files?", a: "For flat graphics and logos, WebP is often 60–80% smaller than PNG." },
    ],
    related: ["jpg-to-webp", "webp-to-jpg", "compress-image"], updated: "2026-07-01",
  },
  {
    slug: "avif-to-jpg", name: "AVIF to JPG", category: "image", status: "live",
    description: "Convert AVIF images to JPG for free, in your browser. Open modern AVIF files anywhere by converting them to JPG. No upload.",
    keywords: ["avif to jpg", "avif to jpeg", "convert avif", "open avif file", "avif converter"],
    answer: "AVIF to JPG converts the modern AV1-based AVIF image format into the universally supported JPG. AVIF offers excellent compression but many apps and editors still can't open it. This tool decodes the AVIF (which your browser supports) and re-encodes it as JPG locally, so nothing is uploaded.",
    intro: "AVIF is a highly efficient modern image format, but support in apps is still catching up. AVIF to JPG converts it to the universal JPG, in your browser.",
    steps: ["Choose an AVIF image.", "Keep JPG selected as the target format.", "Click “Convert & download”."],
    faqs: [
      { q: "Why can't I open AVIF files?", a: "AVIF is new — many editors and older apps don't support it yet. Converting to JPG makes it open everywhere." },
      { q: "Is my image uploaded?", a: "No — conversion happens locally in your browser." },
    ],
    related: ["webp-to-jpg", "jpg-to-png", "compress-image"], updated: "2026-07-01",
  },
  {
    slug: "pdf-page-numbers", name: "Add Page Numbers to PDF", category: "pdf", status: "live",
    description: "Add page numbers to a PDF for free, in your browser — choose position, start number and “n / total” format. No uploads.",
    keywords: ["add page numbers to pdf", "pdf page numbers", "number pdf pages", "insert page numbers pdf"],
    answer: "This tool stamps page numbers onto every page of a PDF. You choose the position (left, centre or right), the starting number, and whether to show a plain number or “n / total”. The numbers are drawn into the file with pdf-lib entirely in your browser, so your document is never uploaded.",
    intro: "Add clean, printed page numbers to any PDF — pick the position and starting number, and download the numbered file. Everything runs in your browser.",
    steps: ["Choose a PDF file.", "Pick the position and starting number.", "Click “Add page numbers & download”."],
    faqs: [
      { q: "Can I start numbering from a specific page number?", a: "Yes — set the “Start at” value and the first page takes that number, incrementing from there." },
      { q: "Is my PDF uploaded?", a: "No — the page numbers are added locally in your browser." },
    ],
    related: ["watermark-pdf", "organize-pdf", "merge-pdf"], updated: "2026-07-01",
  },
  {
    slug: "watermark-pdf", name: "Add Watermark to PDF", category: "pdf", status: "live", trending: true,
    description: "Add a text watermark to every page of a PDF for free, in your browser — adjustable opacity, size and angle. No uploads.",
    keywords: ["add watermark to pdf", "pdf watermark", "watermark pdf free", "stamp pdf confidential"],
    answer: "This tool stamps a text watermark — like “CONFIDENTIAL” or “DRAFT” — across every page of a PDF, with adjustable opacity, font size and a diagonal or horizontal angle. The watermark is drawn into the file with pdf-lib entirely in your browser, so your document is never uploaded to a server.",
    intro: "Mark a PDF as confidential, draft or your own with a text watermark on every page. Adjust the opacity and angle, then download — all in your browser.",
    steps: ["Choose a PDF file.", "Type your watermark text and adjust opacity, size and angle.", "Click “Add watermark & download”."],
    faqs: [
      { q: "Does it watermark every page?", a: "Yes — the text is applied to all pages of the document." },
      { q: "Is my PDF uploaded?", a: "No — watermarking happens locally in your browser." },
    ],
    related: ["pdf-page-numbers", "organize-pdf", "watermark-image"], updated: "2026-07-01",
  },
  {
    slug: "organize-pdf", name: "Organize PDF Pages", category: "pdf", status: "live",
    description: "Reorder and delete pages in a PDF for free, in your browser — rearrange the sequence and remove unwanted pages. No uploads.",
    keywords: ["organize pdf", "reorder pdf pages", "delete pdf pages", "rearrange pdf", "remove pages from pdf"],
    answer: "Organize PDF lets you rearrange and delete pages in a PDF. Load a file, move pages up or down into the order you want, remove any you don't need, then rebuild the document — all with pdf-lib in your browser, so the file is never uploaded.",
    intro: "Rearrange or drop pages from a PDF without any upload. Reorder the pages, delete the ones you don't need, and download the tidied-up file.",
    steps: ["Choose a PDF file.", "Use the arrows to reorder pages and ✕ to remove them.", "Click “Save reorganized PDF”."],
    faqs: [
      { q: "Can I delete specific pages?", a: "Yes — remove any page from the list, then save. The new PDF contains only the pages you kept, in your chosen order." },
      { q: "Is my PDF uploaded?", a: "No — reorganizing happens entirely in your browser." },
    ],
    related: ["split-pdf", "merge-pdf", "rotate-pdf"], updated: "2026-07-01",
  },
  {
    slug: "sip-calculator", name: "SIP Calculator", category: "calculator", status: "live", trending: true,
    description: "Calculate the future value of a monthly SIP (Systematic Investment Plan) for free — see invested amount, estimated returns and total value.",
    keywords: ["sip calculator", "systematic investment plan calculator", "mutual fund sip", "sip returns calculator"],
    answer: "A SIP calculator estimates what a monthly Systematic Investment Plan could grow to. Enter your monthly investment, expected annual return and time period, and it computes the future value using the compound-growth annuity formula, splitting the result into the amount you invested and the estimated returns. Returns are illustrative, not guaranteed.",
    intro: "See how a monthly SIP could grow over time. Enter your monthly amount, an expected annual return and the number of years to estimate your maturity value.",
    steps: ["Enter your monthly investment amount.", "Enter the expected annual return (%) and time in years.", "Read the invested amount, estimated returns and total value."],
    faqs: [
      { q: "How is the SIP value calculated?", a: "It uses the future-value-of-annuity formula with monthly compounding, assuming each instalment is invested at the start of the month." },
      { q: "Are the returns guaranteed?", a: "No — market returns vary. The result is an estimate for planning, based on the rate you enter." },
    ],
    related: ["compound-interest-calculator", "fd-calculator", "loan-emi-calculator"], updated: "2026-07-01",
  },
  {
    slug: "fd-calculator", name: "FD Calculator", category: "calculator", status: "live",
    description: "Calculate fixed deposit maturity and interest for free — enter amount, rate, term and compounding frequency. Instant and private.",
    keywords: ["fd calculator", "fixed deposit calculator", "fd maturity calculator", "fd interest calculator"],
    answer: "An FD calculator works out the maturity value of a fixed deposit. Enter the deposit amount, annual interest rate, term and compounding frequency (quarterly is typical), and it applies the compound-interest formula to show the interest earned and the final maturity value. The figure is before any tax (TDS).",
    intro: "Work out what a fixed deposit will be worth at maturity. Enter the amount, interest rate, term and how often interest compounds.",
    steps: ["Enter the deposit amount.", "Enter the interest rate, term and compounding frequency.", "Read the interest earned and maturity value."],
    faqs: [
      { q: "How often do FDs compound?", a: "Most banks compound quarterly, but you can choose annually, half-yearly, quarterly or monthly here." },
      { q: "Is the result after tax?", a: "No — it's the gross maturity value before any TDS or income tax on the interest." },
    ],
    related: ["sip-calculator", "compound-interest-calculator", "loan-emi-calculator"], updated: "2026-07-01",
  },
  {
    slug: "curl-converter", name: "cURL Converter", category: "developer", status: "live", trending: true,
    description: "Convert a cURL command to JavaScript fetch and Python requests code for free, in your browser. Paste curl, copy the code.",
    keywords: ["curl converter", "curl to fetch", "curl to python", "convert curl command", "curl to javascript"],
    answer: "A cURL converter turns a curl command into equivalent code in another language. Paste a curl command and this tool parses its method, headers, body and URL, then generates ready-to-use JavaScript (fetch) and Python (requests) snippets. It runs entirely in your browser, so commands containing tokens or keys are never uploaded.",
    intro: "Turn any curl command into JavaScript fetch and Python requests code. Paste the command and copy the generated snippets — all in your browser.",
    steps: ["Paste a cURL command (e.g. from your browser's network tab).", "Read the generated fetch and requests code.", "Copy the snippet you need."],
    faqs: [
      { q: "Which flags are supported?", a: "Common ones: -X/--request, -H/--header, -d/--data (and variants), -u/--user and -b/--cookie. Unknown flags are skipped." },
      { q: "Is my command uploaded?", a: "No — parsing and conversion happen entirely in your browser, so it's safe for commands with tokens." },
    ],
    related: ["json-formatter", "jwt-decoder", "url-encoder"], updated: "2026-07-01",
  },
  {
    slug: "json-to-typescript", name: "JSON to TypeScript", category: "developer", status: "live",
    description: "Generate TypeScript interfaces from JSON for free, in your browser. Paste JSON, get typed interfaces with nested types inferred.",
    keywords: ["json to typescript", "json to interface", "generate typescript types", "json to ts type"],
    answer: "JSON to TypeScript generates TypeScript interfaces from a sample JSON object. Paste JSON and this tool infers the type of each field — strings, numbers, booleans, arrays and nested objects (which become their own named interfaces) — and outputs ready-to-paste interface definitions. It all runs in your browser, so your data is never uploaded.",
    intro: "Turn a sample JSON payload into TypeScript interfaces. Paste the JSON and get typed interfaces with nested objects and arrays inferred automatically.",
    steps: ["Paste a JSON object or array.", "Read the generated TypeScript interfaces.", "Copy them into your project."],
    faqs: [
      { q: "Does it handle nested objects and arrays?", a: "Yes — nested objects become their own interfaces, and arrays infer their element type (with a union if the items differ)." },
      { q: "Is my JSON uploaded?", a: "No — type generation runs entirely in your browser." },
    ],
    related: ["json-formatter", "json-to-yaml", "csv-to-json"], updated: "2026-07-01",
  },

  // ── BATCH 9 — Video & Audio + photo/signature ─────────────────────────
  {
    slug: "mp4-to-mp3", name: "MP4 to MP3", category: "media", status: "live", trending: true,
    description: "Extract the audio from a video and download it as an MP3 — free and in your browser. No upload; runs via ffmpeg.wasm.",
    keywords: ["mp4 to mp3", "video to mp3", "extract audio from video", "convert mp4 to mp3", "video to audio"],
    answer: "MP4 to MP3 extracts the audio track from a video and saves it as an MP3 file. Choose a video, pick a quality (128–320 kbps), and the tool re-encodes just the audio using FFmpeg compiled to WebAssembly — entirely in your browser, so the video is never uploaded. The engine downloads once on first use, then is cached.",
    intro: "Pull the soundtrack, podcast or music out of a video and save it as an MP3. Everything runs in your browser via ffmpeg.wasm — nothing is uploaded.",
    steps: ["Choose a video file (MP4, MOV, WebM, etc.).", "Pick an MP3 quality (192 kbps is a good default).", "Click Extract, then download the MP3."],
    faqs: [
      { q: "Is my video uploaded?", a: "No — the audio is extracted locally in your browser via ffmpeg.wasm. Only the engine binary is downloaded (once)." },
      { q: "Why is the first run slower?", a: "The FFmpeg engine (~32 MB) loads on first use, then it's cached for the rest of your session." },
      { q: "What video formats work?", a: "Most common ones — MP4, MOV, WebM, MKV and more — as long as they contain an audio track." },
    ],
    related: ["video-to-gif", "trim-video", "text-to-speech"], updated: "2026-07-01",
  },
  {
    slug: "video-to-gif", name: "Video to GIF", category: "media", status: "live", trending: true,
    description: "Convert a video clip into an animated GIF — free, in your browser. Set fps, size and duration. No upload; runs via ffmpeg.wasm.",
    keywords: ["video to gif", "mp4 to gif", "make a gif from video", "convert video to gif", "gif maker"],
    answer: "Video to GIF turns a clip into an animated GIF. Pick a start time and duration, set the frame rate and width, and the tool renders a GIF using a two-pass palette for clean colours — all via FFmpeg in your browser (ffmpeg.wasm), so nothing is uploaded. Keep clips short (a few seconds) to keep the GIF small.",
    intro: "Turn a short video clip into a shareable animated GIF. Choose the segment, frame rate and size — it all runs in your browser via ffmpeg.wasm, with no upload.",
    steps: ["Choose a video file.", "Set the start time, duration, fps and width.", "Click “Make GIF” and download it."],
    faqs: [
      { q: "Why keep the clip short?", a: "GIFs are large and memory-heavy. A few seconds at a modest width and fps keeps the file small and avoids exceeding browser memory." },
      { q: "Is my video uploaded?", a: "No — the GIF is rendered locally in your browser via ffmpeg.wasm." },
    ],
    related: ["mp4-to-mp3", "trim-video", "compress-image"], updated: "2026-07-01",
  },
  {
    slug: "trim-video", name: "Trim Video", category: "media", status: "live",
    description: "Cut a shorter clip from a video for free, in your browser — pick start and end, no re-encoding, no quality loss. No upload.",
    keywords: ["trim video", "cut video", "crop video length", "video cutter", "shorten video online"],
    answer: "Trim Video cuts a clip out of a longer video between a start and end time. It copies the original streams without re-encoding, so it's fast and there's no quality loss. Processing runs via FFmpeg in your browser (ffmpeg.wasm), so your footage is never uploaded to a server.",
    intro: "Cut a shorter clip from a video by choosing a start and end point. Because it copies the stream rather than re-encoding, it's fast and lossless — and it all runs in your browser.",
    steps: ["Choose a video file and let it load.", "Set the start and end times in seconds.", "Click “Trim & export” and download the clip."],
    faqs: [
      { q: "Does trimming reduce quality?", a: "No — it copies the original video and audio streams without re-encoding, so quality is preserved." },
      { q: "Is my video uploaded?", a: "No — trimming happens locally in your browser via ffmpeg.wasm." },
    ],
    related: ["mp4-to-mp3", "video-to-gif", "compress-image"], updated: "2026-07-01",
  },
  {
    slug: "passport-photo-maker", name: "Passport Photo Maker", category: "image", status: "live", trending: true,
    description: "Make a passport or visa photo at the correct size (US, UK, EU, Canada) for free, in your browser — plus a 6×4 print sheet. No upload.",
    keywords: ["passport photo maker", "passport size photo", "visa photo", "passport photo online", "id photo maker"],
    answer: "A passport photo maker crops and sizes your photo to an official passport or visa specification — for example 2×2 inches (600×600 px) for the US and India, or 35×45 mm for the UK, EU and Schengen. This tool lets you zoom and position the head, then download the photo at the exact pixel size plus a 6×4 inch print sheet of copies, all in your browser.",
    intro: "Create a correctly sized passport or visa photo for the US, UK, EU or Canada. Position your face, then download a single photo at the exact dimensions or a 6×4 print sheet — all in your browser.",
    steps: ["Choose a clear, front-facing photo.", "Pick your country/size and use zoom and position to centre the head.", "Download the photo, or a 6×4 inch print sheet of copies."],
    faqs: [
      { q: "Is my photo uploaded?", a: "No — the photo is cropped and resized locally in your browser and never sent to a server." },
      { q: "Will it pass official checks?", a: "It produces the correct pixel dimensions and a print sheet, but you're responsible for meeting pose, expression and background rules. Many authorities now reject AI-enhanced photos, so this tool only crops and resizes — it doesn't alter your face." },
      { q: "How do I get a white background?", a: "Use the Background Remover first, place the cut-out on white, then bring it here to size it." },
    ],
    related: ["background-remover", "crop-image", "resize-image"], updated: "2026-07-01",
  },
  {
    slug: "signature-generator", name: "Signature Generator", category: "image", status: "live",
    description: "Draw or type your signature and download it as a transparent PNG — free and in your browser. Perfect for signing documents. No upload.",
    keywords: ["signature generator", "draw signature online", "create signature", "electronic signature maker", "signature png"],
    answer: "A signature generator lets you create a digital signature you can drop into documents. Draw it with your mouse or finger, or type your name in a handwriting-style font, then download it as a PNG with a transparent background. Everything is created in your browser, so your signature is never uploaded.",
    intro: "Create a digital signature by drawing it or typing your name in a signature font, then download it as a transparent PNG to drop into PDFs, emails and documents.",
    steps: ["Choose Draw or Type mode.", "Draw your signature or type your name and pick a style.", "Download the transparent PNG."],
    faqs: [
      { q: "Does the PNG have a transparent background?", a: "Yes — so it sits cleanly on top of any document or form." },
      { q: "Is my signature uploaded?", a: "No — it's created entirely in your browser and never sent anywhere." },
    ],
    related: ["watermark-pdf", "passport-photo-maker", "crop-image"], updated: "2026-07-01",
  },

  // ── Batch 10: media + PDF gaps ─────────────────────────────────────────
  {
    slug: "compress-video", name: "Compress Video", category: "media", status: "live", trending: true,
    description: "Compress MP4 and other videos to a smaller file size for free, right in your browser. Quality presets and optional 720p downscale — no upload, no watermark.",
    keywords: ["compress video", "reduce video size", "video compressor", "make video smaller", "shrink mp4", "compress mp4"],
    answer: "To compress a video, choose a quality preset (and optionally scale it down to 720p) and the tool re-encodes it to H.264 MP4 at a smaller size. It runs entirely in your browser via ffmpeg.wasm, so your video is never uploaded. In-browser encoding is single-threaded, so large files can be slow — shorter clips work best.",
    intro: "Compress Video shrinks the file size of MP4, MOV, WebM and other videos by re-encoding them to efficient H.264, with a quality preset and an optional 720p downscale for bigger savings. It runs locally in your browser using ffmpeg.wasm — your video is never uploaded and there’s no watermark.",
    steps: ["Choose a video file.", "Pick a quality preset and, optionally, scale down to 720p.", "Click Compress, wait for it to encode, then download the smaller MP4."],
    faqs: [
      { q: "How much smaller will my video get?", a: "It depends on the source, but re-encoding an unoptimised phone or screen-recording video at the Balanced preset often cuts size by 40–70%. Scaling to 720p saves more." },
      { q: "Why is it slow for big files?", a: "In-browser video encoding is single-threaded, so a large or long video can take a while and may hit browser memory limits. A shorter clip or a lower resolution is faster." },
      { q: "Is my video uploaded?", a: "No — compression happens entirely in your browser. The only download is the one-time video engine (~32 MB), which is cached afterwards." },
    ],
    related: ["trim-video", "video-to-gif", "mp4-to-mp3"],
  },
  {
    slug: "mute-video", name: "Remove Audio from Video", category: "media", status: "live",
    description: "Remove the audio track from a video (mute it) for free, in your browser. Keeps the original video quality — no upload, no re-encoding.",
    keywords: ["mute video", "remove audio from video", "silence video", "delete sound from video", "strip audio from mp4"],
    answer: "To remove audio from a video, load the file and the tool drops the audio track while copying the video stream untouched — so there’s no quality loss and it’s near-instant. Everything runs in your browser via ffmpeg.wasm; your video is never uploaded.",
    intro: "Remove Audio from Video strips the sound out of a clip while leaving the video exactly as it was. Because the video stream is copied rather than re-encoded, it’s fast and lossless. It runs locally in your browser — nothing is uploaded.",
    steps: ["Choose a video file.", "Click “Remove audio”.", "Download the silent video."],
    faqs: [
      { q: "Will the video quality change?", a: "No. Only the audio track is removed; the video is copied bit-for-bit, so quality is identical to the original." },
      { q: "Which formats work?", a: "MP4, MOV and WebM work best. The output keeps the same format as your input." },
      { q: "Is my video uploaded?", a: "No — it’s processed entirely in your browser." },
    ],
    related: ["trim-video", "compress-video", "mp4-to-mp3"],
  },
  {
    slug: "audio-converter", name: "Audio Converter (MP3 / WAV / OGG / M4A)", category: "media", status: "live",
    description: "Convert audio between MP3, WAV, OGG and M4A for free, in your browser. Choose the bitrate — no upload, no sign-up.",
    keywords: ["audio converter", "convert audio", "mp3 converter", "wav to mp3", "m4a to mp3", "ogg converter", "convert to wav"],
    answer: "To convert audio, choose your target format (MP3, WAV, OGG or M4A) and, for lossy formats, a bitrate — the tool transcodes the file with ffmpeg.wasm right in your browser. Your audio is never uploaded. You can also extract audio from a video file the same way.",
    intro: "Audio Converter changes an audio file’s format between MP3, WAV, OGG and M4A, with a choice of bitrate for the lossy formats. You can also feed it a video to pull the audio out. It runs locally in your browser using ffmpeg.wasm — nothing is uploaded.",
    steps: ["Choose an audio (or video) file.", "Pick the output format and, if asked, a bitrate.", "Click Convert and download the result."],
    faqs: [
      { q: "Which conversions are supported?", a: "Any direction between MP3, WAV, OGG and M4A, plus extracting audio from common video files." },
      { q: "What bitrate should I choose?", a: "192 kbps is a good default for music. Use 320 kbps for the best quality, or 128 kbps for the smallest files. WAV is lossless and has no bitrate setting." },
      { q: "Is my audio uploaded?", a: "No — conversion happens entirely in your browser." },
    ],
    related: ["mp4-to-mp3", "trim-audio", "compress-video"],
  },
  {
    slug: "trim-audio", name: "Trim Audio", category: "media", status: "live",
    description: "Cut an audio clip to a start and end time for free, in your browser. Lossless stream copy — no upload, no re-encoding.",
    keywords: ["trim audio", "cut audio", "audio cutter", "trim mp3", "cut mp3 online", "shorten audio", "make ringtone"],
    answer: "To trim audio, load the file, set a start and end time, and the tool copies just that section out — losslessly and near-instantly, since it doesn’t re-encode. It runs in your browser via ffmpeg.wasm; your audio is never uploaded.",
    intro: "Trim Audio cuts an MP3, WAV, OGG or M4A file down to the section you want, using a start and end time. It copies the stream rather than re-encoding, so it’s fast and there’s no quality loss — great for making ringtones or clipping a recording. Runs locally in your browser.",
    steps: ["Choose an audio file.", "Set the start and end time (in seconds).", "Click “Trim & export” and download the clip."],
    faqs: [
      { q: "Will trimming reduce quality?", a: "No. The selected section is copied without re-encoding, so it’s identical to the source." },
      { q: "Can I make a ringtone with this?", a: "Yes — trim to the section you want and download it. For iPhone you’ll typically want an M4A input." },
      { q: "Is my audio uploaded?", a: "No — trimming happens entirely in your browser." },
    ],
    related: ["audio-converter", "mp4-to-mp3", "trim-video"],
  },
  {
    slug: "delete-pdf-pages", name: "Delete PDF Pages", category: "pdf", status: "live", trending: true,
    description: "Remove pages from a PDF for free, right in your browser. Tap the pages to delete and download the rest — no upload, no sign-up.",
    keywords: ["delete pdf pages", "remove pages from pdf", "delete page from pdf", "remove pdf page", "pdf page remover"],
    answer: "To delete pages from a PDF, load the file, tap the page numbers you want to remove, and download the rebuilt PDF with those pages gone. Everything runs in your browser using pdf-lib — your document is never uploaded.",
    intro: "Delete PDF Pages removes the pages you don’t want from a PDF and rebuilds it from the ones you keep. Just tap the pages to drop and download the result. It runs entirely in your browser, so your document never leaves your device.",
    steps: ["Choose a PDF file.", "Tap the pages you want to delete.", "Click download to save the PDF without them."],
    faqs: [
      { q: "Can I remove several pages at once?", a: "Yes — tap every page you want to delete, then download once. At least one page must remain." },
      { q: "Does this change the other pages?", a: "No. The pages you keep are copied across unchanged; only the ones you selected are removed." },
      { q: "Is my PDF uploaded?", a: "No — the PDF is edited entirely in your browser and never sent to a server." },
    ],
    related: ["organize-pdf", "split-pdf", "merge-pdf"],
  },
  {
    slug: "voice-recorder", name: "Voice Recorder", category: "media", status: "live",
    description: "Record your voice or any audio online for free, right in your browser. Pause, play back, and download as WebM or MP3 — no upload, no sign-up.",
    keywords: ["voice recorder", "audio recorder", "record voice online", "online mic recorder", "record audio", "sound recorder"],
    answer: "To record your voice online, click Start recording and allow microphone access — the tool captures audio directly in your browser with a live level meter. Stop when done, play it back, and download it as WebM or convert to MP3. Nothing is uploaded; the recording stays on your device.",
    intro: "Voice Recorder captures audio from your microphone right in the browser, with a live level meter and pause/resume. When you’re done you can play it back and download it as a WebM file or convert it to MP3. Nothing is uploaded — the recording never leaves your device.",
    steps: ["Click “Start recording” and allow microphone access.", "Speak — pause and resume as needed.", "Stop, play it back, and download as WebM or MP3."],
    faqs: [
      { q: "Where is my recording saved?", a: "Only in your browser, in memory, until you download it. It is never uploaded to any server." },
      { q: "What format do I get?", a: "WebM (Opus audio) by default, which every modern browser records. You can convert it to MP3 in one click, which runs locally via ffmpeg.wasm." },
      { q: "Why can’t it access my microphone?", a: "Your browser must be granted mic permission, and the page must be served over HTTPS. Also make sure no other app is using the mic." },
    ],
    related: ["trim-audio", "audio-converter", "mp4-to-mp3"],
  },
  {
    slug: "screen-recorder", name: "Screen Recorder", category: "media", status: "live", trending: true,
    description: "Record your screen online for free, right in your browser — with optional microphone narration. Download as WebM. No upload, no watermark, no sign-up.",
    keywords: ["screen recorder", "record screen online", "screen capture", "record my screen", "free screen recorder", "browser screen recorder"],
    answer: "To record your screen, click record and choose a screen, window or tab to share; optionally include your microphone for narration. The capture runs entirely in your browser and downloads as a WebM video. Nothing is uploaded and there’s no watermark. Screen recording needs a desktop browser — it isn’t available on most phones.",
    intro: "Screen Recorder captures your screen, a window or a browser tab directly in your browser, with an option to record your microphone for narration. The result downloads as a WebM video with no watermark and no upload. Note that screen capture requires a desktop browser (Chrome, Edge or Firefox) — it isn’t supported on most mobile devices.",
    steps: ["Optionally tick “record my microphone”.", "Click record and choose the screen, window or tab to capture.", "Click Stop (or the browser’s “Stop sharing”), then download the WebM."],
    faqs: [
      { q: "Is there a watermark or time limit?", a: "No watermark and no imposed time limit — you’re bounded only by your device’s memory, since the whole recording is held in the browser until you download it." },
      { q: "Can I record system audio?", a: "When you share a tab or screen, Chrome and Edge let you include its audio (tick the option in the share dialog). You can also add your microphone for narration." },
      { q: "Does it work on mobile?", a: "Generally no — the screen-capture API isn’t available on most mobile browsers. Use a desktop browser." },
      { q: "How do I get an MP4?", a: "Download the WebM, then run it through the Compress Video tool, which can output MP4." },
    ],
    related: ["compress-video", "video-to-gif", "trim-video"],
  },
  {
    slug: "sign-pdf", name: "Fill & Sign PDF", category: "pdf", status: "live", trending: true,
    description: "Sign a PDF online for free — draw or upload your signature, place it on the page, and download the signed PDF. Private, in-browser, no upload.",
    keywords: ["sign pdf", "fill and sign pdf", "add signature to pdf", "pdf signature", "esign pdf", "e-sign document", "sign document online"],
    answer: "To sign a PDF, open it here, draw your signature (or upload a PNG), then click where it should go on the page and download the signed PDF. Everything — the document and your signature — is processed in your browser and never uploaded.",
    intro: "Fill & Sign PDF lets you add a signature to any PDF without printing it. Draw your signature with a mouse or finger, or upload a transparent PNG, then click on the page to place and size it and download the signed document. Your PDF and signature are processed entirely in your browser, so nothing is uploaded.",
    steps: ["Choose a PDF file.", "Draw your signature or upload a PNG, and set its size.", "Click the page to place it, then download the signed PDF."],
    faqs: [
      { q: "Is this a legally binding signature?", a: "It adds a visible signature image to the document, which is what most everyday forms need. It is not a cryptographic digital signature (PKI); for that, use a certificate-based service." },
      { q: "Can I sign on more than one page?", a: "You can place a signature on the page you're viewing. Move between pages with the Prev/Next buttons and place it where it's needed before downloading." },
      { q: "Is my document uploaded?", a: "No. The PDF and your signature never leave your device — signing happens entirely in your browser." },
    ],
    related: ["signature-generator", "delete-pdf-pages", "watermark-pdf"],
  },
];

// ── Derived helpers used across the site ──────────────────────────────────

export const LIVE_TOOLS = TOOLS.filter((t) => t.status === "live");

/** Newest / featured tools shown in the homepage "New & Trending" section. */
export const TRENDING_TOOLS = TOOLS.filter((t) => t.trending && t.status === "live");

/** Hand-picked high-traffic tools for the homepage "Popular" row. */
const POPULAR_SLUGS = [
  "merge-pdf", "compress-pdf", "background-remover", "resize-image",
  "qr-code-generator", "word-counter", "ai-content-detector", "password-generator",
];
export const POPULAR_TOOLS = POPULAR_SLUGS
  .map((s) => TOOLS.find((t) => t.slug === s))
  .filter((t): t is Tool => !!t && t.status === "live");

/** A few sample tools per category for the homepage category overview. */
export function sampleTools(id: CategoryId, n = 4): Tool[] {
  return TOOLS.filter((t) => t.category === id && t.status === "live").slice(0, n);
}
export function liveCountByCategory(id: CategoryId): number {
  return TOOLS.filter((t) => t.category === id && t.status === "live").length;
}

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getCategory(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function toolsByCategory(id: CategoryId): Tool[] {
  return TOOLS.filter((t) => t.category === id);
}

/** The self-contained "quick answer" for a tool (falls back to its description). */
export function toolAnswer(tool: Tool): string {
  return tool.answer ?? tool.description;
}

/** ISO date this tool was last reviewed (falls back to the site-wide date). */
export function toolUpdated(tool: Tool): string {
  return tool.updated ?? LAST_REVIEWED;
}

/** Related tools for internal linking: explicit `related` slugs first (may
 *  cross categories), then filled out with other live tools in the same category. */
export function relatedTools(tool: Tool, limit = 4): Tool[] {
  const out: Tool[] = [];
  const seen = new Set<string>([tool.slug]);
  for (const slug of tool.related ?? []) {
    const t = getTool(slug);
    if (t && t.status === "live" && !seen.has(t.slug)) { out.push(t); seen.add(t.slug); }
  }
  for (const t of TOOLS) {
    if (out.length >= limit) break;
    if (t.category === tool.category && t.status === "live" && !seen.has(t.slug)) {
      out.push(t);
      seen.add(t.slug);
    }
  }
  return out.slice(0, limit);
}

/** Tools grouped A-Z by first letter, sorted — powers the index page. */
export function toolsAtoZ(): Record<string, Tool[]> {
  const groups: Record<string, Tool[]> = {};
  for (const t of [...TOOLS].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = t.name[0].toUpperCase();
    (groups[letter] ??= []).push(t);
  }
  return groups;
}
