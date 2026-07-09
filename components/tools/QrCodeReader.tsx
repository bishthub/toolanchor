"use client";

import { useState, useCallback } from "react";

export default function QrCodeReader() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function decodeImage(file: File) {
    setError(null);
    setResult(null);
    setBusy(true);
    setPreview(URL.createObjectURL(file));

    try {
      // Load jsQR on demand
      const jsQR = (await import("jsqr")).default;

      const img = await createImageBitmap(file);

      // Create a canvas at the image's actual size
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        setResult(code.data);
      } else {
        // Try again with inversion (helps with dark-on-dark QR codes)
        const code2 = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
        if (code2) {
          setResult(code2.data);
        } else {
          setError("No QR code found in this image. Make sure the QR code is clear and well-lit.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Could not read this image. Try a clearer screenshot or photo.");
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) decodeImage(file);
  }

  const isUrl = result && (result.startsWith("http://") || result.startsWith("https://"));

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  // Handle paste from clipboard
  async function onPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          decodeImage(file);
          return;
        }
      }
    }
  }

  return (
    <div onPaste={onPaste}>
      <div className="field">
        <label>Upload a QR code image</label>
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          className="input"
          disabled={busy}
        />
        <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 6 }}>
          Or paste a screenshot directly (Ctrl+V / Cmd+V)
        </p>
      </div>

      {busy && <p style={{ color: "var(--muted)" }}>Decoding QR code…</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 8 }}>{error}</p>}

      {preview && !busy && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={preview}
          alt="Uploaded QR code"
          className="preview-img"
          style={{ maxHeight: 200, maxWidth: 200 }}
        />
      )}

      {result && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Decoded content</label>
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: ".95rem",
              wordBreak: "break-all",
            }}
          >
            {result}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {isUrl ? (
              <a href={result} target="_blank" rel="noopener noreferrer" className="btn" style={{ display: "inline-flex" }}>
                🔗 Open URL
              </a>
            ) : null}
            <button className="btn secondary" onClick={copy}>
              {copied ? "✓ Copied" : "Copy text"}
            </button>
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 QR decoding runs entirely in your browser — your image is never uploaded. Uses the jsQR library for fast, accurate scanning.</p>
    </div>
  );
}
