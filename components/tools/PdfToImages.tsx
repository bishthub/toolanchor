"use client";

import { useEffect, useState } from "react";

interface PageImg { page: number; url: string; }

export default function PdfToImages({ initialFiles }: { initialFiles?: File[] }) {
  const [pages, setPages] = useState<PageImg[]>([]);
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("page");

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
    setPages([]);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const out: PageImg[] = [];
      for (let p = 1; p <= doc.numPages; p++) {
        setProgress(`Rendering page ${p} of ${doc.numPages}…`);
        const page = await doc.getPage(p);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const url: string = await new Promise((res) =>
          canvas.toBlob((b) => res(URL.createObjectURL(b!)), "image/png")
        );
        out.push({ page: p, url });
      }
      setPages(out);
      setProgress("");
    } catch (err) {
      console.error(err);
      setError("Could not render this PDF. It may be encrypted or corrupted.");
    } finally {
      setBusy(false);
    }
  }

  function download(p: PageImg) {
    const a = document.createElement("a");
    a.href = p.url;
    a.download = `${name}-page-${p.page}.png`;
    a.click();
  }

  return (
    <div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field">
          <label>Choose a PDF file</label>
          <input type="file" accept="application/pdf" onChange={onFile} className="input" disabled={busy} />
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <label>Quality: {scale}×</label>
          <input type="range" min={1} max={4} step={0.5} value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: "100%" }} disabled={busy} />
        </div>
      </div>

      {busy && <p style={{ color: "var(--muted)" }}>{progress || "Loading…"}</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {pages.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {pages.map((p) => (
            <div key={p.page} className="stat" style={{ padding: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Page ${p.page}`} className="preview-img" style={{ maxHeight: 200 }} />
              <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={() => download(p)}>⬇ Page {p.page}</button>
            </div>
          ))}
        </div>
      )}
      <p className="privacy-note">🔒 Rendering runs in your browser with PDF.js — your file is never uploaded.</p>
    </div>
  );
}
