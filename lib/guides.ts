// ─────────────────────────────────────────────────────────────────────────
// Programmatic "how to [task]" guides — long-tail SEO content, each pointing
// to the tool that does the job. Data-driven so pages, list, sitemap and
// internal links all generate from this array.
// ─────────────────────────────────────────────────────────────────────────

import { LAST_REVIEWED } from "./site";

export interface GuideSection { h2: string; body: string; }
export interface Guide {
  slug: string;
  title: string;        // <h1> / <title> — the search query, e.g. "How to compress a PDF"
  description: string;  // meta description
  keywords: string[];
  toolSlug: string;     // the tool this guide drives traffic to
  intro: string;
  answer?: string;      // 40–60 word self-contained answer callout (falls back to description)
  steps: string[];
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
  related: string[];    // other tool slugs
  updated?: string;     // ISO yyyy-mm-dd last reviewed (falls back to LAST_REVIEWED)
  sources?: { label: string; url: string }[]; // authoritative references (GEO/E-E-A-T)
}

export const GUIDES: Guide[] = [
  {
    slug: "how-to-compress-a-pdf",
    title: "How to Compress a PDF (Free, Without Uploading)",
    description: "Compress a PDF to a smaller file size for free, right in your browser — no uploads, no watermark. Step-by-step guide.",
    keywords: ["how to compress a pdf", "reduce pdf size", "make pdf smaller", "compress pdf free"],
    toolSlug: "compress-pdf",
    intro: "Need to email or upload a PDF that's too large? You can shrink it in seconds without installing anything or uploading it to a server. Here's the fastest free way, entirely in your browser.",
    steps: [
      "Open the free Compress PDF tool.",
      "Choose your PDF file (it stays on your device).",
      "Pick a quality level — lower quality means a smaller file.",
      "Click Compress, then download the smaller PDF.",
    ],
    sections: [
      { h2: "Why is my PDF so big?", body: "PDFs balloon when they contain high-resolution scanned pages or images. Re-rendering each page at a sensible resolution and re-compressing the images is what shrinks the file — often by 50–80% for scan-heavy documents." },
      { h2: "Will compressing lose quality?", body: "There's always a trade-off between size and clarity. Start around 60% quality; if text or images look soft, nudge the quality up and re-export. For documents you need to keep fully sharp and selectable, keep a copy of the original." },
      { h2: "Is it safe to compress PDFs online?", body: "With most online compressors your file is uploaded to their servers. This tool is different — it compresses locally in your browser, so your document never leaves your device." },
    ],
    faqs: [
      { q: "Is it really free?", a: "Yes — no sign-up, no watermark, no file-size paywall." },
      { q: "Does the text stay selectable?", a: "This method rasterises pages, so text becomes part of the image. If you need selectable text, keep the original or use the PDF to Text tool first." },
    ],
    related: ["merge-pdf", "split-pdf", "pdf-to-images"],
  },
  {
    slug: "how-to-merge-pdf-files",
    title: "How to Merge PDF Files Into One (Free)",
    description: "Combine multiple PDFs into a single document for free, in your browser, in the order you choose. No uploads.",
    keywords: ["how to merge pdf", "combine pdf files", "join pdfs", "merge pdf free"],
    toolSlug: "merge-pdf",
    intro: "Combining several PDFs into one file is one of the most common document tasks. You can do it in seconds, for free, without uploading anything.",
    steps: [
      "Open the free Merge PDF tool.",
      "Add two or more PDF files.",
      "Drag to reorder them into the sequence you want.",
      "Click Merge and download the combined PDF.",
    ],
    sections: [
      { h2: "Can I choose the page order?", body: "Yes — reorder the files before merging so pages appear exactly where you want them. To rearrange individual pages, split the PDF first, then merge the pieces." },
      { h2: "Is there a file limit?", body: "There's no artificial limit — you're only bounded by your device's memory. Very large scanned files may take a moment to process." },
    ],
    faqs: [
      { q: "Are my files uploaded?", a: "No. The merge happens in your browser; your PDFs never leave your device." },
      { q: "Is it free with no watermark?", a: "Yes — completely free, no watermark, no sign-up." },
    ],
    related: ["split-pdf", "compress-pdf", "jpg-to-pdf"],
  },
  {
    slug: "how-to-remove-image-background-free",
    title: "How to Remove the Background From an Image (Free)",
    description: "Remove an image background automatically and get a transparent PNG — free, private, in your browser. No upload required.",
    keywords: ["how to remove background from image", "remove background free", "transparent background", "remove bg"],
    toolSlug: "background-remover",
    intro: "Whether it's a product photo or a profile picture, you can cut out the background automatically and download a transparent PNG — free and without uploading your image.",
    steps: [
      "Open the free Background Remover.",
      "Choose your image (it's processed on your device).",
      "Wait a moment while the AI model separates the subject.",
      "Download your transparent PNG.",
    ],
    sections: [
      { h2: "How does automatic background removal work?", body: "An AI segmentation model identifies the main subject and masks everything else. Here it runs fully in your browser via WebAssembly, so the image is never uploaded — the model downloads once on first use, then it's cached." },
      { h2: "Tips for the cleanest cut-out", body: "Good contrast between subject and background gives the best edges. Busy or low-contrast backgrounds can leave stray pixels — a well-lit photo with a clear subject works best." },
    ],
    faqs: [
      { q: "Is it free and unlimited?", a: "Yes — no sign-up and no per-image charge, unlike most online background removers." },
      { q: "Is my photo uploaded?", a: "No. The model runs locally in your browser." },
    ],
    related: ["compress-image", "resize-image", "image-to-text"],
  },
  {
    slug: "how-to-extract-text-from-an-image",
    title: "How to Extract Text From an Image (Free OCR)",
    description: "Pull the text out of a photo or screenshot with free OCR that runs in your browser. No upload, copy the result instantly.",
    keywords: ["extract text from image", "image to text", "ocr free", "screenshot to text"],
    toolSlug: "image-to-text",
    intro: "Optical character recognition (OCR) turns a picture of text into editable text. You can do it free, in your browser, without sending your image anywhere.",
    steps: [
      "Open the free Image to Text (OCR) tool.",
      "Choose an image or screenshot containing text.",
      "Wait for recognition (the OCR engine loads on first use).",
      "Copy the extracted text.",
    ],
    sections: [
      { h2: "What makes OCR accurate?", body: "Clear, high-contrast, straight images work best. Blurry photos, unusual fonts or heavy backgrounds reduce accuracy. For documents, a flat, well-lit scan gives the cleanest result." },
      { h2: "Does it work offline?", body: "After the recognition engine downloads once, it's cached — so repeat use is fast and private, with nothing uploaded." },
    ],
    faqs: [
      { q: "Which languages are supported?", a: "This tool recognises English. Clear images give the best results." },
      { q: "Is my image uploaded?", a: "No — OCR runs locally in your browser." },
    ],
    related: ["pdf-to-text", "image-metadata-viewer", "background-remover"],
    sources: [
      { label: "Optical character recognition — Wikipedia", url: "https://en.wikipedia.org/wiki/Optical_character_recognition" },
      { label: "Tesseract OCR engine (open source)", url: "https://github.com/tesseract-ocr/tesseract" },
    ],
  },
  {
    slug: "how-to-resize-an-image",
    title: "How to Resize an Image to Exact Dimensions (Free)",
    description: "Resize any image to exact pixel dimensions for free, in your browser — perfect for social posts and avatars. No upload.",
    keywords: ["how to resize an image", "resize image", "change image size", "resize photo online"],
    toolSlug: "resize-image",
    intro: "Need an image at a specific size for a social post, avatar or thumbnail? Resize it to exact dimensions in seconds, free and privately.",
    steps: [
      "Open the free Resize Image tool.",
      "Choose your image.",
      "Enter a new width or height (lock the ratio to keep proportions).",
      "Download the resized image.",
    ],
    sections: [
      { h2: "Should I keep the aspect ratio?", body: "Usually yes — locking the ratio prevents stretching. Unlock it only when you need an exact non-proportional size and don't mind distortion." },
      { h2: "Common sizes", body: "Instagram square is 1080×1080, Full HD is 1920×1080, and a typical avatar is 400×400. Enter the exact numbers you need." },
    ],
    faqs: [
      { q: "Will resizing reduce quality?", a: "Downscaling stays crisp; upscaling beyond the original can look soft." },
      { q: "Is my photo uploaded?", a: "No — resizing runs in your browser." },
    ],
    related: ["compress-image", "crop-image", "jpg-to-png"],
  },
  {
    slug: "how-to-convert-images-to-pdf",
    title: "How to Convert JPG or PNG Images to PDF (Free)",
    description: "Turn one or more images into a single PDF for free, in your browser, in the order you choose. No upload.",
    keywords: ["how to convert jpg to pdf", "images to pdf", "png to pdf", "photos to pdf"],
    toolSlug: "jpg-to-pdf",
    intro: "Combining photos or scans into a single PDF makes them easy to share and print. Here's how to do it free, without uploading your images.",
    steps: [
      "Open the free JPG to PDF tool.",
      "Add your images (JPG, PNG or WebP).",
      "Reorder them if needed.",
      "Click Create PDF and download.",
    ],
    sections: [
      { h2: "Does image quality drop?", body: "No — images are embedded at their original resolution, so the PDF looks exactly like your photos." },
      { h2: "Great for receipts and scans", body: "Snap photos of receipts or documents, drop them in, and get one tidy PDF to email or file." },
    ],
    faqs: [
      { q: "Which formats are supported?", a: "JPG and PNG are embedded directly; other formats are auto-converted in the browser." },
      { q: "Are my images uploaded?", a: "No — the PDF is built locally in your browser." },
    ],
    related: ["merge-pdf", "compress-pdf", "pdf-to-images"],
  },
  {
    slug: "how-to-check-if-text-is-ai-generated",
    title: "How to Check if Text Was Written by AI (Free)",
    description: "Estimate whether text is AI-generated with a free detector that analyses writing patterns in your browser. Honest about its limits.",
    keywords: ["how to check if text is ai generated", "ai detector free", "chatgpt detector", "is this ai written"],
    toolSlug: "ai-content-detector",
    intro: "AI detectors estimate how likely a piece of text was machine-written. No detector is perfect, but a good one can flag the tell-tale patterns of AI writing. Here's how to check for free.",
    steps: [
      "Open the free AI Content Detector.",
      "Paste the text (40+ words for the quick check).",
      "Read the AI-likelihood score and the signals behind it.",
      "Optionally run the deeper AI-powered analysis for a blended score.",
    ],
    sections: [
      { h2: "What signals reveal AI writing?", body: "AI text tends to have uniform sentence length (low 'burstiness'), few contractions, repetitive structure and over-used phrases like 'it's important to note' and 'plays a crucial role'. The tool scores these patterns." },
      { h2: "Important: detectors aren't proof", body: "Every AI detector — free or paid — produces false positives, and human writing can look 'AI-like'. Treat the score as a guide, never as sole evidence to accuse someone of cheating." },
    ],
    faqs: [
      { q: "Is it accurate?", a: "It's a heuristic indicator, not proof. Use it as one signal alongside your own judgement." },
      { q: "Is my text uploaded?", a: "The quick check runs entirely in your browser. The optional deep analysis sends text to AI models and is clearly labelled." },
    ],
    related: ["ai-image-checker", "word-counter", "paraphrasing-tool"],
  },
  {
    slug: "how-to-remove-metadata-from-photos",
    title: "How to Remove Metadata (EXIF & GPS) From Photos",
    description: "Strip hidden EXIF data and GPS location from a photo before sharing it — free, in your browser. Protect your privacy.",
    keywords: ["remove metadata from photo", "remove exif", "remove gps from photo", "strip photo location"],
    toolSlug: "image-metadata-remover",
    intro: "Photos quietly store metadata — camera details, timestamps and often your GPS location. Before posting or sending an image, here's how to strip all of it for free.",
    steps: [
      "Open the free Image Metadata Remover.",
      "Choose your photo — it shows what metadata is present.",
      "Pick an output format (PNG or JPG).",
      "Download the clean, metadata-free copy.",
    ],
    sections: [
      { h2: "Why does metadata matter?", body: "A photo's EXIF can reveal exactly where and when it was taken. Sharing it can unintentionally expose your home or location. Removing metadata protects your privacy." },
      { h2: "See what's hidden first", body: "Use the Image Metadata Viewer to inspect a photo's EXIF and GPS before you strip it, so you know what you're removing." },
    ],
    faqs: [
      { q: "What gets removed?", a: "All EXIF/metadata — camera info, timestamps, GPS and embedded thumbnails — by re-encoding the image fresh." },
      { q: "Is my photo uploaded?", a: "No — stripping happens locally in your browser." },
    ],
    related: ["image-metadata-viewer", "compress-image", "resize-image"],
    sources: [
      { label: "Exif (Exchangeable image file format) — Wikipedia", url: "https://en.wikipedia.org/wiki/Exif" },
      { label: "Geotagging & photo metadata privacy — Wikipedia", url: "https://en.wikipedia.org/wiki/Geotagged_photograph" },
    ],
  },
  {
    slug: "how-to-create-a-qr-code",
    title: "How to Create a QR Code for Free",
    description: "Make a scannable QR code from any link or text and download it as a PNG — free, in your browser, no sign-up.",
    keywords: ["how to create a qr code", "qr code generator free", "make a qr code", "url to qr code"],
    toolSlug: "qr-code-generator",
    intro: "QR codes turn a link or text into something anyone can scan with a phone camera. Here's how to make one for free and download it in seconds.",
    steps: [
      "Open the free QR Code Generator.",
      "Type or paste your URL or text.",
      "Adjust the size if needed.",
      "Download the QR code as a PNG.",
    ],
    sections: [
      { h2: "What can a QR code contain?", body: "Any text — a website link, plain text, an email address, a phone number or Wi-Fi details. Links are the most common use." },
      { h2: "Static vs dynamic QR codes", body: "These are static codes: the data is baked into the image, so they never expire and don't depend on any server. Dynamic codes (editable, trackable) require a paid service." },
    ],
    faqs: [
      { q: "Do these QR codes expire?", a: "No — static QR codes work forever." },
      { q: "Is it free?", a: "Yes, free and watermark-free." },
    ],
    related: ["barcode-generator", "color-converter", "image-to-base64"],
    sources: [
      { label: "QR code — Wikipedia", url: "https://en.wikipedia.org/wiki/QR_code" },
      { label: "ISO/IEC 18004 (QR code specification)", url: "https://www.iso.org/standard/62021.html" },
    ],
  },
  {
    slug: "how-to-count-words-in-an-essay",
    title: "How to Count Words and Characters in Text",
    description: "Count words, characters, sentences and reading time instantly and privately with a free word counter. No sign-up.",
    keywords: ["how to count words", "word counter", "character counter", "word count tool"],
    toolSlug: "word-counter",
    intro: "Whether you're hitting an essay target or a social-media character limit, a word counter gives you live counts as you type — free and private.",
    steps: [
      "Open the free Word Counter.",
      "Type or paste your text.",
      "Read the live word, character, sentence and paragraph counts.",
      "Use the reading-time estimate for content planning.",
    ],
    sections: [
      { h2: "Words vs characters", body: "Essays usually have word targets; social platforms and meta descriptions have character limits. The tool shows both, including characters with and without spaces." },
      { h2: "Reading time", body: "Reading time is estimated at ~200 words per minute — handy for gauging article length." },
    ],
    faqs: [
      { q: "Is my text stored?", a: "No — counting happens entirely in your browser." },
      { q: "Does it count characters without spaces?", a: "Yes, both totals are shown." },
    ],
    related: ["case-converter", "word-frequency-counter", "remove-line-breaks"],
    sources: [
      { label: "Words per minute (reading speed) — Wikipedia", url: "https://en.wikipedia.org/wiki/Words_per_minute" },
    ],
  },
  {
    slug: "how-to-decode-a-jwt",
    title: "How to Decode a JWT (JSON Web Token)",
    description: "Decode a JSON Web Token to read its header and payload claims — free, in your browser, with no token uploaded. What each part means.",
    keywords: ["how to decode a jwt", "decode json web token", "read jwt payload", "jwt decoder"],
    toolSlug: "jwt-decoder",
    answer: "A JWT has three Base64url-encoded parts separated by dots — header.payload.signature. To decode one, paste it into a JWT decoder: it Base64url-decodes the header and payload into readable JSON so you can inspect claims like exp (expiry), iat (issued-at) and iss (issuer). Decoding never needs the signing key; verifying the signature does.",
    intro: "A JSON Web Token looks like random text, but two of its three parts are just Base64url-encoded JSON you can read instantly. Here's how to decode one safely, without sending it anywhere.",
    steps: [
      "Open the free JWT Decoder.",
      "Paste your token (the header.payload.signature string).",
      "Read the decoded header and payload JSON.",
      "Check claims like exp, iat and iss to understand the token.",
    ],
    sections: [
      { h2: "What are the three parts of a JWT?", body: "A JWT is header.payload.signature. The header names the signing algorithm (e.g. HS256), the payload carries the claims (data), and the signature proves the token wasn't altered. Only the signature needs a secret key — the header and payload are readable by anyone." },
      { h2: "Is decoding a JWT the same as verifying it?", body: "No. Decoding just reads the Base64url content and requires no key. Verifying checks the signature against the issuer's secret or public key to confirm authenticity. This tool decodes only, on purpose, so it's safe to paste sensitive tokens — nothing is uploaded." },
    ],
    faqs: [
      { q: "Is it safe to paste a token here?", a: "Yes — decoding runs entirely in your browser and the token is never sent to a server. Still, avoid pasting live production tokens into any online tool as a general habit." },
      { q: "Why can anyone read the payload?", a: "A JWT is signed, not encrypted, by default. The signature prevents tampering, but the payload is only Base64url-encoded — so never put secrets in it." },
    ],
    related: ["base64", "json-formatter", "hash-generator"],
    updated: "2026-07-01",
    sources: [
      { label: "RFC 7519 — JSON Web Token (JWT)", url: "https://datatracker.ietf.org/doc/html/rfc7519" },
      { label: "JSON Web Token — Wikipedia", url: "https://en.wikipedia.org/wiki/JSON_Web_Token" },
    ],
  },
  {
    slug: "how-to-convert-json-to-csv",
    title: "How to Convert JSON to CSV (Free)",
    description: "Turn a JSON array of objects into a clean CSV spreadsheet for free, in your browser — no upload. Handles nested keys and headers.",
    keywords: ["how to convert json to csv", "json to csv", "json to excel", "json array to spreadsheet"],
    toolSlug: "json-to-csv",
    answer: "To convert JSON to CSV, your JSON should be an array of objects — each object becomes a row and each key becomes a column header. Paste it into a JSON-to-CSV converter and it flattens the objects into comma-separated rows you can open in Excel, Google Sheets or Numbers. This runs in your browser, so your data is never uploaded.",
    intro: "JSON is great for code but awkward in a spreadsheet. Converting an array of JSON objects to CSV gives you rows and columns you can open anywhere — here's the fast, private way.",
    steps: [
      "Open the free JSON to CSV tool.",
      "Paste a JSON array of objects.",
      "Let it map keys to column headers automatically.",
      "Copy or download the CSV and open it in your spreadsheet app.",
    ],
    sections: [
      { h2: "What JSON shape converts cleanly?", body: "An array of flat objects with consistent keys converts best — e.g. [{\"name\":\"Ada\",\"age\":36}, …]. Each object is a row; each key is a column. Deeply nested objects or arrays inside a field don't map neatly to a single cell, so flatten them first if you can." },
      { h2: "Will it open in Excel?", body: "Yes. CSV (comma-separated values) opens in Excel, Google Sheets, Numbers and most databases. If a field contains commas, it's wrapped in quotes automatically so columns stay aligned." },
    ],
    faqs: [
      { q: "Is my data uploaded?", a: "No — the conversion happens in your browser, so even sensitive data stays on your device." },
      { q: "Can I convert CSV back to JSON?", a: "Yes — use the CSV to JSON tool for the reverse direction." },
    ],
    related: ["csv-to-json", "json-formatter", "json-to-yaml"],
    updated: "2026-07-01",
  },
  {
    slug: "how-to-generate-a-strong-password",
    title: "How to Generate a Strong, Random Password",
    description: "Create a strong, random password you won't reuse — free, in your browser, using the secure Web Crypto API. What makes a password strong.",
    keywords: ["how to generate a strong password", "random password generator", "secure password", "strong password"],
    toolSlug: "password-generator",
    answer: "The strongest passwords are long and random, not clever. Use a generator that draws from the browser's cryptographically secure Web Crypto API and set at least 16 characters mixing upper- and lowercase letters, digits and symbols — that yields roughly 105 bits of entropy, far beyond brute-force reach. Use a unique password per account and store them in a password manager.",
    intro: "A strong password is long, random and unique to each account. Guessable patterns and reused passwords are what get accounts breached — here's how to generate one properly, in seconds.",
    steps: [
      "Open the free Password Generator.",
      "Set the length to 16 characters or more.",
      "Enable uppercase, lowercase, numbers and symbols.",
      "Copy the password and store it in your password manager.",
    ],
    sections: [
      { h2: "What actually makes a password strong?", body: "Length and randomness beat complexity rules. Each extra character multiplies the number of possibilities, so a long random string is far harder to crack than a short one with a few substitutions. Entropy — measured in bits — quantifies this; aim for 80+ bits, which a 16-character mixed password comfortably exceeds." },
      { h2: "Why use a generator instead of making one up?", body: "Humans pick predictable patterns (names, dates, keyboard walks) that attackers model. A generator using crypto.getRandomValues produces genuinely unpredictable output, so there's no pattern to exploit." },
    ],
    faqs: [
      { q: "Is the password sent anywhere?", a: "No — it's generated locally in your browser and never transmitted or stored." },
      { q: "How long should my password be?", a: "16+ characters for important accounts. Longer is stronger; a password manager means length costs you nothing." },
    ],
    related: ["hash-generator", "uuid-generator", "base64"],
    updated: "2026-07-01",
    sources: [
      { label: "Password strength — Wikipedia", url: "https://en.wikipedia.org/wiki/Password_strength" },
      { label: "NIST SP 800-63B — Digital Identity Guidelines", url: "https://pages.nist.gov/800-63-3/sp800-63b.html" },
    ],
  },
  {
    slug: "how-to-split-a-pdf",
    title: "How to Split a PDF (Extract Pages) for Free",
    description: "Extract specific pages or page ranges from a PDF into a new file — free, private, in your browser. No uploads, no sign-up.",
    keywords: ["how to split a pdf", "extract pdf pages", "separate pdf pages", "split pdf free"],
    toolSlug: "split-pdf",
    answer: "To split a PDF, open a splitter, choose your file, and type the pages or ranges you want to extract — for example 1-3, 5, 9-10. The tool builds a brand-new PDF containing only those pages, in that order. Because it runs in your browser, the document is never uploaded to a server.",
    intro: "Sometimes you only need a few pages out of a long PDF. Splitting extracts exactly the pages you choose into a fresh file — here's how, free and without uploading anything.",
    steps: [
      "Open the free Split PDF tool.",
      "Choose your PDF file.",
      "Enter the pages or ranges to extract, e.g. 1-3, 5, 9-10.",
      "Download the new PDF with just those pages.",
    ],
    sections: [
      { h2: "How do I specify pages?", body: "Use single page numbers and ranges separated by commas — like 1-3, 5, 9-10. The new PDF keeps the pages in the order you list them, so you can reorder while you extract." },
      { h2: "Is it private?", body: "Yes. Unlike most online PDF tools that upload your file, this splits the document locally in your browser, so nothing leaves your device." },
    ],
    faqs: [
      { q: "Can I split a large PDF?", a: "Yes — the only limit is your device's available memory." },
      { q: "Are my files uploaded?", a: "No, splitting happens entirely in your browser." },
    ],
    related: ["merge-pdf", "compress-pdf", "rotate-pdf"],
    updated: "2026-07-01",
  },
  {
    slug: "how-to-compress-an-image",
    title: "How to Compress an Image Without Losing Quality",
    description: "Shrink JPG and PNG file size with an adjustable quality slider — free, in your browser, no upload limits. Balance size and clarity.",
    keywords: ["how to compress an image", "compress jpg", "reduce image size", "image compressor free"],
    toolSlug: "compress-image",
    answer: "To compress an image, open a compressor, choose your JPG or PNG, and lower the quality slider until the file is small enough while the image still looks sharp — around 70–80% quality is usually a good balance for photos. The tool re-encodes the image in your browser, so nothing is uploaded and there are no file-size limits.",
    intro: "Large images slow down pages and bloat emails. Compressing trims the file size dramatically while keeping the picture looking good — here's how to control the trade-off yourself.",
    steps: [
      "Open the free Compress Image tool.",
      "Choose a JPG or PNG image.",
      "Drag the quality slider and watch the live size and preview.",
      "Download the smaller image.",
    ],
    sections: [
      { h2: "How much smaller can it get?", body: "Photos often shrink 60–80% at 70–80% quality with little visible difference, because JPEG discards detail the eye barely notices. Graphics with flat colour and text stay sharper as PNG. Try a couple of quality levels and compare." },
      { h2: "Lossy vs lossless", body: "JPEG compression is lossy — it trades some detail for much smaller files. PNG is lossless but larger. Pick JPEG for photographs and PNG for logos, screenshots and images with transparency." },
    ],
    faqs: [
      { q: "Is there a file or count limit?", a: "No — compress as many images as you like, at any size, with no upload cap." },
      { q: "Are my images uploaded?", a: "No, compression runs entirely in your browser." },
    ],
    related: ["resize-image", "jpg-to-png", "image-metadata-remover"],
    updated: "2026-07-01",
    sources: [
      { label: "JPEG — Wikipedia", url: "https://en.wikipedia.org/wiki/JPEG" },
    ],
  },
  {
    slug: "how-to-convert-hex-to-rgb",
    title: "How to Convert a HEX Color to RGB (and Back)",
    description: "Convert a HEX color code to RGB, HSL and back — free, in your browser. Understand how hex color notation maps to red, green and blue.",
    keywords: ["how to convert hex to rgb", "hex to rgb", "hex color to rgb", "convert color code"],
    toolSlug: "color-converter",
    answer: "A HEX color like #3B82F6 encodes red, green and blue as three pairs of hexadecimal digits: 3B = 59 red, 82 = 130 green, F6 = 246 blue, giving rgb(59, 130, 246). To convert, paste the hex code into a color converter and it outputs the RGB (and HSL) equivalents instantly. Each pair ranges from 00 (0) to FF (255).",
    intro: "HEX and RGB are just two ways of writing the same color. Converting between them is handy for CSS, design tools and APIs — here's how the notation works and how to convert in one click.",
    steps: [
      "Open the free Color Converter.",
      "Enter a HEX code like #3B82F6.",
      "Read the equivalent RGB and HSL values.",
      "Copy the format you need for your CSS or design tool.",
    ],
    sections: [
      { h2: "How does hex map to RGB?", body: "A six-digit hex color is three 2-digit hexadecimal numbers — red, green, blue — each from 00 to FF, i.e. 0 to 255. So #FF0000 is pure red rgb(255,0,0). A leading # is convention; the eight-digit form (#RRGGBBAA) adds an alpha channel." },
      { h2: "When to use HEX, RGB or HSL", body: "HEX is compact and common in CSS and design files. RGB is easy to compute with. HSL (hue, saturation, lightness) is the most intuitive for tweaking a color by hand — nudging lightness without touching the hue." },
    ],
    faqs: [
      { q: "Does it support alpha/transparency?", a: "Yes — 8-digit hex (#RRGGBBAA) and rgba() include an alpha channel for transparency." },
      { q: "Is anything uploaded?", a: "No — conversion is instant and entirely in your browser." },
    ],
    related: ["css-gradient-generator", "image-color-picker", "box-shadow-generator"],
    updated: "2026-07-01",
    sources: [
      { label: "Web colors — Wikipedia", url: "https://en.wikipedia.org/wiki/Web_colors" },
    ],
  },
  {
    slug: "how-to-generate-a-uuid",
    title: "How to Generate a UUID (v4)",
    description: "Generate a random UUID (v4) for free, in your browser — unique IDs for databases, keys and APIs. What a UUID is and when to use one.",
    keywords: ["how to generate a uuid", "uuid generator", "generate guid", "random uuid v4"],
    toolSlug: "uuid-generator",
    answer: "A UUID (universally unique identifier) is a 128-bit value written as 36 characters, like 550e8400-e29b-41d4-a716-446655440000. Version 4 UUIDs are random, so the odds of two ever colliding are astronomically small — ideal as database keys or API identifiers. To generate one, open a UUID generator and copy the value; it's created locally in your browser.",
    intro: "UUIDs give you unique identifiers without a central counter, so independent systems can create IDs that never clash. Here's how to generate a v4 UUID and when you'd want one.",
    steps: [
      "Open the free UUID Generator.",
      "Generate a random v4 UUID.",
      "Copy it (or generate several at once).",
      "Use it as a primary key, request ID or unique reference.",
    ],
    sections: [
      { h2: "What is a v4 UUID?", body: "A version-4 UUID is generated from random numbers (per RFC 9562, which supersedes RFC 4122). It's 128 bits — 122 of them random — so collisions are effectively impossible in practice, which is why they're safe to generate independently across many machines." },
      { h2: "When should I use a UUID?", body: "Use one when you need a unique ID without coordinating with a database sequence — distributed systems, offline-first apps, public identifiers you don't want to be guessable or enumerable, and merge-friendly keys." },
    ],
    faqs: [
      { q: "Can two UUIDs collide?", a: "In theory yes, but the probability for v4 is so small it's ignored in practice — you'd need to generate billions per second for many years." },
      { q: "Is it generated privately?", a: "Yes — the UUID is created in your browser and never sent anywhere." },
    ],
    related: ["password-generator", "hash-generator", "slug-generator"],
    updated: "2026-07-01",
    sources: [
      { label: "Universally unique identifier — Wikipedia", url: "https://en.wikipedia.org/wiki/Universally_unique_identifier" },
      { label: "RFC 9562 — UUID specification", url: "https://datatracker.ietf.org/doc/html/rfc9562" },
    ],
  },
  {
    slug: "how-to-convert-a-unix-timestamp",
    title: "How to Convert a Unix Timestamp to a Date",
    description: "Convert a Unix timestamp to a human-readable date and time (and back) — free, in your browser. What Unix time is and why it's used.",
    keywords: ["how to convert unix timestamp", "unix timestamp to date", "epoch to date", "convert epoch time"],
    toolSlug: "unix-timestamp-converter",
    answer: "A Unix timestamp counts the seconds since 00:00:00 UTC on 1 January 1970 (the 'epoch'). To convert one to a date, paste it into a timestamp converter — it turns, say, 1700000000 into its UTC and local date-time, and converts a date back to a timestamp. It all runs in your browser.",
    intro: "Unix timestamps are how computers store time — a single number of seconds since 1970. Converting to a readable date (and back) is a constant need in development and log-reading. Here's the quick way.",
    steps: [
      "Open the free Unix Timestamp Converter.",
      "Paste a timestamp (seconds or milliseconds).",
      "Read the UTC and local date and time.",
      "Or enter a date to get its timestamp.",
    ],
    sections: [
      { h2: "Seconds or milliseconds?", body: "Unix time is classically in seconds (10 digits for current dates), but JavaScript and many APIs use milliseconds (13 digits). If a converted date looks wildly wrong, you probably have the wrong unit — drop or add three digits." },
      { h2: "Why 1970?", body: "The 1 January 1970 epoch was chosen by early Unix developers as a convenient recent reference. Counting from a fixed point makes date arithmetic simple — subtract two timestamps to get the seconds between them." },
    ],
    faqs: [
      { q: "What time zone is the timestamp?", a: "A Unix timestamp is always UTC — it has no time zone. The converter shows both UTC and your local time for convenience." },
      { q: "Is anything uploaded?", a: "No — conversion is instant and local to your browser." },
    ],
    related: ["add-subtract-days", "date-difference-calculator", "time-duration-calculator"],
    updated: "2026-07-01",
    sources: [
      { label: "Unix time — Wikipedia", url: "https://en.wikipedia.org/wiki/Unix_time" },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** ISO date this guide was last reviewed (falls back to the site-wide date). */
export function guideUpdated(g: Guide): string {
  return g.updated ?? LAST_REVIEWED;
}
