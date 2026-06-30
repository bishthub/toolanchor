"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

const FORMATS = ["CODE128", "CODE39", "EAN13", "UPC", "ITF14"] as const;

export default function BarcodeGenerator() {
  const [value, setValue] = useState("123456789012");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("CODE128");
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, { format, displayValue: true, width: 2, height: 90, margin: 12, background: "#ffffff" });
      setError(null);
    } catch {
      setError(`“${value}” isn't valid for ${format}.`);
    }
  }, [value, format]);

  function download() {
    const svg = svgRef.current;
    if (!svg || error) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 400;
      canvas.height = img.height || 150;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "barcode.png";
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  }

  return (
    <div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field">
          <label>Value</label>
          <input className="input mono" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <label>Format</label>
          <select className="input" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      <div style={{ background: "#fff", borderRadius: 10, display: "inline-block", padding: 4, margin: "8px 0 14px", maxWidth: "100%", overflowX: "auto" }}>
        <svg ref={svgRef} />
      </div>
      <div>
        <button className="btn" onClick={download} disabled={!!error}>⬇ Download PNG</button>
      </div>
      <p className="privacy-note">🔒 Generated locally in your browser.</p>
    </div>
  );
}
