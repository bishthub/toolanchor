// ─────────────────────────────────────────────────────────────────────────
// No-AI intent matching for the Tool Assistant.
// Given what the user typed (and any attached file), it scores every tool and
// returns the best match plus alternatives — using a curated synonym/verb map
// layered on top of each tool's existing keywords. Deterministic, instant,
// runs in the browser, no model required.
// ─────────────────────────────────────────────────────────────────────────

import { TOOLS, type Tool } from "./tools";

// Tools that can automatically load an attached file (have initialFiles support).
export const FILE_AUTOLOAD = new Set<string>([
  "compress-pdf", "merge-pdf", "split-pdf", "rotate-pdf", "pdf-to-text", "pdf-to-images",
  "compress-image", "resize-image", "background-remover", "image-to-text",
  "ai-image-checker", "image-metadata-viewer", "image-metadata-remover",
]);

// Extra natural-language phrases that should map strongly to a slug.
// (These supplement each tool's own `keywords`.)
const ALIASES: Record<string, string[]> = {
  "compress-pdf": ["compress pdf", "reduce pdf size", "shrink pdf", "make pdf smaller", "pdf too big", "lower pdf size"],
  "merge-pdf": ["merge pdf", "combine pdf", "join pdf", "put pdfs together", "merge documents", "combine documents"],
  "split-pdf": ["split pdf", "extract pages", "separate pdf", "get pages from pdf", "take pages out"],
  "rotate-pdf": ["rotate pdf", "turn pdf", "pdf is sideways", "fix pdf orientation", "pdf upside down"],
  "jpg-to-pdf": ["jpg to pdf", "image to pdf", "photos to pdf", "pictures to pdf", "make a pdf from images", "png to pdf"],
  "pdf-to-images": ["pdf to image", "pdf to jpg", "pdf to png", "convert pdf to image", "pdf pages as images"],
  "pdf-to-text": ["pdf to text", "extract text from pdf", "copy text from pdf", "get text out of pdf", "read pdf text"],
  "compress-image": ["compress image", "compress photo", "reduce image size", "shrink image", "make image smaller", "photo too big"],
  "resize-image": ["resize image", "resize photo", "change image size", "make image bigger", "scale image", "image dimensions"],
  "crop-image": ["crop image", "crop photo", "cut image", "trim image"],
  "jpg-to-png": ["convert image", "jpg to png", "png to jpg", "webp to jpg", "change image format", "heic to jpg"],
  "image-to-text": ["extract text from image", "read text from image", "ocr", "image to text", "screenshot to text", "photo to text"],
  "background-remover": ["remove background", "remove bg", "transparent background", "cut out background", "delete background", "background remover"],
  "image-to-base64": ["image to base64", "base64 image", "data uri image", "embed image"],
  "flip-image": ["flip image", "mirror image", "rotate image", "flip photo"],
  "watermark-image": ["add watermark", "watermark image", "watermark photo"],
  "favicon-generator": ["favicon", "site icon", "make favicon"],
  "meme-generator": ["meme", "make a meme", "caption image", "add text to image"],
  "word-counter": ["count words", "word count", "how many words", "character count"],
  "case-converter": ["change case", "uppercase", "lowercase", "title case", "capitalize"],
  "qr-code-generator": ["qr code", "make qr", "generate qr", "create qr code"],
  "password-generator": ["password", "generate password", "strong password", "random password"],
  "json-formatter": ["format json", "beautify json", "validate json", "prettify json"],
  "ai-content-detector": ["ai detector", "ai content detector", "detect ai", "is this ai", "ai checker", "chatgpt detector", "was this written by ai", "check if ai wrote"],
  "ai-image-checker": ["ai image detector", "is this image ai", "ai generated image", "detect ai image", "was this image made by ai", "check ai photo"],
  "image-metadata-viewer": ["image metadata", "exif viewer", "see exif", "view metadata", "photo metadata", "check exif", "gps from photo"],
  "image-metadata-remover": ["remove metadata", "remove exif", "strip metadata", "remove gps", "clear exif", "delete metadata", "remove location from photo"],
};

const STOP = new Set("a an the to my this that please can i want need help me with from of for into make do convert my our your it is".split(" "));

export interface Match { tool: Tool; score: number; }

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
}

function categoryForFile(file?: { type?: string; name?: string } | null): string | null {
  if (!file) return null;
  const t = (file.type || "").toLowerCase();
  const n = (file.name || "").toLowerCase();
  if (t.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (t.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic|svg)$/.test(n)) return "image";
  if (t.startsWith("text/") || /\.(txt|json|csv|md|yml|yaml|xml)$/.test(n)) return "developer";
  return null;
}

/** Rank tools for a typed query + optional attached file. Highest score first. */
export function matchTools(query: string, file?: { type?: string; name?: string } | null): Match[] {
  const q = query.toLowerCase().trim();
  const qTokens = new Set(tokenize(query));
  const fileCat = categoryForFile(file);

  const scored: Match[] = TOOLS.filter((t) => t.status === "live").map((tool) => {
    let score = 0;
    const aliases = ALIASES[tool.slug] ?? [];

    // 1) Strong: full alias phrase present in the query.
    for (const phrase of aliases) {
      if (q.includes(phrase)) score += 40 + phrase.split(" ").length * 6;
    }
    // 2) Strong: a tool keyword phrase present in the query.
    for (const kw of tool.keywords) {
      if (kw.length > 3 && q.includes(kw)) score += 18 + kw.split(" ").length * 4;
    }
    // 3) Token overlap with name + keywords + aliases.
    const blob = tokenize([tool.name, ...tool.keywords, ...aliases].join(" "));
    const blobSet = new Set(blob);
    for (const t of qTokens) if (blobSet.has(t)) score += 4;

    // 4) File-type nudge: matching category gets a boost (helps disambiguate
    //    "convert this" when a PDF vs an image is attached).
    if (fileCat && tool.category === fileCat) score += 7;

    return { tool, score };
  });

  return scored.filter((m) => m.score > 0).sort((a, b) => b.score - a.score);
}

export function bestMatches(query: string, file?: { type?: string; name?: string } | null, n = 4): Match[] {
  return matchTools(query, file).slice(0, n);
}
