"use client";

import { useCallback, useEffect, useState } from "react";
import { usePreset, presetNumber } from "@/lib/preset";
import BatchFileList, { type BatchOutput } from "@/components/tools/BatchFileList";
import SendToTool from "@/components/SendToTool";

function fmt(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** Rasterise every page to JPEG and rebuild the PDF — the shared compression
 *  pipeline used by both the single-file and batch flows. */
async function compressPdf(
  file: File,
  quality: number,
  scale: number,
  onPage?: (p: number, total: number) => void
): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const { PDFDocument } = await import("pdf-lib");

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const out = await PDFDocument.create();

  for (let p = 1; p <= doc.numPages; p++) {
    onPage?.(p, doc.numPages);
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const jpegBytes = await new Promise<Uint8Array>((res) =>
      canvas.toBlob(async (b) => res(new Uint8Array(await b!.arrayBuffer())), "image/jpeg", quality)
    );
    const img = await out.embedJpg(jpegBytes);
    const newPage = out.addPage([viewport.width, viewport.height]);
    newPage.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
  }

  const bytes = await out.save();
  return new Blob([bytes.slice().buffer], { type: "application/pdf" });
}

export default function CompressPdf({
  initialFiles,
  preset,
}: {
  initialFiles?: File[];
  preset?: Record<string, string>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.6);
  const [scale, setScale] = useState(1.5);
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [runToken, setRunToken] = useState(0);

  // Preset / deep-link settings (e.g. ?q=0.5&r=1.2) — applied once on mount.
  const presetValues = usePreset(preset, ["q", "r"]);
  useEffect(() => {
    const q = presetNumber(presetValues, "q", 0.2, 0.9);
    const r = presetNumber(presetValues, "r", 1, 2.5);
    if (q !== undefined) setQuality(q);
    if (r !== undefined) setScale(r);
  }, [presetValues]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [origSize, setOrigSize] = useState(0);

  function selectFiles(files: File[]) {
    const pdfs = files.filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) return;
    setResult(null);
    setError(null);
    if (pdfs.length === 1) {
      setBatchFiles(null);
      setFile(pdfs[0]);
      setOrigSize(pdfs[0].size);
    } else {
      setBatchFiles(pdfs);
    }
  }

  useEffect(() => {
    if (initialFiles?.length) selectFiles(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    selectFiles(Array.from(e.target.files ?? []));
  }

  async function compress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const blob = await compressPdf(file, quality, scale, (p, total) =>
        setProgress(`Compressing page ${p} of ${total}…`)
      );
      setResult({ url: URL.createObjectURL(blob), size: blob.size });
      setProgress("");
    } catch (err) {
      console.error(err);
      setError("Could not compress this PDF. It may be encrypted or corrupted.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result || !file) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${file.name.replace(/\.pdf$/i, "")}-compressed.pdf`;
    a.click();
  }

  // Batch: compress each PDF sequentially with the current settings.
  const processBatch = useCallback(
    async (f: File): Promise<BatchOutput> => {
      const blob = await compressPdf(f, quality, scale);
      return { blob, name: `${f.name.replace(/\.pdf$/i, "")}-compressed.pdf` };
    },
    [quality, scale]
  );

  const saved = result && origSize ? Math.round((1 - result.size / origSize) * 100) : 0;

  const settings = (disabled: boolean) => (
    <div className="row">
      <div className="field"><label>Image quality: {Math.round(quality * 100)}%</label><input type="range" min={0.2} max={0.9} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} style={{ width: "100%" }} disabled={disabled} /></div>
      <div className="field"><label>Resolution: {scale}×</label><input type="range" min={1} max={2.5} step={0.25} value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ width: "100%" }} disabled={disabled} /></div>
    </div>
  );

  return (
    <div>
      <div className="field">
        <label>Choose PDF file{batchFiles ? "s" : "(s)"}</label>
        <input type="file" accept="application/pdf" multiple onChange={onFile} className="input" disabled={busy} />
      </div>

      {batchFiles ? (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".85rem", marginBottom: 4 }}>
            {batchFiles.length} PDFs — compressed one at a time to keep memory low.
          </p>
          {settings(false)}
          <button type="button" className="btn secondary" style={{ marginBottom: 4 }} onClick={() => setRunToken((t) => t + 1)}>
            Re-compress all
          </button>
          <BatchFileList
            files={batchFiles}
            process={processBatch}
            runToken={runToken}
            zipName="compressed-pdfs"
            onClear={() => setBatchFiles(null)}
          />
        </>
      ) : (
        <>
          {file && <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>Selected: {file.name} ({fmt(origSize)})</p>}

          {settings(busy)}

          <button className="btn" onClick={compress} disabled={!file || busy}>{busy ? "Compressing…" : "Compress PDF"}</button>
          {busy && <p style={{ color: "var(--muted)", marginTop: 10 }}>{progress}</p>}
          {error && <p style={{ color: "#ff6b6b", marginTop: 10 }}>{error}</p>}

          {result && (
            <div style={{ marginTop: 16 }}>
              <div className="stats">
                <div className="stat"><div className="n">{fmt(origSize)}</div><div className="l">Original</div></div>
                <div className="stat"><div className="n">{fmt(result.size)}</div><div className="l">Compressed</div></div>
                <div className="stat"><div className="n">{saved > 0 ? saved : 0}%</div><div className="l">Saved</div></div>
              </div>
              {saved <= 0 && <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 8 }}>This PDF was already well-optimised — try a lower quality/resolution for more savings.</p>}
              <button className="btn" style={{ marginTop: 12 }} onClick={download}>⬇ Download compressed PDF</button>

              <SendToTool
                kind="pdf"
                exclude="compress-pdf"
                getFile={async () => {
                  if (!result || !file) return null;
                  const blob = await fetch(result.url).then((r) => r.blob());
                  return new File([blob], `${file.name.replace(/\.pdf$/i, "")}-compressed.pdf`, { type: "application/pdf" });
                }}
              />
            </div>
          )}
        </>
      )}

      <p className="privacy-note">🔒 Compression runs in your browser — your PDF{batchFiles ? "s are" : " is"} never uploaded. Note: pages are rasterised, so text becomes part of the image.</p>
    </div>
  );
}
