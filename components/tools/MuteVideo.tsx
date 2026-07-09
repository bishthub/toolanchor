"use client";

import { useEffect, useRef, useState } from "react";
import { getFfmpeg, toFileData } from "@/lib/ffmpeg";
import WasmProgress from "@/components/WasmProgress";
import SendToTool from "@/components/SendToTool";

export default function MuteVideo({ initialFiles }: { initialFiles?: File[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [progressPct, setProgressPct] = useState<number | undefined>(undefined);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const outName = useRef("muted.mp4");

  function pick(f: File | null) {
    setError(null); setUrl(null); setFile(f);
    setSrcUrl(f ? URL.createObjectURL(f) : null);
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("video/"));
    if (f) pick(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  async function run() {
    if (!file) return;
    setBusy(true); setError(null); setUrl(null); setStatus("Loading…"); setProgressPct(undefined);
    let ff: Awaited<ReturnType<typeof getFfmpeg>> | null = null;
    const onProgress = ({ progress }: { progress: number }) => {
      const pct = Math.min(100, Math.round(progress * 100));
      setProgressPct(pct);
      setStatus(`Removing audio… ${pct}%`);
    };
    try {
      ff = await getFfmpeg(setStatus);
      ff.on("progress", onProgress);
      const ext = file.name.match(/\.[a-z0-9]+$/i)?.[0] || ".mp4";
      const inName = "input" + ext;
      const out = "output" + ext;
      outName.current = file.name.replace(/\.[^.]+$/, "") + "-muted" + ext;
      await ff.writeFile(inName, await toFileData(file));
      // Drop the audio track, copy the video stream untouched — near-instant.
      await ff.exec(["-i", inName, "-an", "-c:v", "copy", out]);
      const data = (await ff.readFile(out)) as Uint8Array;
      await ff.deleteFile(inName).catch(() => {});
      await ff.deleteFile(out).catch(() => {});
      const type = ext === ".webm" ? "video/webm" : ext === ".mov" ? "video/quicktime" : "video/mp4";
      setUrl(URL.createObjectURL(new Blob([data.slice().buffer], { type })));
      setStatus("");
    } catch (err) {
      console.error(err);
      setError("Could not process this video. Try a different file or format (MP4 works best).");
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

      {srcUrl && <video src={srcUrl} controls className="preview-img" style={{ maxHeight: 260, width: "100%" }} />}

      <button className="btn" onClick={run} disabled={!file || busy}>
        {busy ? "Working…" : "🔇 Remove audio"}
      </button>

      {busy && <WasmProgress status={status || "Working…"} pct={progressPct} />}
      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && (
        <div style={{ marginTop: 16 }}>
          <video controls src={url} className="preview-img" style={{ maxHeight: 260, width: "100%" }} />
          <a className="btn" href={url} download={outName.current} style={{ display: "inline-flex", marginTop: 12 }}>⬇ Download muted video</a>

          <SendToTool
            kind="media"
            exclude="mute-video"
            getFile={async () => {
              if (!url) return null;
              const blob = await fetch(url).then((r) => r.blob());
              return new File([blob], outName.current, { type: file?.type || "video/mp4" });
            }}
          />
        </div>
      )}

      <p className="privacy-note">🔒 Runs in your browser via ffmpeg.wasm — your video is never uploaded. The video stream is copied untouched, so there’s no quality loss.</p>
    </div>
  );
}
