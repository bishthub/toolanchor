"use client";

import { useEffect, useRef, useState } from "react";
import { getFfmpeg, toFileData } from "@/lib/ffmpeg";
import SendToTool from "@/components/SendToTool";

function fmt(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// CRF: lower = higher quality + bigger file. These are sensible H.264 points.
const QUALITY: Record<string, { crf: number; label: string }> = {
  high: { crf: 23, label: "High quality" },
  medium: { crf: 28, label: "Balanced" },
  low: { crf: 33, label: "Smallest file" },
};

export default function CompressVideo({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<keyof typeof QUALITY>("medium");
  const [to720, setTo720] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const outName = useRef("compressed.mp4");

  function pick(f: File | null) {
    setError(null); setResult(null); setFile(f);
    setSrcUrl(f ? URL.createObjectURL(f) : null);
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("video/"));
    if (f) pick(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function run() {
    if (!file) return;
    setBusy(true); setError(null); setResult(null); setStatus("Loading…");
    let ff: Awaited<ReturnType<typeof getFfmpeg>> | null = null;
    const onProgress = ({ progress }: { progress: number }) =>
      setStatus(`Compressing… ${Math.min(100, Math.round(progress * 100))}% (this can take a while)`);
    try {
      ff = await getFfmpeg(setStatus);
      ff.on("progress", onProgress);
      const inName = "input" + (file.name.match(/\.[a-z0-9]+$/i)?.[0] || ".mp4");
      outName.current = file.name.replace(/\.[^.]+$/, "") + "-compressed.mp4";
      await ff.writeFile(inName, await toFileData(file));
      const args = ["-i", inName, "-c:v", "libx264", "-crf", String(QUALITY[quality].crf), "-preset", "veryfast"];
      // scale=-2 keeps width even (H.264 requirement) and preserves aspect ratio.
      if (to720) args.push("-vf", "scale=-2:'min(720,ih)'");
      args.push("-c:a", "aac", "-b:a", "128k", "output.mp4");
      await ff.exec(args);
      const data = (await ff.readFile("output.mp4")) as Uint8Array;
      await ff.deleteFile(inName).catch(() => {});
      await ff.deleteFile("output.mp4").catch(() => {});
      const blob = new Blob([data.slice().buffer], { type: "video/mp4" });
      setResult({ url: URL.createObjectURL(blob), size: blob.size });
      setStatus("");
    } catch (err) {
      console.error(err);
      setError("Could not compress this video. Very large files can exceed browser memory — try a shorter clip.");
    } finally {
      if (ff) ff.off("progress", onProgress);
      setBusy(false);
    }
  }

  const saved = result && file && file.size > 0 ? Math.round((1 - result.size / file.size) * 100) : 0;
  const big = file && file.size > 200 * 1024 * 1024;

  return (
    <div>
      <div className="field">
        <label>Choose a video file</label>
        <input type="file" accept="video/*" onChange={(e) => pick(e.target.files?.[0] || null)} className="input" disabled={busy} />
      </div>

      {file && <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>Selected: {file.name} ({fmt(file.size)})</p>}
      {big && <p style={{ color: "#d9944b", fontSize: ".82rem", marginTop: 4 }}>This is a large file. In-browser compression is single-threaded and may be slow or run out of memory — a shorter clip works best.</p>}

      {srcUrl && <video src={srcUrl} controls className="preview-img" style={{ maxHeight: 240, width: "100%", marginTop: 8 }} />}

      <div className="row">
        <div className="field">
          <label>Quality</label>
          <select className="input" value={quality} onChange={(e) => setQuality(e.target.value as keyof typeof QUALITY)} disabled={busy}>
            {Object.entries(QUALITY).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Resolution</label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)", fontSize: ".9rem", marginTop: 8 }}>
            <input type="checkbox" checked={to720} onChange={(e) => setTo720(e.target.checked)} disabled={busy} />
            Scale down to 720p (bigger savings)
          </label>
        </div>
      </div>

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Working…" : "🎬 Compress video"}
      </button>

      {busy && <p style={{ color: "var(--muted)", marginTop: 12 }}>{status || "Working…"}</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div className="stats">
            <div className="stat"><div className="n">{fmt(file!.size)}</div><div className="l">Original</div></div>
            <div className="stat"><div className="n">{fmt(result.size)}</div><div className="l">Compressed</div></div>
            <div className="stat"><div className="n">{saved > 0 ? saved : 0}%</div><div className="l">Saved</div></div>
          </div>
          {saved <= 0 && <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 8 }}>Already well-compressed — try “Smallest file” or 720p for more savings.</p>}
          <video controls src={result.url} className="preview-img" style={{ maxHeight: 240, width: "100%", marginTop: 8 }} />
          <a className="btn" href={result.url} download={outName.current} style={{ display: "inline-flex", marginTop: 12 }}>⬇ Download compressed video</a>

          <SendToTool
            kind="media"
            exclude="compress-video"
            getFile={async () => {
              if (!result) return null;
              const blob = await fetch(result.url).then((r) => r.blob());
              return new File([blob], outName.current, { type: "video/mp4" });
            }}
          />
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser via ffmpeg.wasm — your video is never uploaded. First run downloads the engine (~32 MB, cached after).</p>
    </div>
  );
}
