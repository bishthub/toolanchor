// ─────────────────────────────────────────────────────────────────────────
// Programmatic "how to [task]" guides — long-tail SEO content, each pointing
// to the tool that does the job. Data-driven so pages, list, sitemap and
// internal links all generate from this array.
// ─────────────────────────────────────────────────────────────────────────

export interface GuideSection { h2: string; body: string; }
export interface Guide {
  slug: string;
  title: string;        // <h1> / <title> — the search query, e.g. "How to compress a PDF"
  description: string;  // meta description
  keywords: string[];
  toolSlug: string;     // the tool this guide drives traffic to
  intro: string;
  steps: string[];
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
  related: string[];    // other tool slugs
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
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
