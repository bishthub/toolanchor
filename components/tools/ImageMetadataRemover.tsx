"use client";

import { useEffect, useRef, useState } from "react";

export default function ImageMetadataRemover({ initialFiles }: { initialFiles?: File[] }) {
  const [src, setSrc] = useState<string | null>(null);
  const [tagCount, setTagCount] = useState<number | null>(null);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [fileName, setFileName] = useState("image");
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/"));
    if (f) run(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) run(f);
  }

  async function run(file: File) {
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    // Count metadata so we can tell the user what we're stripping.
    try {
      const exifr = (await import("exifr")).default;
      const data = await exifr.parse(file).catch(() => null);
      setTagCount(data ? Object.keys(data).length : 0);
    } catch { setTagCount(null); }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setSrc(url); };
    img.src = url;
  }

  function download() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    if (format === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}-clean.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, format === "jpeg" ? "image/jpeg" : "image/png", 0.92);
  }

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      {src && (
        <>
          {tagCount !== null && (
            <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>
              {tagCount > 0
                ? `Found ${tagCount} metadata field${tagCount === 1 ? "" : "s"} (camera, date, possibly GPS). Re-encoding will strip all of them.`
                : "No metadata detected — your clean copy will be metadata-free regardless."}
            </p>
          )}
          <div className="field" style={{ maxWidth: 220 }}>
            <label>Output format</label>
            <div className="row">
              <button type="button" className={`btn ${format === "png" ? "" : "secondary"}`} onClick={() => setFormat("png")}>PNG (lossless)</button>
              <button type="button" className={`btn ${format === "jpeg" ? "" : "secondary"}`} onClick={() => setFormat("jpeg")}>JPG (smaller)</button>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="preview" className="preview-img" style={{ maxHeight: 240 }} />
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={download}>⬇ Download clean image</button>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Stripping runs in your browser by re-encoding the image — your photo is never uploaded.</p>
    </div>
  );
}
