// ─────────────────────────────────────────────────────────────────────────
// Small shared canvas helpers used by the image tools (single-file and batch).
// All work happens locally in the browser.
// ─────────────────────────────────────────────────────────────────────────

/** Decode a Blob/File (or URL) into a loaded <img>. Object URLs are revoked. */
export function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  const revoke = typeof src === "string" ? () => {} : () => URL.revokeObjectURL(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      revoke();
      resolve(img);
    };
    img.onerror = () => {
      revoke();
      reject(new Error("Could not decode this image."));
    };
    img.src = url;
  });
}

/** Promise wrapper around canvas.toBlob that rejects instead of yielding null. */
export function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed."))),
      type,
      quality
    );
  });
}

/** Swap (or append) a file extension. e.g. renameExt("a.png", "jpg") → "a.jpg" */
export function renameExt(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return `${base}.${ext}`;
}
