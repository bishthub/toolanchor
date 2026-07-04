"use client";

import { useEffect, useState } from "react";
import SendToTool from "@/components/SendToTool";

export default function BackgroundRemover({ initialFiles }: { initialFiles?: File[] }) {
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    setOriginal(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setBusy(true);
    setProgress("Loading model (first run downloads a few MB)…");
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          const pct = total ? Math.round((current / total) * 100) : 0;
          setProgress(`${key.includes("fetch") ? "Downloading model" : "Processing"}… ${pct}%`);
        },
      });
      setResult(URL.createObjectURL(blob));
      setProgress("");
    } catch (err) {
      console.error(err);
      setError("Could not remove the background. Please try another image.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = "no-background.png";
    a.click();
  }

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" disabled={busy} />
      </div>

      {busy && <p style={{ color: "var(--muted)" }}>{progress || "Working…"}</p>}
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      <div className="row" style={{ gap: 16 }}>
        {original && (
          <div className="field" style={{ flex: 1 }}>
            <label>Original</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={original} alt="original" className="preview-img" style={{ maxHeight: 240 }} />
          </div>
        )}
        {result && (
          <div className="field" style={{ flex: 1 }}>
            <label>Background removed</label>
            {/* Checkerboard hints at transparency */}
            <div style={{ backgroundImage: "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0", borderRadius: 10, display: "inline-block" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result} alt="result" className="preview-img" style={{ maxHeight: 240, border: "none" }} />
            </div>
          </div>
        )}
      </div>

      {result && <button className="btn" style={{ marginTop: 12 }} onClick={download}>⬇ Download transparent PNG</button>}

      {result && (
        <SendToTool
          kind="image"
          exclude="background-remover"
          getFile={async () => {
            try {
              const blob = await fetch(result).then((r) => r.blob());
              return new File([blob], "no-background.png", { type: "image/png" });
            } catch { return null; }
          }}
        />
      )}

      <p className="privacy-note">🔒 The AI model runs entirely in your browser — your image is never uploaded. First run downloads the model (cached after).</p>
    </div>
  );
}
