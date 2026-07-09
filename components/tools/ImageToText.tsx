"use client";

import { useEffect, useState } from "react";
import WasmProgress from "@/components/WasmProgress";

export default function ImageToText({ initialFiles }: { initialFiles?: File[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPct, setProgressPct] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/"));
    if (f) run(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) run(file);
  }

  async function run(file: File) {
    setPreview(URL.createObjectURL(file));
    setText("");
    setError(null);
    setBusy(true);
    setProgress("Loading OCR engine…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          const pct = Math.round(m.progress * 100);
          if (m.status === "recognizing text") {
            setProgressPct(pct);
            setProgress(`Recognising… ${pct}%`);
          } else {
            setProgressPct(undefined);
            setProgress(m.status);
          }
        },
      });
      const { data } = await worker.recognize(file);
      setText(data.text.trim());
      await worker.terminate();
      setProgress("");
    } catch (err) {
      console.error(err);
      setError("Could not run OCR on this image. Please try a clearer image.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="field">
        <label>Choose an image with text</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" disabled={busy} />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt="source" className="preview-img" style={{ maxHeight: 220 }} />}

      {busy && <WasmProgress status={progress || "Working…"} pct={progressPct} />}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {text && (
        <div className="field" style={{ marginTop: 14 }}>
          <label>Recognised text</label>
          <textarea readOnly value={text} style={{ minHeight: 180 }} />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>{copied ? "✓ Copied" : "Copy text"}</button>
        </div>
      )}
      <p className="privacy-note">🔒 OCR runs in your browser — your image is never uploaded. The engine downloads once on first use.</p>
    </div>
  );
}
