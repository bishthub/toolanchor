"use client";

import { useEffect, useRef, useState } from "react";

type Fmt = "png" | "jpeg" | "webp";
const MIME: Record<Fmt, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };
const EXT: Record<Fmt, string> = { png: "png", jpeg: "jpg", webp: "webp" };

interface Props {
  initialFiles?: File[];
  /** Preset the target format (landing pages set this; users can still switch). */
  defaultFormat?: Fmt;
  /** Decode HEIC/HEIF input (needs heic2any, loaded on demand). */
  heic?: boolean;
}

function isHeic(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

export default function ImageConverter({ initialFiles, defaultFormat = "png", heic }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [format, setFormat] = useState<Fmt>(defaultFormat);
  const [fileName, setFileName] = useState("image");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  async function loadFile(file: File) {
    setError(null);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    try {
      let blob: Blob = file;
      // HEIC/HEIF can't be decoded by <img>; convert to PNG first via heic2any.
      if (isHeic(file)) {
        if (!heic) {
          setError("This looks like a HEIC file — use the HEIC to JPG tool for it.");
          return;
        }
        setBusy(true);
        const heic2any = (await import("heic2any")).default as (o: {
          blob: Blob; toType?: string; quality?: number;
        }) => Promise<Blob | Blob[]>;
        const out = await heic2any({ blob: file, toType: "image/png" });
        blob = Array.isArray(out) ? out[0] : out;
      }
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { imgRef.current = img; setSrc(url); setBusy(false); };
      img.onerror = () => { setError("Could not read this image."); setBusy(false); };
      img.src = url;
    } catch (err) {
      console.error(err);
      setError("Could not read this image. If it's a HEIC file, try a different photo.");
      setBusy(false);
    }
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/") || isHeic(x));
    if (f) loadFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  function convert() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    if (format === "jpeg") {
      // JPG has no alpha — fill transparent areas with white.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
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

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input
          type="file"
          accept={heic ? "image/*,.heic,.heif" : "image/*"}
          onChange={onFile}
          className="input"
        />
      </div>

      {busy && <p style={{ color: "var(--muted)" }}>Decoding image…</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {src && (
        <>
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
          <button className="btn" onClick={convert}>⬇ Convert &amp; download</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="preview" className="preview-img" style={{ maxHeight: 280 }} />
        </>
      )}

      <p className="privacy-note">🔒 Conversion runs in your browser — your image is never uploaded.</p>
    </div>
  );
}
