"use client";

import { useEffect, useRef, useState } from "react";

// Placement is stored as page-relative fractions so it maps cleanly from the
// on-screen preview to the actual PDF regardless of render scale.
interface Placement { page: number; cx: number; cy: number; w: number } // cx/cy = centre, w = width, all 0..1

export default function SignPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [sigAspect, setSigAspect] = useState(1); // natural h / w
  const [sigWidth, setSigWidth] = useState(0.25); // fraction of page width
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);

  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const drewSomething = useRef(false);

  async function load(f: File) {
    setError(null); setOutUrl(null); setPlacement(null); setFile(f);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      setPageCount(doc.numPages);
      setPageNum(1);
    } catch (err) {
      console.error(err);
      setError("Could not open this PDF. It may be encrypted — unlock it first.");
      setPageCount(0);
    }
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type === "application/pdf");
    if (f) load(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  // Render the current page to the preview canvas.
  useEffect(() => {
    if (!file || pageCount === 0) return;
    let cancelled = false;
    (async () => {
      setRendering(true);
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const page = await doc.getPage(pageNum);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(680, base.width) / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = pageCanvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      } catch (err) {
        if (!cancelled) { console.error(err); setError("Could not render this page."); }
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => { cancelled = true; };
  }, [file, pageCount, pageNum]);

  // ── Signature draw pad ────────────────────────────────────────────────
  function drawPos(e: React.PointerEvent) {
    const c = drawCanvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }
  function startDraw(e: React.PointerEvent) {
    drawing.current = true;
    const { x, y } = drawPos(e);
    const ctx = drawCanvasRef.current!.getContext("2d")!;
    ctx.beginPath(); ctx.moveTo(x, y);
  }
  function moveDraw(e: React.PointerEvent) {
    if (!drawing.current) return;
    const { x, y } = drawPos(e);
    const ctx = drawCanvasRef.current!.getContext("2d")!;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#111";
    ctx.lineTo(x, y); ctx.stroke();
    drewSomething.current = true;
  }
  function endDraw() { drawing.current = false; }
  function clearDraw() {
    const c = drawCanvasRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    drewSomething.current = false;
    setSigUrl(null);
  }
  function useDrawnSignature() {
    const c = drawCanvasRef.current;
    if (!c || !drewSomething.current) { setError("Draw your signature first."); return; }
    setError(null);
    setSigAspect(c.height / c.width);
    setSigUrl(c.toDataURL("image/png"));
  }

  function onUploadSig(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { setSigAspect(img.naturalHeight / img.naturalWidth); setSigUrl(url); setError(null); };
    img.onerror = () => setError("Could not read that image.");
    img.src = url;
  }

  // Place / move the signature by clicking on the page.
  function placeOnPage(e: React.MouseEvent) {
    if (!sigUrl) { setError("Add a signature first (draw or upload)."); return; }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width;
    const cy = (e.clientY - r.top) / r.height;
    setPlacement({ page: pageNum, cx, cy, w: sigWidth });
  }

  async function sign() {
    if (!file || !sigUrl || !placement) return;
    setBusy(true); setError(null); setOutUrl(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const bytes = await fetch(sigUrl).then((r) => r.arrayBuffer());
      const png = await doc.embedPng(bytes);
      const page = doc.getPages()[placement.page - 1];
      const { width: pw, height: ph } = page.getSize();
      const w = placement.w * pw;
      const h = w * sigAspect;
      const x = placement.cx * pw - w / 2;
      const yTop = placement.cy * ph - h / 2;
      const y = ph - yTop - h; // pdf-lib origin is bottom-left
      page.drawImage(png, { x, y, width: w, height: h });
      const out = await doc.save();
      setOutUrl(URL.createObjectURL(new Blob([out.slice().buffer], { type: "application/pdf" })));
    } catch (err) {
      console.error(err);
      setError("Could not sign this PDF. If it's password-protected, unlock it first.");
    } finally {
      setBusy(false);
    }
  }

  // Overlay geometry (in % of the preview box) for the placed signature.
  const overlay = placement && placement.page === pageNum && pageCanvasRef.current
    ? (() => {
        const c = pageCanvasRef.current!;
        const wPx = placement.w * 100; // % of width
        const hPx = (placement.w * c.width * sigAspect) / c.height * 100; // % of height
        return { left: `${placement.cx * 100 - wPx / 2}%`, top: `${placement.cy * 100 - hPx / 2}%`, width: `${wPx}%` };
      })()
    : null;

  return (
    <div>
      <div className="field">
        <label>Choose a PDF to sign</label>
        <input type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }} className="input" />
      </div>

      {pageCount > 0 && (
        <>
          {/* Signature builder */}
          <div className="field">
            <label>Your signature</label>
            <div className="row" style={{ marginBottom: 8 }}>
              <button type="button" className={`btn ${mode === "draw" ? "" : "secondary"}`} onClick={() => setMode("draw")}>Draw</button>
              <button type="button" className={`btn ${mode === "upload" ? "" : "secondary"}`} onClick={() => setMode("upload")}>Upload PNG</button>
            </div>
            {mode === "draw" ? (
              <div>
                <canvas
                  ref={drawCanvasRef}
                  width={400}
                  height={150}
                  className="sign-pad"
                  onPointerDown={startDraw}
                  onPointerMove={moveDraw}
                  onPointerUp={endDraw}
                  onPointerLeave={endDraw}
                />
                <div className="row" style={{ marginTop: 8 }}>
                  <button type="button" className="btn" onClick={useDrawnSignature}>Use this signature</button>
                  <button type="button" className="btn secondary" onClick={clearDraw}>Clear</button>
                </div>
              </div>
            ) : (
              <input type="file" accept="image/png,image/*" onChange={onUploadSig} className="input" />
            )}
          </div>

          {sigUrl && (
            <div className="field">
              <label>Signature size: {Math.round(sigWidth * 100)}% of page width</label>
              <input type="range" min={0.08} max={0.6} step={0.01} value={sigWidth}
                onChange={(e) => { const w = Number(e.target.value); setSigWidth(w); setPlacement((p) => p ? { ...p, w } : p); }}
                style={{ width: "100%" }} />
            </div>
          )}

          {/* Page navigation */}
          {pageCount > 1 && (
            <div className="row" style={{ alignItems: "center", marginBottom: 8 }}>
              <button type="button" className="btn secondary" onClick={() => setPageNum((n) => Math.max(1, n - 1))} disabled={pageNum <= 1}>← Prev</button>
              <span style={{ color: "var(--muted)", fontSize: ".88rem" }}>Page {pageNum} of {pageCount}</span>
              <button type="button" className="btn secondary" onClick={() => setPageNum((n) => Math.min(pageCount, n + 1))} disabled={pageNum >= pageCount}>Next →</button>
            </div>
          )}

          <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
            {sigUrl ? "Click on the page to place (or move) your signature." : "Add a signature above, then click the page to place it."}
          </p>

          {/* Page preview with click-to-place overlay */}
          <div className="sign-stage" onClick={placeOnPage} style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
            <canvas ref={pageCanvasRef} style={{ maxWidth: "100%", height: "auto", border: "1px solid var(--border)", borderRadius: 6, display: "block" }} />
            {rendering && <p style={{ color: "var(--muted)", position: "absolute", top: 8, left: 8 }}>Rendering…</p>}
            {overlay && sigUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sigUrl} alt="signature placement" style={{ position: "absolute", left: overlay.left, top: overlay.top, width: overlay.width, pointerEvents: "none" }} />
            )}
          </div>

          <div style={{ marginTop: 14 }}>
            <button className="btn" onClick={sign} disabled={busy || !placement}>
              {busy ? "Signing…" : "⬇ Sign & download PDF"}
            </button>
          </div>
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {outUrl && (
        <div style={{ marginTop: 16 }}>
          <a className="btn" href={outUrl} download={file ? `${file.name.replace(/\.pdf$/i, "")}-signed.pdf` : "signed.pdf"} style={{ display: "inline-flex" }}>⬇ Download signed PDF</a>
        </div>
      )}

      <p className="privacy-note">🔒 Your PDF and signature are processed entirely in your browser — nothing is uploaded.</p>
    </div>
  );
}
