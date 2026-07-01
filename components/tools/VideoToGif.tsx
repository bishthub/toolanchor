"use client";

import { useEffect, useRef, useState } from "react";
import { getFfmpeg, toFileData } from "@/lib/ffmpeg";

export default function VideoToGif({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [fps, setFps] = useState(12);
  const [width, setWidth] = useState(480);
  const [start, setStart] = useState("0");
  const [duration, setDuration] = useState("5");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const outName = useRef("animation.gif");

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("video/"));
    if (f) { setFile(f); setError(null); }
  }, [initialFiles]);

  async function run() {
    if (!file) return;
    setBusy(true); setError(null); setUrl(null); setStatus("Loading…");
    let ff: Awaited<ReturnType<typeof getFfmpeg>> | null = null;
    const onProgress = ({ progress }: { progress: number }) =>
      setStatus(`Rendering GIF… ${Math.min(100, Math.round(progress * 100))}%`);
    try {
      ff = await getFfmpeg(setStatus);
      ff.on("progress", onProgress);
      const inName = "input" + (file.name.match(/\.[a-z0-9]+$/i)?.[0] || ".mp4");
      outName.current = file.name.replace(/\.[^.]+$/, "") + ".gif";
      await ff.writeFile(inName, await toFileData(file));

      const clip: string[] = [];
      if (parseFloat(start) > 0) clip.push("-ss", start);
      if (parseFloat(duration) > 0) clip.push("-t", duration);
      const vf = `fps=${fps},scale=${width}:-1:flags=lanczos`;

      // Two-pass palette for clean, banding-free colours.
      await ff.exec([...clip, "-i", inName, "-vf", `${vf},palettegen`, "palette.png"]);
      await ff.exec([...clip, "-i", inName, "-i", "palette.png", "-lavfi", `${vf} [x]; [x][1:v] paletteuse`, "output.gif"]);

      const data = (await ff.readFile("output.gif")) as Uint8Array;
      await ff.deleteFile(inName).catch(() => {});
      await ff.deleteFile("palette.png").catch(() => {});
      await ff.deleteFile("output.gif").catch(() => {});
      setUrl(URL.createObjectURL(new Blob([data.slice().buffer], { type: "image/gif" })));
      setStatus("");
    } catch (err) {
      console.error(err);
      setError("Could not create the GIF. Try a shorter clip, lower fps or a smaller width.");
    } finally {
      if (ff) ff.off("progress", onProgress);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a video file</label>
        <input type="file" accept="video/*" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); setUrl(null); }} className="input" disabled={busy} />
      </div>

      <div className="row">
        <div className="field">
          <label>Start (seconds)</label>
          <input type="number" className="input" value={start} min={0} onChange={(e) => setStart(e.target.value)} disabled={busy} />
        </div>
        <div className="field">
          <label>Duration (seconds)</label>
          <input type="number" className="input" value={duration} min={1} max={30} onChange={(e) => setDuration(e.target.value)} disabled={busy} />
        </div>
        <div className="field">
          <label>FPS: {fps}</label>
          <input type="range" min={5} max={24} value={fps} onChange={(e) => setFps(parseInt(e.target.value, 10))} disabled={busy} />
        </div>
        <div className="field">
          <label>Width: {width}px</label>
          <input type="range" min={240} max={720} step={20} value={width} onChange={(e) => setWidth(parseInt(e.target.value, 10))} disabled={busy} />
        </div>
      </div>

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Working…" : "✨ Make GIF"}
      </button>

      {busy && <p style={{ color: "var(--muted)", marginTop: 12 }}>{status || "Working…"}</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && (
        <div style={{ marginTop: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="GIF preview" className="preview-img" style={{ maxHeight: 300 }} />
          <a className="btn" href={url} download={outName.current} style={{ display: "inline-flex", marginTop: 12 }}>⬇ Download GIF</a>
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser via ffmpeg.wasm — your video is never uploaded. Keep clips short (≤ ~15s) for best results.</p>
    </div>
  );
}
