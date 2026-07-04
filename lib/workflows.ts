// ─────────────────────────────────────────────────────────────────────────
// Workflows — named, guided multi-step chains. Each step opens a tool with the
// previous step's output auto-carried (via handoff) and pre-configured params.
// This is a guided chain, not a new execution engine: the user still runs each
// tool, but never re-uploads and never has to find the next tool.
// Each workflow is also a static /workflows/<slug> SEO page.
// ─────────────────────────────────────────────────────────────────────────

import type { Faq } from "./tools";

export interface WorkflowStep {
  tool: string;                     // tool slug for this step
  params?: Record<string, string>;  // preset params passed via ?query (e.g. { kb: "100" })
  note: string;                     // what happens at this step
}

export interface Workflow {
  slug: string;
  name: string;
  description: string;   // meta description + card subtitle
  intro: string;         // on-page lead paragraph
  answer: string;        // extractable quick answer
  steps: WorkflowStep[];
  faqs: Faq[];
}

export const WORKFLOWS: Workflow[] = [
  {
    slug: "job-application-pdf",
    name: "Photos → job-application PDF (under 100 KB)",
    description: "Turn photos of a document into a single PDF, then compress it to under 100 KB — the exact combo job portals and exam forms ask for. Free, in your browser.",
    answer: "To make a job-application PDF under 100 KB: combine your images into one PDF with JPG to PDF, then open Compress PDF pre-set to a 100 KB target. Your files are carried between the two steps automatically and never uploaded.",
    intro: "Many job portals and exam forms want a single PDF under a strict size limit. This workflow combines your photos or scans into one PDF, then compresses that PDF to under 100 KB — carrying the file from step to step so you never re-upload.",
    steps: [
      { tool: "jpg-to-pdf", note: "Combine your photos or scans into a single PDF." },
      { tool: "compress-pdf", params: { kb: "100" }, note: "Compress that PDF to under 100 KB, ready to upload." },
    ],
    faqs: [
      { q: "Why under 100 KB?", a: "Government and job-portal upload fields often cap documents at 100 KB. This workflow targets that limit automatically in the second step." },
      { q: "Do my files get uploaded?", a: "No. Both steps run entirely in your browser, and the file is passed between them in memory — nothing is sent to a server." },
    ],
  },
  {
    slug: "iphone-photos-to-pdf",
    name: "iPhone (HEIC) photos → A4 PDF",
    description: "Convert iPhone HEIC photos to JPG, resize them to A4, and combine into one PDF — all in your browser, no uploads. Perfect for printing or sharing.",
    answer: "To turn iPhone HEIC photos into a PDF: convert HEIC to JPG, resize the images to A4, then combine them into a single PDF. Each step hands the file to the next automatically, and nothing leaves your device.",
    intro: "iPhone photos are saved as HEIC, which many sites and printers can't open, and they're rarely page-sized. This workflow converts HEIC to JPG, resizes to A4, and combines everything into one PDF — no re-uploading between steps.",
    steps: [
      { tool: "heic-to-jpg", note: "Convert your HEIC photo to a widely-supported JPG." },
      { tool: "resize-image", params: { w: "2480", h: "3508" }, note: "Resize it to A4 at 300 DPI." },
      { tool: "jpg-to-pdf", note: "Combine into a single, printable PDF." },
    ],
    faqs: [
      { q: "What is HEIC?", a: "HEIC is the high-efficiency format iPhones use for photos. It saves space but isn't supported everywhere, so converting to JPG makes the photo universally openable." },
      { q: "Is anything uploaded?", a: "No — HEIC decoding, resizing and PDF creation all happen locally in your browser." },
    ],
  },
  {
    slug: "clean-photo-for-web",
    name: "Product photo → clean, web-ready image",
    description: "Remove a photo's background, resize it, and compress it for the web — a three-step image workflow that runs entirely in your browser, no uploads.",
    answer: "To make a clean web-ready product photo: remove the background, resize to your target dimensions, then compress for fast loading. The image is carried through all three steps automatically and never uploaded.",
    intro: "Great product and profile images are cut out, correctly sized and light enough to load fast. This workflow removes the background, resizes, and compresses — passing the image from step to step so you never re-upload.",
    steps: [
      { tool: "background-remover", note: "Cut out the background to a transparent PNG." },
      { tool: "resize-image", params: { w: "1080", h: "1080" }, note: "Resize to a square 1080×1080." },
      { tool: "compress-image", note: "Compress it for fast web loading." },
    ],
    faqs: [
      { q: "Does background removal run on a server?", a: "No — it uses an AI model that runs on your device via WebAssembly, so your image never leaves your browser." },
      { q: "Can I change the size?", a: "Yes. The resize step opens at 1080×1080 but you can set any dimensions before continuing." },
    ],
  },
  {
    slug: "video-to-social-clip",
    name: "Video → trimmed social GIF",
    description: "Trim a video to the part you want, then turn it into a shareable GIF — a two-step media workflow that runs in your browser with no uploads.",
    answer: "To turn a video into a social GIF: trim it to the clip you want, then convert that clip to a GIF. The trimmed video is handed to the GIF step automatically, and everything runs in your browser.",
    intro: "Short looping GIFs are perfect for social posts and chat. This workflow trims your video to the moment you want, then converts just that clip into a GIF — no re-uploading between steps.",
    steps: [
      { tool: "trim-video", note: "Trim the video down to the clip you want." },
      { tool: "video-to-gif", note: "Convert that clip into a shareable GIF." },
    ],
    faqs: [
      { q: "Is there a length limit?", a: "GIFs get large quickly, so short clips (a few seconds) work best. Trimming first keeps the GIF small and shareable." },
      { q: "Are my videos uploaded?", a: "No — trimming and GIF conversion both run in your browser via ffmpeg.wasm." },
    ],
  },
  {
    slug: "scan-to-searchable-text",
    name: "Scan or screenshot → editable text",
    description: "Pull the text out of a scanned document or screenshot with in-browser OCR — free, private, no uploads. Copy or download the extracted text.",
    answer: "To get editable text from a scan or screenshot, open Image to Text (OCR): it reads the text on your device and lets you copy or download it. Nothing is uploaded.",
    intro: "Need the words out of a screenshot, receipt or scanned page? This workflow runs optical character recognition (OCR) in your browser to extract the text, which you can then copy or download.",
    steps: [
      { tool: "image-to-text", note: "Extract the text from your image with on-device OCR, then copy or download it." },
    ],
    faqs: [
      { q: "Does OCR upload my image?", a: "No — text recognition runs entirely in your browser using Tesseract compiled to WebAssembly." },
      { q: "Which languages work?", a: "It works best with clear, printed English text; results vary with handwriting and low-quality scans." },
    ],
  },
  {
    slug: "email-ready-photos",
    name: "Photos → email-ready (under 200 KB each)",
    description: "Compress photos to under 200 KB each so they attach and send easily — in your browser, in one batch, no uploads.",
    answer: "To make photos email-ready, open Compress Image pre-set to a 200 KB target and add your photos (one or many at once). Each is compressed to under 200 KB and downloadable individually or as a zip. Nothing is uploaded.",
    intro: "Modern phone photos are often too big to email comfortably. This workflow opens the image compressor pre-set to a 200 KB target, where you can compress one photo or a whole batch at once.",
    steps: [
      { tool: "compress-image", params: { kb: "200" }, note: "Compress each photo to under 200 KB — add several to do them in one batch." },
    ],
    faqs: [
      { q: "Can I do many photos at once?", a: "Yes — select multiple photos and each is compressed to the target, then offered individually or as a single zip." },
      { q: "Are my photos uploaded?", a: "No — compression runs entirely in your browser." },
    ],
  },
];

export function getWorkflow(slug: string): Workflow | undefined {
  return WORKFLOWS.find((w) => w.slug === slug);
}
