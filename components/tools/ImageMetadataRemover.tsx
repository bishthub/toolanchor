"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadImage, canvasBlob } from "@/lib/canvas";
import BatchFileList, { type BatchOutput } from "@/components/tools/BatchFileList";

export default function ImageMetadataRemover({ initialFiles }: { initialFiles?: File[] }) {
  const [src, setSrc] = useState<string | null>(null);
  const [tagCount, setTagCount] = useState<number | null>(null);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [fileName, setFileName] = useState("image");
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [runToken, setRunToken] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  function selectFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    if (images.length === 1) {
      setBatchFiles(null);
      run(images[0]);
    } else {
      setBatchFiles(images);
    }
  }

  useEffect(() => {
    if (initialFiles?.length) selectFiles(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    selectFiles(Array.from(e.target.files ?? []));
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

  function encode(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    if (format === "jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(img, 0, 0);
    return canvas;
  }

  function download() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = encode(img);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}-clean.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, format === "jpeg" ? "image/jpeg" : "image/png", 0.92);
  }

  // Batch: re-encode each image (which drops all metadata).
  const processBatch = useCallback(
    async (file: File): Promise<BatchOutput> => {
      const img = await loadImage(file);
      const canvas = encode(img);
      const blob = await canvasBlob(canvas, format === "jpeg" ? "image/jpeg" : "image/png", 0.92);
      const base = file.name.replace(/\.[^.]+$/, "");
      return { blob, name: `${base}-clean.${format === "jpeg" ? "jpg" : "png"}` };
    },
    [format]
  );

  const formatPicker = (
    <div className="field" style={{ maxWidth: 260 }}>
      <label>Output format</label>
      <div className="row">
        <button type="button" className={`btn ${format === "png" ? "" : "secondary"}`} onClick={() => setFormat("png")}>PNG (lossless)</button>
        <button type="button" className={`btn ${format === "jpeg" ? "" : "secondary"}`} onClick={() => setFormat("jpeg")}>JPG (smaller)</button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="field">
        <label>Choose image{batchFiles ? "s" : "(s)"}</label>
        <input type="file" accept="image/*" multiple onChange={onFile} className="input" />
      </div>

      {batchFiles ? (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".88rem", marginBottom: 8 }}>
            Re-encoding strips all metadata (camera, date, GPS) from every image.
          </p>
          {formatPicker}
          <button type="button" className="btn secondary" style={{ marginBottom: 4 }} onClick={() => setRunToken((t) => t + 1)}>
            Re-process all as {format === "jpeg" ? "JPG" : "PNG"}
          </button>
          <BatchFileList
            files={batchFiles}
            process={processBatch}
            runToken={runToken}
            zipName="clean-images"
            showSavings={false}
            onClear={() => setBatchFiles(null)}
          />
        </>
      ) : src && (
        <>
          {tagCount !== null && (
            <p style={{ color: "var(--muted)", fontSize: ".88rem" }}>
              {tagCount > 0
                ? `Found ${tagCount} metadata field${tagCount === 1 ? "" : "s"} (camera, date, possibly GPS). Re-encoding will strip all of them.`
                : "No metadata detected — your clean copy will be metadata-free regardless."}
            </p>
          )}
          {formatPicker}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="preview" className="preview-img" style={{ maxHeight: 240 }} />
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={download}>⬇ Download clean image</button>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Stripping runs in your browser by re-encoding the image — your photo{batchFiles ? "s are" : " is"} never uploaded.</p>
    </div>
  );
}
