"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "draw" | "type";
const FONTS = [
  { label: "Cursive", css: '"Brush Script MT", "Segoe Script", cursive' },
  { label: "Elegant", css: 'Georgia, "Times New Roman", serif' },
  { label: "Handwriting", css: '"Snell Roundhand", "Segoe Script", cursive' },
  { label: "Bold", css: '"Trebuchet MS", Verdana, sans-serif' },
];

export default function SignatureGenerator() {
  const [mode, setMode] = useState<Mode>("draw");
  const [color, setColor] = useState("#111827");
  const [penSize, setPenSize] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  // Type mode
  const [text, setText] = useState("");
  const [font, setFont] = useState(FONTS[0].css);
  const [fontSize, setFontSize] = useState(64);
  const typeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Draw mode ──────────────────────────────────────────────────────────
  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (c.width / rect.width), y: (e.clientY - rect.top) * (c.height / rect.height) };
  }
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    c.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  }
  function end() { drawing.current = false; }
  function clearDraw() {
    const c = canvasRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  // ── Type mode ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "type") return;
    const c = typeCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const pad = Math.round(fontSize * 0.5);
    ctx.font = `${fontSize}px ${font}`;
    const metrics = ctx.measureText(text || " ");
    c.width = Math.max(120, Math.ceil(metrics.width) + pad * 2);
    c.height = Math.ceil(fontSize * 1.8);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(text, pad, c.height / 2);
  }, [mode, text, font, fontSize, color]);

  function download(canvas: HTMLCanvasElement | null) {
    if (!canvas) return;
    canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "signature.png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }

  return (
    <div>
      <div className="row">
        <button type="button" className={`btn ${mode === "draw" ? "" : "secondary"}`} onClick={() => setMode("draw")}>✍️ Draw</button>
        <button type="button" className={`btn ${mode === "type" ? "" : "secondary"}`} onClick={() => setMode("type")}>⌨️ Type</button>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <div className="field">
          <label>Ink colour</label>
          <input type="color" className="input" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 42, padding: 4 }} />
        </div>
        {mode === "draw" ? (
          <div className="field">
            <label>Pen size: {penSize}px</label>
            <input type="range" min={1} max={10} value={penSize} onChange={(e) => setPenSize(parseInt(e.target.value, 10))} />
          </div>
        ) : (
          <>
            <div className="field">
              <label>Font</label>
              <select className="input" value={font} onChange={(e) => setFont(e.target.value)}>
                {FONTS.map((f) => <option key={f.label} value={f.css}>{f.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Size: {fontSize}px</label>
              <input type="range" min={32} max={120} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value, 10))} />
            </div>
          </>
        )}
      </div>

      {mode === "draw" ? (
        <>
          <div className="field">
            <label>Sign inside the box</label>
            <canvas
              ref={canvasRef}
              width={640}
              height={220}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              style={{ width: "100%", maxWidth: 640, height: "auto", touchAction: "none", border: "1px solid var(--border)", borderRadius: 10, background: "#fff", cursor: "crosshair" }}
            />
          </div>
          <div className="row">
            <button className="btn" onClick={() => download(canvasRef.current)} disabled={!hasInk}>⬇ Download PNG</button>
            <button className="btn secondary" onClick={clearDraw}>Clear</button>
          </div>
        </>
      ) : (
        <>
          <div className="field">
            <label>Your name</label>
            <input type="text" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ada Lovelace" maxLength={40} />
          </div>
          <div className="field">
            <label>Preview (transparent background)</label>
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: 8, overflowX: "auto" }}>
              <canvas ref={typeCanvasRef} style={{ maxWidth: "100%", height: "auto" }} />
            </div>
          </div>
          <button className="btn" onClick={() => download(typeCanvasRef.current)} disabled={!text.trim()}>⬇ Download PNG</button>
        </>
      )}

      <p className="privacy-note">🔒 Your signature is created in your browser and never uploaded. The PNG has a transparent background.</p>
    </div>
  );
}
