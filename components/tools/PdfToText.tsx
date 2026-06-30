"use client";

import { useEffect, useState } from "react";

export default function PdfToText({ initialFiles }: { initialFiles?: File[] }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("document");

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) run(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) run(file);
  }

  async function run(file: File) {
    setName(file.name.replace(/\.pdf$/i, ""));
    setBusy(true);
    setError(null);
    setText("");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      let out = "";
      for (let p = 1; p <= doc.numPages; p++) {
        setProgress(`Reading page ${p} of ${doc.numPages}…`);
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        out += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n\n";
      }
      setText(out.trim());
      setProgress("");
    } catch (err) {
      console.error(err);
      setError("Could not read this PDF. It may be encrypted, or it may be a scanned image (try the OCR tool).");
    } finally {
      setBusy(false);
    }
  }

  async function copy() { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }
  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="field">
        <label>Choose a PDF file</label>
        <input type="file" accept="application/pdf" onChange={onFile} className="input" disabled={busy} />
      </div>
      {busy && <p style={{ color: "var(--muted)" }}>{progress || "Loading…"}</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      {text && (
        <div className="field">
          <label>Extracted text</label>
          <textarea readOnly value={text} style={{ minHeight: 240 }} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" onClick={copy}>{copied ? "✓ Copied" : "Copy text"}</button>
            <button className="btn secondary" onClick={download}>⬇ Download .txt</button>
          </div>
        </div>
      )}
      <p className="privacy-note">🔒 Extraction runs in your browser with PDF.js — your file is never uploaded.</p>
    </div>
  );
}
