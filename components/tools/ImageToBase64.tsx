"use client";

import { useState } from "react";

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImageToBase64() {
  const [dataUri, setDataUri] = useState("");
  const [size, setSize] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSize(file.size);
    const reader = new FileReader();
    reader.onload = () => setDataUri(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  }

  const cssBg = dataUri ? `background-image: url("${dataUri}");` : "";

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      {dataUri && (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
            Original size {fmtBytes(size)} → Base64 ≈ {fmtBytes(Math.ceil(dataUri.length))} (Base64 adds ~33%).
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUri} alt="preview" className="preview-img" style={{ maxHeight: 200 }} />

          <div className="field" style={{ marginTop: 14 }}>
            <label>Data URI</label>
            <textarea readOnly value={dataUri} className="mono" style={{ minHeight: 120 }} />
            <button className="btn" style={{ marginTop: 8 }} onClick={() => copy(dataUri, "uri")}>{copied === "uri" ? "✓ Copied" : "Copy data URI"}</button>
          </div>

          <div className="field">
            <label>CSS background</label>
            <textarea readOnly value={cssBg} className="mono" style={{ minHeight: 70 }} />
            <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => copy(cssBg, "css")}>{copied === "css" ? "✓ Copied" : "Copy CSS"}</button>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Encoded locally in your browser — your image is never uploaded.</p>
    </div>
  );
}
