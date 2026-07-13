"use client";

import { useEffect, useRef, useState } from "react";
import WasmProgress from "@/components/WasmProgress";

const FONT_FAMILIES = ["Arial", "Impact", "Georgia", "Times New Roman", "Courier New", "Helvetica", "Verdana"];

export default function TextBehindImage({ initialFiles }: { initialFiles?: File[] }) {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [cutoutImg, setCutoutImg] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPct, setProgressPct] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Text controls
  const [text, setText] = useState("TEXT");
  const [fontSize, setFontSize] = useState(18); // % of image width
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState("900");
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(1);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(40);
  const [uppercase, setUppercase] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/"));
    if (f) run(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) run(file);
  }

  function decode(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image"));
      img.src = src;
    });
  }

  async function run(file: File) {
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setOriginalImg(null);
    setCutoutImg(null);
    setError(null);
    setBusy(true);
    setProgress("Loading model (first run downloads a few MB)…");
    setProgressPct(undefined);
    try {
      const orig = await decode(url);
      setOriginalImg(orig);
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          const pct = total ? Math.round((current / total) * 100) : 0;
          setProgressPct(pct);
          setProgress(`${key.includes("fetch") ? "Downloading model" : "Processing"}… ${pct}%`);
        },
      });
      const cutout = await decode(URL.createObjectURL(blob));
      setCutoutImg(cutout);
      setProgress("");
    } catch (err) {
      console.error(err);
      setError("Could not process this image. Please try another one.");
    } finally {
      setBusy(false);
    }
  }

  // Redraw: original → text → cutout on top, so the text sits behind the subject.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImg || !cutoutImg) return;
    canvas.width = originalImg.naturalWidth;
    canvas.height = originalImg.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
    const sizePx = (fontSize / 100) * canvas.width;
    const family = fontFamily.includes(" ") ? `"${fontFamily}"` : fontFamily;
    ctx.font = `${fontWeight} ${sizePx}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.fillText(uppercase ? text.toUpperCase() : text, (posX / 100) * canvas.width, (posY / 100) * canvas.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(cutoutImg, 0, 0, canvas.width, canvas.height);
  }, [originalImg, cutoutImg, text, fontSize, fontFamily, fontWeight, color, opacity, posX, posY, uppercase]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "text-behind-image.png";
      a.click();
    }, "image/png");
  }

  const ready = !!originalImg && !!cutoutImg;

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" disabled={busy} />
      </div>

      <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
        Works best with a photo that has one clear subject (a person, pet or object) — the text is placed behind it.
      </p>

      {busy && <WasmProgress status={progress || "Working…"} pct={progressPct} />}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {originalUrl && !ready && !error && (
        <div className="field">
          <label>Original</label>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={originalUrl} alt="original" className="preview-img" style={{ maxHeight: 240 }} />
        </div>
      )}

      {ready && (
        <>
          <div className="field">
            <label>Text</label>
            <input type="text" className="input" value={text} onChange={(e) => setText(e.target.value)} />
          </div>

          <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>Font</label>
              <select className="input" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                {FONT_FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 140 }}>
              <label>Weight</label>
              <select className="input" value={fontWeight} onChange={(e) => setFontWeight(e.target.value)}>
                <option value="400">Normal</option>
                <option value="700">Bold</option>
                <option value="900">Black</option>
              </select>
            </div>
            <div className="field" style={{ minWidth: 100 }}>
              <label>Color</label>
              <input type="color" className="input" value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: 2, height: 38 }} />
            </div>
          </div>

          <div className="field">
            <label>Text size: {fontSize}% of image width</label>
            <input type="range" min={5} max={40} step={1} value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div className="field">
            <label>Opacity: {Math.round(opacity * 100)}%</label>
            <input type="range" min={0.1} max={1} step={0.05} value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label>Horizontal position: {posX}%</label>
              <input type="range" min={0} max={100} step={1} value={posX}
                onChange={(e) => setPosX(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label>Vertical position: {posY}%</label>
              <input type="range" min={0} max={100} step={1} value={posY}
                onChange={(e) => setPosY(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </div>
          <div className="field">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
              UPPERCASE
            </label>
          </div>

          <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto", border: "1px solid var(--border)", borderRadius: 6, display: "block" }} />

          <button className="btn" style={{ marginTop: 12 }} onClick={download}>⬇ Download PNG</button>
        </>
      )}

      <p className="privacy-note">🔒 The AI model runs entirely in your browser — your image is never uploaded. First run downloads the model (cached after).</p>
    </div>
  );
}
