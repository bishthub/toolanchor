"use client";

import { useEffect, useRef, useState } from "react";
import { getFfmpeg, toFileData } from "@/lib/ffmpeg";
import SendToTool from "@/components/SendToTool";

export default function TrimVideo({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [dur, setDur] = useState(0);
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const outName = useRef("clip.mp4");

  function pick(f: File | null) {
    setError(null); setUrl(null); setFile(f);
    if (f) { const u = URL.createObjectURL(f); setSrcUrl(u); setStart("0"); setEnd(""); }
    else setSrcUrl(null);
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("video/"));
    if (f) pick(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function run() {
    if (!file) return;
    const s = parseFloat(start) || 0;
    const e = parseFloat(end) || dur;
    if (e <= s) { setError("End time must be after the start time."); return; }
    setBusy(true); setError(null); setUrl(null); setStatus("Loading…");
    let ff: Awaited<ReturnType<typeof getFfmpeg>> | null = null;
    const onProgress = ({ progress }: { progress: number }) =>
      setStatus(`Trimming… ${Math.min(100, Math.round(progress * 100))}%`);
    try {
      ff = await getFfmpeg(setStatus);
      ff.on("progress", onProgress);
      const ext = file.name.match(/\.[a-z0-9]+$/i)?.[0] || ".mp4";
      const inName = "input" + ext;
      const out = "output" + ext;
      outName.current = file.name.replace(/\.[^.]+$/, "") + "-clip" + ext;
      await ff.writeFile(inName, await toFileData(file));
      // Stream copy — fast and codec-agnostic (no re-encode, no quality loss).
      await ff.exec(["-ss", String(s), "-i", inName, "-t", String(e - s), "-c", "copy", out]);
      const data = (await ff.readFile(out)) as Uint8Array;
      await ff.deleteFile(inName).catch(() => {});
      await ff.deleteFile(out).catch(() => {});
      const type = ext === ".webm" ? "video/webm" : ext === ".mov" ? "video/quicktime" : "video/mp4";
      setUrl(URL.createObjectURL(new Blob([data.slice().buffer], { type })));
      setStatus("");
    } catch (err) {
      console.error(err);
      setError("Could not trim this video. Try a different file or a shorter clip.");
    } finally {
      if (ff) ff.off("progress", onProgress);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose a video file</label>
        <input type="file" accept="video/*" onChange={(e) => pick(e.target.files?.[0] || null)} className="input" disabled={busy} />
      </div>

      {srcUrl && (
        <video
          src={srcUrl}
          controls
          className="preview-img"
          style={{ maxHeight: 260, width: "100%" }}
          onLoadedMetadata={(e) => {
            const d = (e.target as HTMLVideoElement).duration;
            if (Number.isFinite(d)) { setDur(d); setEnd(d.toFixed(1)); }
          }}
        />
      )}

      {dur > 0 && (
        <div className="row">
          <div className="field">
            <label>Start (s)</label>
            <input type="number" className="input" min={0} max={dur} step="0.1" value={start} onChange={(e) => setStart(e.target.value)} disabled={busy} />
          </div>
          <div className="field">
            <label>End (s) — clip is {dur.toFixed(1)}s long</label>
            <input type="number" className="input" min={0} max={dur} step="0.1" value={end} onChange={(e) => setEnd(e.target.value)} disabled={busy} />
          </div>
        </div>
      )}

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Working…" : "✂️ Trim & export"}
      </button>

      {busy && <p style={{ color: "var(--muted)", marginTop: 12 }}>{status || "Working…"}</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && (
        <div style={{ marginTop: 16 }}>
          <video controls src={url} className="preview-img" style={{ maxHeight: 260, width: "100%" }} />
          <a className="btn" href={url} download={outName.current} style={{ display: "inline-flex", marginTop: 12 }}>⬇ Download clip</a>

          <SendToTool
            kind="media"
            exclude="trim-video"
            getFile={async () => {
              if (!url) return null;
              const blob = await fetch(url).then((r) => r.blob());
              return new File([blob], outName.current, { type: blob.type || "video/mp4" });
            }}
          />
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser via ffmpeg.wasm — your video is never uploaded. Trimming copies the stream, so there's no quality loss.</p>
    </div>
  );
}
