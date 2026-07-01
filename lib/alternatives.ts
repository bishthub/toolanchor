// ─────────────────────────────────────────────────────────────────────────
// Competitor "alternative" pages — high-intent SEO ("free X alternative").
// Each maps a well-known tool to the ToolAnchor tools that replace it, with an
// honest comparison. Data-driven → pages/list/sitemap generate from here.
// ─────────────────────────────────────────────────────────────────────────

export interface CompareRow { feature: string; us: string; them: string; }
export interface Alternative {
  slug: string;          // e.g. "ilovepdf-alternative"
  competitor: string;    // "iLovePDF"
  title: string;         // <h1>/<title>
  description: string;
  keywords: string[];
  intro: string;
  toolSlugs: string[];   // our matching tools
  comparison: CompareRow[];
  whyUs: string[];
  faqs: { q: string; a: string }[];
}

const PRIVACY_ROW: CompareRow = { feature: "Privacy", us: "Runs in your browser — files never uploaded", them: "Files uploaded to their servers" };
const PRICE_ROW: CompareRow = { feature: "Price", us: "100% free, no limits", them: "Freemium — free tier is limited" };
const SIGNUP_ROW: CompareRow = { feature: "Sign-up", us: "None", them: "Account needed for full features" };

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "ilovepdf-alternative",
    competitor: "iLovePDF",
    title: "Free iLovePDF Alternative — No Uploads, No Sign-up",
    description: "A free iLovePDF alternative for merging, splitting, rotating and compressing PDFs — entirely in your browser, with no uploads and no account.",
    keywords: ["ilovepdf alternative", "free ilovepdf alternative", "ilovepdf without upload", "pdf tools free"],
    intro: "iLovePDF is a popular PDF suite, but it uploads your files and gates heavier use behind a paid plan. ToolAnchor offers the everyday PDF tools free, with everything processed locally in your browser.",
    toolSlugs: ["merge-pdf", "split-pdf", "rotate-pdf", "compress-pdf", "jpg-to-pdf", "pdf-to-images", "pdf-to-text"],
    comparison: [
      PRIVACY_ROW, PRICE_ROW, SIGNUP_ROW,
      { feature: "Daily task limits", us: "None", them: "Free tier caps tasks/day" },
      { feature: "Watermark", us: "Never", them: "Free tier can add limits" },
    ],
    whyUs: [
      "Your documents never leave your device — a real privacy win for sensitive files.",
      "No task-per-day limits or file-size paywalls on the in-browser tools.",
      "No account, no email, no upsell.",
    ],
    faqs: [
      { q: "Is ToolAnchor really free?", a: "Yes — the PDF tools are free with no sign-up and no daily limits." },
      { q: "Can it merge and compress PDFs like iLovePDF?", a: "Yes — merge, split, rotate, compress, images-to-PDF and PDF-to-text are all covered, in your browser." },
    ],
  },
  {
    slug: "smallpdf-alternative",
    competitor: "Smallpdf",
    title: "Free Smallpdf Alternative — Private, In-browser PDF Tools",
    description: "A free Smallpdf alternative for PDF merging, compression and conversion that runs in your browser with no uploads and no subscription.",
    keywords: ["smallpdf alternative", "free smallpdf alternative", "smallpdf without subscription", "private pdf tools"],
    intro: "Smallpdf is polished but subscription-driven, and it uploads your files. ToolAnchor gives you the core PDF tools free and private, processed entirely on your device.",
    toolSlugs: ["compress-pdf", "merge-pdf", "split-pdf", "rotate-pdf", "pdf-to-images", "pdf-to-text", "jpg-to-pdf"],
    comparison: [
      PRIVACY_ROW, PRICE_ROW, SIGNUP_ROW,
      { feature: "Free tier limits", us: "None", them: "Two free tasks/hour, then Pro" },
    ],
    whyUs: [
      "No paywall after a couple of tasks — use it as much as you like.",
      "Files stay on your device instead of being uploaded.",
      "No account required.",
    ],
    faqs: [
      { q: "Does it have a task limit like Smallpdf?", a: "No — the in-browser PDF tools have no hourly or daily task limits." },
      { q: "Are my PDFs uploaded?", a: "No, they're processed locally in your browser." },
    ],
  },
  {
    slug: "remove-bg-alternative",
    competitor: "remove.bg",
    title: "Free remove.bg Alternative — Remove Backgrounds In-browser",
    description: "A free remove.bg alternative that removes image backgrounds in your browser and gives you a full-resolution transparent PNG — no credits, no upload.",
    keywords: ["remove.bg alternative", "free remove bg alternative", "background remover free", "remove background no credits"],
    intro: "remove.bg works well but charges credits for full-resolution downloads and uploads your image. ToolAnchor's Background Remover runs the AI model in your browser and gives you the full-resolution PNG free.",
    toolSlugs: ["background-remover", "image-metadata-remover", "resize-image", "compress-image"],
    comparison: [
      PRIVACY_ROW,
      { feature: "Price", us: "Free, full resolution", them: "Credits for HD downloads" },
      SIGNUP_ROW,
      { feature: "Resolution", us: "Full resolution free", them: "Low-res free, HD paid" },
    ],
    whyUs: [
      "Full-resolution transparent PNG at no cost — no credit system.",
      "Your image is processed locally and never uploaded.",
      "No account or subscription.",
    ],
    faqs: [
      { q: "Do I need credits?", a: "No — downloads are free at full resolution." },
      { q: "Is my image uploaded?", a: "No, the AI model runs in your browser (it downloads once, then is cached)." },
    ],
  },
  {
    slug: "tinypng-alternative",
    competitor: "TinyPNG",
    title: "Free TinyPNG Alternative — Compress Images Privately",
    description: "A free TinyPNG alternative that compresses PNG and JPG images in your browser with no upload limits and no file-size caps.",
    keywords: ["tinypng alternative", "free tinypng alternative", "compress image free", "image compressor no limit"],
    intro: "TinyPNG is great but limits free uploads and processes images on its servers. ToolAnchor compresses images locally with an adjustable quality slider and no limits.",
    toolSlugs: ["compress-image", "resize-image", "jpg-to-png", "image-metadata-remover"],
    comparison: [
      PRIVACY_ROW,
      { feature: "Limits", us: "No upload count or size limit", them: "Free tier limits files/size" },
      { feature: "Control", us: "Adjustable quality slider", them: "Fixed automatic compression" },
      SIGNUP_ROW,
    ],
    whyUs: [
      "Compress as many images as you want, at any size.",
      "Choose your own quality/size trade-off with a live preview.",
      "Images never leave your browser.",
    ],
    faqs: [
      { q: "Is there a file limit?", a: "No — compress as many as you like, with no size cap." },
      { q: "Are my images uploaded?", a: "No, compression runs in your browser." },
    ],
  },
  {
    slug: "gptzero-alternative",
    competitor: "GPTZero",
    title: "Free GPTZero Alternative — AI Content Detector",
    description: "A free GPTZero alternative that estimates AI-written text in your browser, with an optional deeper AI-powered check. Honest about its limits.",
    keywords: ["gptzero alternative", "free ai detector", "ai content detector free", "chatgpt detector alternative"],
    intro: "GPTZero is a well-known AI detector but paywalls longer texts and higher limits. ToolAnchor's AI Content Detector gives you an instant private check for free, plus an optional deeper AI-powered analysis.",
    toolSlugs: ["ai-content-detector", "ai-image-checker", "word-counter"],
    comparison: [
      { feature: "Price", us: "Free quick check", them: "Word/scan limits on free tier" },
      { feature: "Privacy", us: "Quick check runs in your browser", them: "Text sent to their servers" },
      SIGNUP_ROW,
      { feature: "Honesty", us: "Clearly labelled as a heuristic", them: "Varies" },
    ],
    whyUs: [
      "Instant, private, in-browser scoring with a full signal breakdown.",
      "Optional deep analysis blends multiple AI models when you want more accuracy.",
      "We're upfront that no detector is proof — protecting you from false accusations.",
    ],
    faqs: [
      { q: "Is any AI detector accurate?", a: "No detector is fully reliable; all produce false positives. Use the score as a guide, not proof." },
      { q: "Is it free?", a: "Yes — the quick check is free and unlimited in your browser." },
    ],
  },
  {
    slug: "convertio-alternative",
    competitor: "Convertio",
    title: "Free Convertio Alternative — Convert Files In-browser",
    description: "A free Convertio alternative for image and PDF conversions that runs in your browser with no upload limits and no daily caps.",
    keywords: ["convertio alternative", "free file converter", "image converter no upload", "cloudconvert alternative"],
    intro: "Convertio and CloudConvert upload your files and cap free conversions per day. ToolAnchor converts common image and PDF formats locally, with no limits.",
    toolSlugs: ["jpg-to-png", "jpg-to-pdf", "pdf-to-images", "image-to-base64", "compress-image"],
    comparison: [
      PRIVACY_ROW,
      { feature: "Daily limits", us: "None", them: "Free tier caps conversions/day" },
      { feature: "File size", us: "Limited only by your device", them: "Free size caps" },
      SIGNUP_ROW,
    ],
    whyUs: [
      "Convert as many files as you want, no daily cap.",
      "Files stay on your device — nothing uploaded.",
      "No account or waiting queue.",
    ],
    faqs: [
      { q: "Which conversions are supported?", a: "Common image formats (JPG/PNG/WebP), images-to-PDF and PDF-to-images, plus more." },
      { q: "Are files uploaded?", a: "No — conversions happen in your browser." },
    ],
  },
  {
    slug: "qr-code-generator-alternative",
    competitor: "qr-code-generator.com",
    title: "Free QR Code Generator Alternative — No Sign-up",
    description: "A free QR code generator alternative with no sign-up and no expiring codes — create and download a QR code in your browser.",
    keywords: ["qr code generator alternative", "free qr code generator", "qr code no signup", "qr code that doesn't expire"],
    intro: "Many QR generators push you toward accounts and 'dynamic' codes that expire unless you pay. ToolAnchor makes permanent static QR codes free, instantly, in your browser.",
    toolSlugs: ["qr-code-generator", "barcode-generator", "color-converter"],
    comparison: [
      { feature: "Expiry", us: "Never — static codes", them: "Dynamic codes can expire without a plan" },
      PRICE_ROW, SIGNUP_ROW,
      { feature: "Watermark", us: "None", them: "Some add branding" },
    ],
    whyUs: [
      "Static QR codes that never expire and need no server.",
      "Free, no account, no watermark.",
      "Generated instantly in your browser.",
    ],
    faqs: [
      { q: "Will my QR code expire?", a: "No — static codes encode the data directly and work forever." },
      { q: "Is it free?", a: "Yes, with no sign-up." },
    ],
  },
];

export function getAlternative(slug: string): Alternative | undefined {
  return ALTERNATIVES.find((a) => a.slug === slug);
}
