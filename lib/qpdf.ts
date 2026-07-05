// Lazy qpdf loader for the PDF password tools (pdf-lib can't encrypt/decrypt).
// The Emscripten glue can't be bundled by Turbopack, so — like ffmpeg's core —
// both the JS and the ~1.3 MB wasm are fetched from a pinned CDN at runtime and
// reused. The user's PDF is processed locally and never uploaded. A fresh
// instance is created per operation because callMain() runs once per instance.

const VER = "0.3.0";
const JS_URL = `https://unpkg.com/@neslinesli93/qpdf-wasm@${VER}/dist/qpdf.js`;
const WASM_URL = `https://unpkg.com/@neslinesli93/qpdf-wasm@${VER}/dist/qpdf.wasm`;

type QpdfFactory = (opts: Record<string, unknown>) => Promise<{ callMain: (a: string[]) => number; FS: any }>;

let factoryPromise: Promise<QpdfFactory> | null = null;
let wasmBytes: Promise<ArrayBuffer> | null = null;

function loadFactory(onStatus?: (m: string) => void): Promise<QpdfFactory> {
  if (factoryPromise) return factoryPromise;
  factoryPromise = new Promise<QpdfFactory>((resolve, reject) => {
    const w = window as unknown as { Module?: QpdfFactory };
    const s = document.createElement("script");
    s.src = JS_URL;
    s.async = true;
    s.onload = () => {
      // The UMD build assigns the Emscripten factory to a global `Module`.
      if (typeof w.Module === "function") resolve(w.Module);
      else reject(new Error("PDF engine loaded but was not usable."));
    };
    s.onerror = () => reject(new Error("Could not load the PDF engine."));
    onStatus?.("Downloading PDF security engine (one-time)…");
    document.head.appendChild(s);
  }).catch((e) => {
    factoryPromise = null; // allow retry
    throw e;
  });
  return factoryPromise;
}

function getWasmBytes(): Promise<ArrayBuffer> {
  if (!wasmBytes) {
    wasmBytes = fetch(WASM_URL)
      .then((r) => {
        if (!r.ok) throw new Error("Could not download the PDF engine.");
        return r.arrayBuffer();
      })
      .catch((e) => {
        wasmBytes = null;
        throw e;
      });
  }
  return wasmBytes;
}

export class QpdfError extends Error {
  code: number;
  constructor(code: number) {
    super(`qpdf exited with code ${code}`);
    this.code = code;
  }
}

/**
 * Run qpdf against a PDF. `buildArgs(inPath, outPath)` returns the CLI args.
 * qpdf exit codes: 0 = ok, 3 = ok-with-warnings; 2 (and others) = error
 * (e.g. wrong password / already-encrypted input).
 */
export async function runQpdf(
  input: Uint8Array,
  buildArgs: (inPath: string, outPath: string) => string[],
  onStatus?: (m: string) => void
): Promise<Uint8Array> {
  const [factory, bytes] = await Promise.all([loadFactory(onStatus), getWasmBytes()]);
  onStatus?.("Processing…");
  const qpdf = await factory({ wasmBinary: bytes.slice(0), noExitRuntime: true });
  const IN = "in.pdf";
  const OUT = "out.pdf";
  qpdf.FS.writeFile(IN, input);
  const code = qpdf.callMain(buildArgs(IN, OUT));
  if (code !== 0 && code !== 3) throw new QpdfError(code);
  return qpdf.FS.readFile(OUT) as Uint8Array;
}
