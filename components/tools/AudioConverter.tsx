"use client";

import { useEffect, useRef, useState } from "react";
import { getFfmpeg, toFileData } from "@/lib/ffmpeg";
import SendToTool from "@/components/SendToTool";

type Fmt = "mp3" | "wav" | "ogg" | "m4a";
const MIME: Record<Fmt, string> = { mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", m4a: "audio/mp4" };
const LOSSLESS: Record<Fmt, boolean> = { mp3: false, wav: true, ogg: false, m4a: false };

export default function AudioConverter({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<Fmt>("mp3");
  const [bitrate, setBitrate] = useState("192");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const outName = useRef("audio.mp3");

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("audio/") || x.type.startsWith("video/"));
    if (f) { setFile(f); setError(null); setUrl(null); }
  }, [initialFiles]);

  async function run() {
    if (!file) return;
    setBusy(true); setError(null); setUrl(null); setStatus("Loading…");
    let ff: Awaited<ReturnType<typeof getFfmpeg>> | null = null;
    const onProgress = ({ progress }: { progress: number }) =>
      setStatus(`Converting… ${Math.min(100, Math.round(progress * 100))}%`);
    try {
      ff = await getFfmpeg(setStatus);
      ff.on("progress", onProgress);
      const inName = "input" + (file.name.match(/\.[a-z0-9]+$/i)?.[0] || ".mp3");
      const out = `output.${format}`;
      outName.current = file.name.replace(/\.[^.]+$/, "") + `.${format}`;
      await ff.writeFile(inName, await toFileData(file));
      // -vn drops any video track; lossy formats take a bitrate.
      const args = ["-i", inName, "-vn"];
      if (!LOSSLESS[format]) args.push("-b:a", `${bitrate}k`);
      args.push(out);
      await ff.exec(args);
      const data = (await ff.readFile(out)) as Uint8Array;
      await ff.deleteFile(inName).catch(() => {});
      await ff.deleteFile(out).catch(() => {});
      setUrl(URL.createObjectURL(new Blob([data.slice().buffer], { type: MIME[format] })));
      setStatus("");
    } catch (err) {
      console.error(err);
      setError("Could not convert this file. Try a different source file.");
    } finally {
      if (ff) ff.off("progress", onProgress);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="field">
        <label>Choose an audio (or video) file</label>
        <input type="file" accept="audio/*,video/*" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); setUrl(null); }} className="input" disabled={busy} />
      </div>

      <div className="row">
        <div className="field">
          <label>Convert to</label>
          <select className="input" value={format} onChange={(e) => setFormat(e.target.value as Fmt)} disabled={busy}>
            <option value="mp3">MP3 (universal)</option>
            <option value="wav">WAV (lossless)</option>
            <option value="ogg">OGG (open, small)</option>
            <option value="m4a">M4A / AAC (Apple)</option>
          </select>
        </div>
        {!LOSSLESS[format] && (
          <div className="field">
            <label>Quality</label>
            <select className="input" value={bitrate} onChange={(e) => setBitrate(e.target.value)} disabled={busy}>
              <option value="128">128 kbps (smaller)</option>
              <option value="192">192 kbps (recommended)</option>
              <option value="320">320 kbps (best)</option>
            </select>
          </div>
        )}
      </div>

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Working…" : `🎧 Convert to ${format.toUpperCase()}`}
      </button>

      {busy && <p style={{ color: "var(--muted)", marginTop: 12 }}>{status || "Working…"}</p>}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && (
        <div style={{ marginTop: 16 }}>
          <audio controls src={url} style={{ width: "100%" }} />
          <a className="btn" href={url} download={outName.current} style={{ display: "inline-flex", marginTop: 12 }}>⬇ Download {format.toUpperCase()}</a>

          <SendToTool
            kind="media"
            exclude="audio-converter"
            getFile={async () => {
              if (!url) return null;
              const blob = await fetch(url).then((r) => r.blob());
              return new File([blob], outName.current, { type: MIME[format] });
            }}
          />
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser via ffmpeg.wasm — your audio is never uploaded. First run downloads the engine (cached after).</p>
    </div>
  );
}
