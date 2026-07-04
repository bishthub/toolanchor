"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadImage, canvasBlob } from "@/lib/canvas";
import BatchFileList, { type BatchOutput } from "@/components/tools/BatchFileList";
import SendToTool from "@/components/SendToTool";

type Fmt = "png" | "jpeg" | "webp";
const MIME: Record<Fmt, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };
const EXT: Record<Fmt, string> = { png: "png", jpeg: "jpg", webp: "webp" };

interface Props {
  initialFiles?: File[];
  /** Preset the target format (landing pages set this; users can still switch). */
  defaultFormat?: Fmt;
  /** Decode HEIC/HEIF input (needs heic2any, loaded on demand). */
  heic?: boolean;
  /** The tool slug this instance is rendered as (for chaining / workflows). */
  slug?: string;
}

function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** Produce a browser-displayable blob for a file, decoding HEIC/HEIF to PNG. */
async function toDisplayable(file: File, allowHeic?: boolean): Promise<Blob> {
  if (!isHeic(file)) return file;
  if (!allowHeic) throw new Error("This looks like a HEIC file — use the HEIC to JPG tool.");
  const heic2any = (await import("heic2any")).default as (o: {
    blob: Blob; toType?: string; quality?: number;
  }) => Promise<Blob | Blob[]>;
  const out = await heic2any({ blob: file, toType: "image/png" });
  return Array.isArray(out) ? out[0] : out;
}

/** Draw an image onto a fresh canvas, white-filling for alpha-less JPEG. */
function drawToCanvas(img: HTMLImageElement, format: Fmt): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export default function ImageConverter({ initialFiles, defaultFormat = "png", heic, slug = "jpg-to-png" }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [format, setFormat] = useState<Fmt>(defaultFormat);
  const [fileName, setFileName] = useState("image");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [runToken, setRunToken] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  async function loadFile(file: File) {
    setError(null);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    try {
      if (isHeic(file) && !heic) {
        setError("This looks like a HEIC file — use the HEIC to JPG tool for it.");
        return;
      }
      setBusy(true);
      const blob = await toDisplayable(file, heic);
      // Keep a live preview URL; decode a separate copy for canvas work.
      const previewUrl = URL.createObjectURL(blob);
      imgRef.current = await loadImage(blob);
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return previewUrl;
      });
      setBusy(false);
    } catch (err) {
      console.error(err);
      setError("Could not read this image. If it's a HEIC file, try a different photo.");
      setBusy(false);
    }
  }

  function selectFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/") || isHeic(f));
    if (images.length === 0) return;
    if (images.length === 1) {
      setBatchFiles(null);
      loadFile(images[0]);
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

  function convert() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = drawToCanvas(img, format);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${fileName}.${EXT[format]}`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      MIME[format],
      0.92
    );
  }

  // Batch: convert each file to the chosen format.
  const processBatch = useCallback(
    async (file: File): Promise<BatchOutput> => {
      const img = await loadImage(await toDisplayable(file, heic));
      const canvas = drawToCanvas(img, format);
      const blob = await canvasBlob(canvas, MIME[format], 0.92);
      const base = file.name.replace(/\.[^.]+$/, "");
      return { blob, name: `${base}.${EXT[format]}` };
    },
    [format, heic]
  );

  const formatPicker = (
    <div className="field">
      <label>Convert to</label>
      <div className="row">
        {(["png", "jpeg", "webp"] as const).map((f) => (
          <button key={f} type="button" className={`btn ${format === f ? "" : "secondary"}`} onClick={() => setFormat(f)}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="field">
        <label>Choose image{batchFiles ? "s" : "(s)"}</label>
        <input
          type="file"
          accept={heic ? "image/*,.heic,.heif" : "image/*"}
          multiple
          onChange={onFile}
          className="input"
        />
      </div>

      {busy && <p style={{ color: "var(--muted)" }}>Decoding image…</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {batchFiles ? (
        <>
          {formatPicker}
          <button type="button" className="btn secondary" style={{ marginBottom: 4 }} onClick={() => setRunToken((t) => t + 1)}>
            Re-convert all to {format.toUpperCase()}
          </button>
          <BatchFileList
            files={batchFiles}
            process={processBatch}
            runToken={runToken}
            zipName={`converted-${EXT[format]}`}
            showSavings={false}
            onClear={() => setBatchFiles(null)}
          />
        </>
      ) : src && (
        <>
          {formatPicker}
          <button className="btn" onClick={convert}>⬇ Convert &amp; download</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="preview" className="preview-img" style={{ maxHeight: 280 }} />

          <SendToTool
            kind="image"
            exclude={slug}
            getFile={async () => {
              const img = imgRef.current;
              if (!img) return null;
              try {
                const blob = await canvasBlob(drawToCanvas(img, format), MIME[format], 0.92);
                return new File([blob], `${fileName}.${EXT[format]}`, { type: MIME[format] });
              } catch { return null; }
            }}
          />
        </>
      )}

      <p className="privacy-note">🔒 Conversion runs in your browser — your image{batchFiles ? "s are" : " is"} never uploaded.</p>
    </div>
  );
}
