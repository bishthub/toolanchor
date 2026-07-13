"use client";

import { useEffect, useRef, useState } from "react";

// Placements are stored as page-relative fractions so they map cleanly from
// the on-screen preview to the actual PDF regardless of render scale.
// Signature items size by `w` (fraction of page width); text items size by
// `size` (font size as a fraction of page width).
interface PlacedItem {
  id: number;
  type: "sig" | "text";
  page: number;
  cx: number; // centre, 0..1
  cy: number;
  w?: number;
  text?: string;
  size?: number;
}

export default function SignPdf({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [sigAspect, setSigAspect] = useState(1); // natural h / w
  const [sigWidth, setSigWidth] = useState(0.25); // fraction of page width
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [tool, setTool] = useState<"sign" | "text">("sign");
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [textValue, setTextValue] = useState("");
  const [textSize, setTextSize] = useState(0.025); // font size, fraction of page width
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);

  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const drewSomething = useRef(false);
  const nextId = useRef(1);

  async function load(f: File) {
    setError(null); setOutUrl(null); setItems([]); setFile(f);
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

  // Place a signature or text item by clicking on the page.
  function placeOnPage(e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width;
    const cy = (e.clientY - r.top) / r.height;
    if (tool === "sign") {
      if (!sigUrl) { setError("Add a signature first (draw or upload)."); return; }
      setError(null);
      setItems((xs) => [...xs, { id: nextId.current++, type: "sig", page: pageNum, cx, cy, w: sigWidth }]);
    } else {
      if (!textValue.trim()) { setError("Type the text to place first."); return; }
      setError(null);
      setItems((xs) => [...xs, { id: nextId.current++, type: "text", page: pageNum, cx, cy, text: textValue, size: textSize }]);
    }
  }

  function removeItem(id: number) {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  async function sign() {
    if (!file || items.length === 0) return;
    setBusy(true); setError(null); setOutUrl(null);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const pages = doc.getPages();
      const png = items.some((i) => i.type === "sig") && sigUrl
        ? await doc.embedPng(await fetch(sigUrl).then((r) => r.arrayBuffer()))
        : null;
      const font = items.some((i) => i.type === "text")
        ? await doc.embedFont(StandardFonts.Helvetica)
        : null;
      for (const item of items) {
        const page = pages[item.page - 1];
        const { width: pw, height: ph } = page.getSize();
        if (item.type === "sig" && png) {
          const w = (item.w ?? 0.25) * pw;
          const h = w * sigAspect;
          const x = item.cx * pw - w / 2;
          const yTop = item.cy * ph - h / 2;
          const y = ph - yTop - h; // pdf-lib origin is bottom-left
          page.drawImage(png, { x, y, width: w, height: h });
        } else if (item.type === "text" && font && item.text) {
          const size = (item.size ?? 0.025) * pw;
          const tw = font.widthOfTextAtSize(item.text, size);
          const x = item.cx * pw - tw / 2;
          // Click point is the visual centre; baseline sits ~0.35em below it.
          const y = ph - item.cy * ph - size * 0.35;
          page.drawText(item.text, { x, y, size, font, color: rgb(0.07, 0.07, 0.07) });
        }
      }
      const out = await doc.save();
      const url = URL.createObjectURL(new Blob([out.slice().buffer], { type: "application/pdf" }));
      setOutUrl(url);
      // Sign and download in one action — the button says so.
      const a = document.createElement("a");
      a.href = url;
      a.download = file ? `${file.name.replace(/\.pdf$/i, "")}-signed.pdf` : "signed.pdf";
      a.click();
    } catch (err) {
      console.error(err);
      setError("Could not sign this PDF. If it's password-protected, unlock it first.");
    } finally {
      setBusy(false);
    }
  }

  // Overlay geometry (in % of the preview box) for items on the current page.
  const canvas = pageCanvasRef.current;
  const pageItems = items.filter((i) => i.page === pageNum);

  return (
    <div>
      <div className="field">
        <label>Choose a PDF to fill and sign</label>
        <input type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) load(f); }} className="input" />
      </div>

      {pageCount > 0 && (
        <>
          {/* Tool picker: signature vs. text fill */}
          <div className="row" style={{ marginBottom: 10 }}>
            <button type="button" className={`btn ${tool === "sign" ? "" : "secondary"}`} onClick={() => setTool("sign")}>✍ Signature</button>
            <button type="button" className={`btn ${tool === "text" ? "" : "secondary"}`} onClick={() => setTool("text")}>T Fill text</button>
          </div>

          {tool === "sign" ? (
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
                    onChange={(e) => setSigWidth(Number(e.target.value))}
                    style={{ width: "100%" }} />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Text fill: type a value, click the page to place it */}
              <div className="field">
                <label>Text to fill in (name, date, address…)</label>
                <input type="text" className="input" value={textValue} placeholder="e.g. Jane Doe — 12 Mar 2026"
                  onChange={(e) => setTextValue(e.target.value)} />
              </div>
              <div className="field">
                <label>Text size: {(textSize * 100).toFixed(1)}% of page width</label>
                <input type="range" min={0.015} max={0.06} step={0.001} value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  style={{ width: "100%" }} />
              </div>
            </>
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
            {tool === "sign"
              ? (sigUrl ? "Click on the page to place your signature. Click a placed item to remove it." : "Add a signature above, then click the page to place it.")
              : "Type your text above, then click the page where it should go. Click a placed item to remove it."}
          </p>

          {/* Page preview with click-to-place overlay */}
          <div className="sign-stage" onClick={placeOnPage} style={{ position: "relative", display: "inline-block", maxWidth: "100%", containerType: "inline-size" }}>
            <canvas ref={pageCanvasRef} style={{ maxWidth: "100%", height: "auto", border: "1px solid var(--border)", borderRadius: 6, display: "block" }} />
            {rendering && <p style={{ color: "var(--muted)", position: "absolute", top: 8, left: 8 }}>Rendering…</p>}
            {pageItems.map((item) => {
              if (item.type === "sig" && sigUrl && canvas) {
                const wPct = (item.w ?? 0.25) * 100;
                const hPct = ((item.w ?? 0.25) * canvas.width * sigAspect) / canvas.height * 100;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={item.id} src={sigUrl} alt="signature placement" title="Click to remove"
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                    style={{ position: "absolute", left: `${item.cx * 100 - wPct / 2}%`, top: `${item.cy * 100 - hPct / 2}%`, width: `${wPct}%`, cursor: "pointer" }} />
                );
              }
              if (item.type === "text") {
                return (
                  <span key={item.id} title="Click to remove"
                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                    style={{
                      position: "absolute", left: `${item.cx * 100}%`, top: `${item.cy * 100}%`,
                      transform: "translate(-50%, -50%)", whiteSpace: "pre",
                      fontFamily: "Helvetica, Arial, sans-serif", fontSize: `${(item.size ?? 0.025) * 100}cqw`,
                      color: "#121212", lineHeight: 1, cursor: "pointer",
                    }}>
                    {item.text}
                  </span>
                );
              }
              return null;
            })}
          </div>

          <div className="row" style={{ marginTop: 14, alignItems: "center" }}>
            <button className="btn" onClick={sign} disabled={busy || items.length === 0}>
              {busy ? "Working…" : "⬇ Fill & sign — download PDF"}
            </button>
            {items.length > 0 && (
              <button type="button" className="btn secondary" onClick={() => setItems([])}>Clear all ({items.length})</button>
            )}
          </div>
        </>
      )}

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {outUrl && !busy && (
        <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 10 }}>
          ✓ Filled &amp; signed PDF downloaded.{" "}
          <a href={outUrl} download={file ? `${file.name.replace(/\.pdf$/i, "")}-signed.pdf` : "signed.pdf"} style={{ color: "var(--accent)" }}>
            Download again
          </a>
        </p>
      )}

      <p className="privacy-note">🔒 Your PDF, text and signature are processed entirely in your browser — nothing is uploaded.</p>
    </div>
  );
}
