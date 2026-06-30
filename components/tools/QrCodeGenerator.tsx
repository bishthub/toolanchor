"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function QrCodeGenerator() {
  const [text, setText] = useState("https://");
  const [size, setSize] = useState(320);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!text.trim()) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    QRCode.toCanvas(canvas, text, { width: size, margin: 2 }, (err) => {
      setError(err ? "Could not generate a QR code for this input." : null);
    });
  }, [text, size]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qr-code.png";
    a.click();
  }

  return (
    <div>
      <div className="field">
        <label>Text or URL to encode</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 90 }} placeholder="https://example.com" />
      </div>

      <div className="field" style={{ maxWidth: 260 }}>
        <label>Size: {size}px</label>
        <input type="range" min={120} max={600} step={20} value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ width: "100%" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
        <canvas ref={canvasRef} style={{ background: "#fff", borderRadius: 10, maxWidth: "100%" }} />
        <button className="btn" onClick={download} disabled={!text.trim() || !!error}>⬇ Download PNG</button>
      </div>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      <p className="privacy-note">🔒 QR codes are generated in your browser — nothing is uploaded.</p>
    </div>
  );
}
