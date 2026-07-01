"use client";

import { useEffect, useRef, useState } from "react";
import { getFfmpeg, toFileData } from "@/lib/ffmpeg";

export default function Mp4ToMp3({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState("192");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const outName = useRef("audio.mp3");

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("video/") || x.type.startsWith("audio/"));
    if (f) { setFile(f); setError(null); }
  }, [initialFiles]);

  async function run() {
    if (!file) return;
    setBusy(true); setError(null); setUrl(null); setStatus("Loading…");
    let ff: Awaited<ReturnType<typeof getFfmpeg>> | null = null;
    const onProgress = ({ progress }: { progress: number }) =>
      setStatus(`Extracting audio… ${Math.min(100, Math.round(progress * 100))}%`);
    try {
      ff = await getFfmpeg(setStatus);
      ff.on("progress", onProgress);
      const inName = "input" + (file.name.match(/\.[a-z0-9]+$/i)?.[0] || ".mp4");
      outName.current = file.name.replace(/\.[^.]+$/, "") + ".mp3";
      await ff.writeFile(inName, await toFileData(file));
      await ff.exec(["-i", inName, "-vn", "-b:a", `${bitrate}k`, "output.mp3"]);
      const data = (await ff.readFile("output.mp3")) as Uint8Array;
      await ff.deleteFile(inName).catch(() => {});
      await ff.deleteFile("output.mp3").catch(() => {});
      setUrl(URL.createObjectURL(new Blob([data.slice().buffer], { type: "audio/mpeg" })));
      setStatus("");
    } catch (err) {
      console.error(err);
      setError("Could not extract the audio. Very large files can exceed browser memory — try a shorter clip.");
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

      <div className="field">
        <label>MP3 quality</label>
        <select className="input" value={bitrate} onChange={(e) => setBitrate(e.target.value)} disabled={busy}>
          <option value="128">128 kbps (smaller)</option>
          <option value="192">192 kbps (recommended)</option>
          <option value="320">320 kbps (best)</option>
        </select>
      </div>

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Working…" : "🎵 Extract MP3"}
      </button>

      {busy && <p style={{ color: "var(--muted)", marginTop: 12 }}>{status || "Working…"}</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && (
        <div style={{ marginTop: 16 }}>
          <audio controls src={url} style={{ width: "100%" }} />
          <a className="btn" href={url} download={outName.current} style={{ display: "inline-flex", marginTop: 12 }}>⬇ Download MP3</a>
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser via ffmpeg.wasm — your video is never uploaded. First run downloads the engine (cached after).</p>
    </div>
  );
}
