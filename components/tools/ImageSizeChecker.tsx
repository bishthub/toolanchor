"use client";

import { useState, useCallback } from "react";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImageSizeChecker() {
  const [info, setInfo] = useState<{
    width: number;
    height: number;
    aspectRatio: string;
    fileSize: string;
    format: string;
    url: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const check = useCallback((file: File) => {
    setError(null);
    setInfo(null);

    if (!file.type.startsWith("image/")) {
      setError("File is not an image.");
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const g = gcd(w, h);
      const ar = `${w / g}:${h / g}`;
      const format = file.type.replace("image/", "").toUpperCase();

      setInfo({
        width: w,
        height: h,
        aspectRatio: ar,
        fileSize: fmtSize(file.size),
        format,
        url,
      });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setError("Could not read this image.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) check(f);
  }

  const [copied, setCopied] = useState("");
  async function copy(val: string, label: string) {
    await navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(""), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Upload an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {info && (
        <>
          <div className="stats">
            <div className="stat">
              <div className="n">{info.width} × {info.height}</div>
              <div className="l">Dimensions (px)
                <button className="btn secondary" style={{ display: "inline-flex", marginLeft: 8, padding: "1px 6px", fontSize: ".68rem" }} onClick={() => copy(`${info.width}×${info.height}`, "dims")}>
                  {copied === "dims" ? "✓" : "Copy"}
                </button>
              </div>
            </div>
            <div className="stat">
              <div className="n">{info.aspectRatio}</div>
              <div className="l">Aspect ratio</div>
            </div>
            <div className="stat">
              <div className="n">{info.fileSize}</div>
              <div className="l">File size</div>
            </div>
            <div className="stat">
              <div className="n">{info.format}</div>
              <div className="l">Format</div>
            </div>
          </div>

          <div className="field">
            <label>Megapixels</label>
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              {(info.width * info.height / 1_000_000).toFixed(2)} MP
            </p>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Your image is read locally in your browser — never uploaded. All metadata is extracted client-side.</p>
    </div>
  );
}
