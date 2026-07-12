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
  // Batch 8
  "heic-to-jpg", "webp-to-jpg", "jpg-to-webp", "png-to-webp", "avif-to-jpg",
  "pdf-page-numbers", "watermark-pdf", "organize-pdf",
  // Batch 9
  "mp4-to-mp3", "video-to-gif", "trim-video", "passport-photo-maker",
  // Multi-image → PDF (wired for the universal drop zone).
  "jpg-to-pdf",
  // Batch 10 — media + PDF gaps
  "compress-video", "mute-video", "audio-converter", "trim-audio", "delete-pdf-pages",
  "sign-pdf",
  // Batch 11 — generators + image (wave 2)
  "svg-to-png", "screenshot-beautifier", "collage-maker",
  // Batch 12 — PDF security + image upscaler
  "protect-pdf", "unlock-pdf", "image-upscaler",
]);

// Extra natural-language phrases that should map strongly to a slug.
// (These supplement each tool's own `keywords`.)
const ALIASES: Record<string, string[]> = {
  "compress-pdf": ["compress pdf", "reduce pdf size", "shrink pdf", "make pdf smaller", "pdf too big", "lower pdf size", "compress multiple pdfs", "bulk compress pdf", "batch compress pdf", "compress pdf to 100kb", "compress pdf to 200kb", "compress pdf to 50kb", "pdf under 100 kb", "reduce pdf to 100kb", "pdf size below 200kb", "compress pdf to 1mb", "compress pdf to 500kb"],
  "merge-pdf": ["merge pdf", "combine pdf", "join pdf", "put pdfs together", "merge documents", "combine documents"],
  "split-pdf": ["split pdf", "extract pages", "separate pdf", "get pages from pdf", "take pages out"],
  "rotate-pdf": ["rotate pdf", "turn pdf", "pdf is sideways", "fix pdf orientation", "pdf upside down"],
  "jpg-to-pdf": ["jpg to pdf", "image to pdf", "photos to pdf", "pictures to pdf", "make a pdf from images", "png to pdf"],
  "pdf-to-images": ["pdf to image", "pdf to jpg", "pdf to png", "convert pdf to image", "pdf pages as images"],
  "pdf-to-text": ["pdf to text", "extract text from pdf", "copy text from pdf", "get text out of pdf", "read pdf text"],
  "compress-image": ["compress image", "compress photo", "reduce image size", "shrink image", "make image smaller", "photo too big", "compress multiple images", "bulk compress images", "compress many photos at once", "compress image to 20kb", "compress image to 50kb", "compress image to 100kb", "reduce photo to 50kb", "image under 100 kb", "compress jpg to 20kb", "resize photo to 50 kb"],
  "resize-image": ["resize image", "resize photo", "change image size", "make image bigger", "scale image", "image dimensions", "bulk resize", "resize multiple images", "batch resize photos"],
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
  "image-metadata-remover": ["remove metadata", "remove exif", "strip metadata", "remove gps", "clear exif", "delete metadata", "remove location from photo", "strip metadata from multiple photos", "bulk remove exif"],
  // Batch 8
  "heic-to-jpg": ["heic to jpg", "heic to jpeg", "convert heic", "iphone photo to jpg", "heif to jpg", "open heic"],
  "webp-to-jpg": ["webp to jpg", "webp to jpeg", "convert webp", "open webp", "webp to png"],
  "jpg-to-webp": ["jpg to webp", "jpeg to webp", "convert to webp", "make webp", "image to webp"],
  "png-to-webp": ["png to webp", "convert png to webp", "shrink png webp"],
  "avif-to-jpg": ["avif to jpg", "avif to jpeg", "convert avif", "open avif"],
  "pdf-page-numbers": ["add page numbers to pdf", "number pdf pages", "pdf page numbers", "insert page numbers"],
  "watermark-pdf": ["watermark pdf", "add watermark to pdf", "stamp pdf", "mark pdf confidential"],
  "organize-pdf": ["reorder pdf pages", "organize pdf", "rearrange pdf", "rearrange pages", "change pdf page order"],
  "sip-calculator": ["sip calculator", "systematic investment plan", "mutual fund sip", "sip returns"],
  "fd-calculator": ["fd calculator", "fixed deposit calculator", "fd maturity", "fixed deposit interest"],
  "curl-converter": ["curl to fetch", "curl to python", "convert curl", "curl converter", "curl to javascript"],
  "json-to-typescript": ["json to typescript", "json to interface", "generate typescript types", "json to ts"],
  // Batch 9
  "mp4-to-mp3": ["mp4 to mp3", "video to mp3", "extract audio", "video to audio", "get audio from video", "convert video to mp3"],
  "video-to-gif": ["video to gif", "mp4 to gif", "make a gif", "gif from video", "convert video to gif"],
  "trim-video": ["trim video", "cut video", "shorten video", "video cutter", "crop video length"],
  "compress-video": ["compress video", "reduce video size", "make video smaller", "shrink video", "video too big", "compress mp4", "video compressor"],
  "mute-video": ["mute video", "remove audio from video", "silence video", "delete sound from video", "strip audio", "no sound video"],
  "audio-converter": ["convert audio", "audio converter", "m4a to mp3", "wav to mp3", "convert to wav", "ogg converter", "change audio format"],
  "trim-audio": ["trim audio", "cut audio", "audio cutter", "trim mp3", "cut mp3", "shorten audio", "make a ringtone"],
  "delete-pdf-pages": ["delete pdf pages", "delete pages", "remove pages", "remove pages from pdf", "delete page from pdf", "remove pdf page", "take out pdf pages", "delete pages in this pdf"],
  "sign-pdf": ["sign pdf", "add signature to pdf", "fill and sign pdf", "esign pdf", "e-sign document", "sign document online", "put signature on pdf"],
  "protect-pdf": ["protect pdf", "password protect pdf", "encrypt pdf", "add password to pdf", "lock pdf", "put a password on pdf"],
  "unlock-pdf": ["unlock pdf", "remove pdf password", "remove password from pdf", "decrypt pdf", "take password off pdf"],
  "image-upscaler": ["upscale image", "enlarge image", "make image bigger", "increase image resolution", "upscale photo"],
  "svg-to-png": ["svg to png", "convert svg to png", "svg to image", "rasterize svg", "export svg as png"],
  "screenshot-beautifier": ["beautify screenshot", "screenshot beautifier", "pretty screenshot", "add background to screenshot", "polish screenshot", "screenshot frame"],
  "collage-maker": ["collage maker", "photo collage", "make a collage", "combine photos", "picture collage", "photo grid"],
  "code-to-image": ["code to image", "code screenshot", "code snippet image", "share code image", "carbon", "beautiful code image"],
  "email-signature-generator": ["email signature", "email signature generator", "gmail signature", "outlook signature", "signature for email", "html email signature"],
  "invoice-generator": ["invoice generator", "create invoice", "make an invoice", "invoice maker", "invoice pdf", "gst invoice", "billing"],
  "voice-recorder": ["voice recorder", "record voice", "record audio", "audio recorder", "record my voice", "microphone recorder", "sound recorder"],
  "screen-recorder": ["screen recorder", "record screen", "record my screen", "screen capture", "capture screen video", "screen record"],
  "passport-photo-maker": ["passport photo", "passport size photo", "visa photo", "id photo", "passport picture"],
  "signature-generator": ["signature", "make a signature", "draw signature", "create signature", "e-signature", "sign document"],
  // Batches 18–19
  "png-to-jpg": ["png to jpg", "png to jpeg", "convert png to jpg"],
  "png-to-pdf": ["png to pdf", "convert png to pdf", "png images to pdf"],
  "pdf-to-jpg": ["pdf to jpg", "pdf to jpeg", "convert pdf to jpg", "pdf pages to jpg"],
  "html-to-pdf": ["html to pdf", "convert html to pdf", "save html as pdf", "webpage to pdf", "html file to pdf"],
  "due-date-calculator": ["due date", "pregnancy due date", "when is my baby due", "how many weeks pregnant", "gestational age"],
  "water-intake-calculator": ["water intake", "how much water should i drink", "daily water", "hydration calculator"],
  "paypal-fee-calculator": ["paypal fee", "paypal fees", "how much does paypal take", "paypal calculator"],
  "typing-speed-test": ["typing test", "typing speed", "wpm test", "words per minute", "how fast do i type"],
  "random-name-picker": ["name picker", "pick a name", "random winner", "pick a winner", "raffle draw", "giveaway winner"],
  "sql-formatter": ["format sql", "sql formatter", "beautify sql", "pretty print sql", "minify sql"],
  "xml-formatter": ["format xml", "xml formatter", "validate xml", "beautify xml", "xml validator"],
  "contrast-checker": ["contrast checker", "color contrast", "wcag contrast", "contrast ratio", "accessibility contrast"],
  "csv-to-excel": ["csv to excel", "csv to xlsx", "convert csv to excel", "csv to spreadsheet"],
  "xml-to-json": ["xml to json", "json to xml", "convert xml to json"],
  "color-palette-generator": ["color palette", "colour palette", "color scheme", "matching colors", "complementary colors"],
  "scientific-calculator": ["scientific calculator", "sin cos tan", "trig calculator", "log calculator"],
  "fraction-calculator": ["fraction calculator", "add fractions", "simplify fraction", "mixed number", "fractions"],
  "subnet-calculator": ["subnet calculator", "cidr", "subnet mask", "ip range", "network address"],
  "countdown-timer": ["countdown timer", "set a timer", "timer", "5 minute timer", "10 minute timer", "timer with alarm"],
  "sms-character-counter": ["sms character count", "sms length", "text message length", "sms segments", "160 characters"],
  // Batch 20
  "pdf-editor": ["edit pdf", "pdf editor", "fill pdf", "write on pdf", "add text to pdf", "annotate pdf", "fill out pdf form", "whiteout pdf", "ocr pdf", "make scanned pdf searchable"],
  "word-to-pdf": ["word to pdf", "docx to pdf", "convert word to pdf", "doc to pdf"],
  "word-editor": ["edit word document", "word editor", "docx editor", "edit docx", "open docx", "write a document", "document editor"],
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

// Spanish alias layer for /ask (matched in addition to English when locale=es).
const ALIASES_ES: Record<string, string[]> = {
  "compress-pdf": ["comprimir pdf", "reducir tamaño pdf", "achicar pdf", "pdf más pequeño", "hacer pdf pequeño", "comprimir pdf a 100kb"],
  "merge-pdf": ["unir pdf", "combinar pdf", "juntar pdf", "fusionar pdf", "unir documentos"],
  "split-pdf": ["dividir pdf", "separar pdf", "extraer páginas", "sacar páginas del pdf"],
  "rotate-pdf": ["rotar pdf", "girar pdf", "voltear pdf"],
  "jpg-to-pdf": ["jpg a pdf", "imagen a pdf", "fotos a pdf", "convertir imagen a pdf"],
  "pdf-to-images": ["pdf a imagen", "pdf a jpg", "convertir pdf a imagen"],
  "pdf-to-text": ["pdf a texto", "extraer texto de pdf", "copiar texto de pdf"],
  "delete-pdf-pages": ["eliminar páginas del pdf", "borrar páginas pdf", "quitar páginas del pdf"],
  "sign-pdf": ["firmar pdf", "añadir firma al pdf", "firma electrónica pdf"],
  "protect-pdf": ["proteger pdf", "poner contraseña a pdf", "cifrar pdf", "bloquear pdf", "pdf con contraseña"],
  "unlock-pdf": ["desbloquear pdf", "quitar contraseña del pdf", "eliminar contraseña pdf", "descifrar pdf"],
  "compress-image": ["comprimir imagen", "comprimir foto", "reducir tamaño de imagen", "comprimir varias imágenes", "comprimir imagen a 20kb"],
  "resize-image": ["redimensionar imagen", "cambiar tamaño de imagen", "escalar imagen", "redimensionar foto"],
  "crop-image": ["recortar imagen", "recortar foto", "cortar imagen"],
  "jpg-to-png": ["convertir imagen", "jpg a png", "png a jpg", "cambiar formato de imagen"],
  "image-to-text": ["extraer texto de imagen", "ocr", "texto desde imagen", "leer texto de foto"],
  "background-remover": ["quitar fondo", "eliminar fondo", "fondo transparente", "borrar fondo"],
  "heic-to-jpg": ["heic a jpg", "convertir heic", "foto de iphone a jpg"],
  "compress-video": ["comprimir video", "comprimir vídeo", "reducir tamaño de video", "hacer video más pequeño"],
  "mute-video": ["quitar audio del video", "silenciar video", "eliminar sonido del video"],
  "audio-converter": ["convertir audio", "convertir a mp3", "m4a a mp3", "wav a mp3"],
  "trim-audio": ["cortar audio", "recortar audio", "cortar mp3", "hacer un tono de llamada"],
  "trim-video": ["cortar video", "recortar video", "acortar video"],
  "word-counter": ["contar palabras", "conteo de palabras", "cuántas palabras", "contar caracteres"],
  "case-converter": ["cambiar mayúsculas", "convertir a mayúsculas", "convertir a minúsculas"],
  "qr-code-generator": ["código qr", "generar qr", "crear código qr"],
  "password-generator": ["generar contraseña", "contraseña segura", "contraseña aleatoria"],
  "json-formatter": ["formatear json", "validar json", "embellecer json"],
  "invoice-generator": ["generar factura", "crear factura", "hacer una factura", "factura pdf"],
  "image-upscaler": ["ampliar imagen", "agrandar imagen", "aumentar resolución", "hacer imagen más grande", "escalar imagen a mayor"],
  // Batches 18–20
  "png-to-jpg": ["png a jpg", "convertir png a jpg"],
  "png-to-pdf": ["png a pdf", "convertir png a pdf"],
  "pdf-to-jpg": ["pdf a jpg", "convertir pdf a jpg"],
  "html-to-pdf": ["html a pdf", "convertir html a pdf", "página web a pdf"],
  "word-to-pdf": ["word a pdf", "docx a pdf", "convertir word a pdf"],
  "pdf-editor": ["editar pdf", "editor de pdf", "rellenar pdf", "escribir en pdf"],
  "due-date-calculator": ["fecha de parto", "calculadora de embarazo", "cuándo nace mi bebé", "semanas de embarazo"],
  "water-intake-calculator": ["cuánta agua debo beber", "calculadora de agua", "consumo de agua diario"],
  "paypal-fee-calculator": ["comisión paypal", "calculadora de comisiones paypal", "cuánto cobra paypal"],
  "typing-speed-test": ["test de mecanografía", "velocidad de escritura", "prueba de mecanografía", "palabras por minuto"],
  "random-name-picker": ["sorteo de nombres", "elegir ganador", "sorteo aleatorio"],
  "scientific-calculator": ["calculadora científica"],
  "fraction-calculator": ["calculadora de fracciones", "sumar fracciones", "simplificar fracciones"],
  "countdown-timer": ["temporizador", "cuenta regresiva", "temporizador de 5 minutos", "poner un temporizador"],
  "sms-character-counter": ["contador de caracteres sms", "longitud de sms"],
  "color-palette-generator": ["paleta de colores", "generador de paletas", "combinación de colores"],
  "contrast-checker": ["contraste de colores", "comprobar contraste"],
  "word-editor": ["editar documento word", "editor de word", "editar docx", "abrir docx"],
};

function aliasesFor(slug: string, locale: string): string[] {
  const en = ALIASES[slug] ?? [];
  return locale === "es" ? [...en, ...(ALIASES_ES[slug] ?? [])] : en;
}

/** Rank tools for a typed query + optional attached file. Highest score first. */
export function matchTools(query: string, file?: { type?: string; name?: string } | null, locale = "en"): Match[] {
  const q = query.toLowerCase().trim();
  const qTokens = new Set(tokenize(query));
  const fileCat = categoryForFile(file);

  const scored: Match[] = TOOLS.filter((t) => t.status === "live").map((tool) => {
    let score = 0;
    const aliases = aliasesFor(tool.slug, locale);

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

export function bestMatches(query: string, file?: { type?: string; name?: string } | null, n = 4, locale = "en"): Match[] {
  return matchTools(query, file, locale).slice(0, n);
}

// ─── Universal drop zone: file → matching tools ──────────────────────────

export type FileKind = "pdf" | "image" | "video" | "audio" | "text";

/** Classify a dropped/pasted file by MIME type, falling back to extension. */
export function fileKind(file: { type?: string; name?: string } | null | undefined): FileKind | null {
  if (!file) return null;
  const t = (file.type || "").toLowerCase();
  const n = (file.name || "").toLowerCase();
  if (t.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (t.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|heic|heif|avif|svg|tiff?)$/.test(n)) return "image";
  if (t.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi|m4v|mpe?g)$/.test(n)) return "video";
  if (t.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac|opus)$/.test(n)) return "audio";
  if (t.startsWith("text/") || /\.(txt|json|csv|md|yml|yaml|xml|html?)$/.test(n)) return "text";
  return null;
}

/** Tools that can accept more than one file at once (used for multi-drop). */
export const MULTI_FILE_TOOLS = new Set<string>(["merge-pdf", "jpg-to-pdf", "collage-maker"]);

// Curated, usefulness-ordered candidate slugs per file kind. Filtered to
// FILE_AUTOLOAD members below so we only ever offer tools that actually
// auto-load the file on arrival.
const ACTIONS_BY_KIND: Record<FileKind, string[]> = {
  pdf: ["compress-pdf", "merge-pdf", "split-pdf", "rotate-pdf", "organize-pdf", "watermark-pdf", "pdf-page-numbers", "pdf-to-text", "pdf-to-images"],
  image: ["compress-image", "resize-image", "screenshot-beautifier", "collage-maker", "background-remover", "image-to-text", "image-metadata-remover", "image-metadata-viewer", "ai-image-checker", "jpg-to-pdf"],
  video: ["mp4-to-mp3", "video-to-gif", "trim-video"],
  audio: [],
  text: [],
};

/**
 * Given a dropped file, return the ordered list of tools that can act on it.
 * `multiple` promotes multi-file tools (merge / images→PDF) to the front so a
 * batch drop leads with the action that uses every file.
 */
export function toolsForFile(
  file: { type?: string; name?: string } | null | undefined,
  opts?: { multiple?: boolean }
): Tool[] {
  const kind = fileKind(file);
  if (!kind) return [];

  const n = (file?.name || "").toLowerCase();
  const t = (file?.type || "").toLowerCase();
  let slugs = [...ACTIONS_BY_KIND[kind]];

  // Surface HEIC→JPG (first) only when the file actually is HEIC.
  if (kind === "image" && (/heic|heif/.test(t) || /\.(heic|heif)$/.test(n))) {
    slugs = ["heic-to-jpg", ...slugs];
  }

  if (opts?.multiple) {
    slugs.sort((a, b) => Number(MULTI_FILE_TOOLS.has(b)) - Number(MULTI_FILE_TOOLS.has(a)));
  }

  const seen = new Set<string>();
  const out: Tool[] = [];
  for (const slug of slugs) {
    if (seen.has(slug) || !FILE_AUTOLOAD.has(slug)) continue;
    seen.add(slug);
    const tool = TOOLS.find((x) => x.slug === slug && x.status === "live");
    if (tool) out.push(tool);
  }
  return out;
}
