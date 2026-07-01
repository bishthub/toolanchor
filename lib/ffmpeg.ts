// Lazy, shared ffmpeg.wasm loader. The ~32 MB single-threaded core is fetched
// from a pinned CDN on first use (like the background-removal model) and reused
// for the whole session. Only the engine binary is downloaded — the user's
// media is processed locally and never uploaded. The single-threaded core needs
// no SharedArrayBuffer, so no COOP/COEP headers are required.
import type { FFmpeg } from "@ffmpeg/ffmpeg";

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
let instance: Promise<FFmpeg> | null = null;

/** Returns the shared, loaded FFmpeg instance (loading it on first call). */
export function getFfmpeg(onStatus?: (msg: string) => void): Promise<FFmpeg> {
  if (!instance) {
    instance = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      onStatus?.("Downloading video engine (one-time, ~32 MB)…");
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      ]);
      const ff = new FFmpeg();
      await ff.load({ coreURL, wasmURL });
      return ff;
    })().catch((err) => {
      instance = null; // allow a retry on failure
      throw err;
    });
  }
  return instance;
}

/** Read a File into the Uint8Array ffmpeg's virtual filesystem expects. */
export async function toFileData(file: File): Promise<Uint8Array> {
  const { fetchFile } = await import("@ffmpeg/util");
  return (await fetchFile(file)) as Uint8Array;
}
