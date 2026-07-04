"use client";

import { useEffect, useRef, useState } from "react";

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ScreenRecorder() {
  const [supported, setSupported] = useState(true);
  const [withMic, setWithMic] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamsRef = useRef<MediaStream[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia && typeof MediaRecorder !== "undefined");
    return () => stopStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStreams() {
    if (timerRef.current) clearInterval(timerRef.current);
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
  }

  async function start() {
    setError(null); setUrl(null); setSeconds(0);
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const tracks = [...display.getVideoTracks(), ...display.getAudioTracks()];
      streamsRef.current = [display];

      // Optionally mix in the microphone alongside any system audio.
      if (withMic) {
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamsRef.current.push(mic);
          tracks.push(...mic.getAudioTracks());
        } catch { /* mic denied — continue with screen only */ }
      }

      const combined = new MediaStream(tracks);
      const mime = MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "";
      const rec = new MediaRecorder(combined, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "video/webm" });
        setUrl(URL.createObjectURL(blob));
        stopStreams();
        setRecording(false);
      };
      // If the user clicks the browser's native "Stop sharing", end cleanly.
      display.getVideoTracks()[0]?.addEventListener("ended", () => { if (recRef.current?.state !== "inactive") recRef.current?.stop(); });

      rec.start();
      recRef.current = rec;
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error(err);
      setError("Screen recording was cancelled or blocked. Grant screen-share permission and try again. (Not available on most mobile browsers.)");
      stopStreams();
    }
  }

  function stop() {
    recRef.current?.stop();
  }

  if (!supported) {
    return <p style={{ color: "var(--muted)" }}>Your browser doesn’t support screen recording. Use a desktop version of Chrome, Edge or Firefox. (Screen capture isn’t available on most mobile browsers.)</p>;
  }

  return (
    <div>
      {!recording && !url && (
        <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)", fontSize: ".9rem", marginBottom: 14 }}>
          <input type="checkbox" checked={withMic} onChange={(e) => setWithMic(e.target.checked)} />
          Also record my microphone (for narration)
        </label>
      )}

      <div className="recorder-panel">
        <div className="recorder-time">{mmss(seconds)}</div>
        <div className="recorder-controls">
          {!recording ? (
            <button className="btn" onClick={start}>● Choose screen &amp; record</button>
          ) : (
            <button className="btn" onClick={stop}>■ Stop recording</button>
          )}
        </div>
        {recording && <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 4 }}>Recording… you can also click the browser’s “Stop sharing” bar.</p>}
      </div>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && !recording && (
        <div style={{ marginTop: 16 }}>
          <video controls src={url} className="preview-img" style={{ maxHeight: 300, width: "100%" }} />
          <a className="btn" href={url} download="screen-recording.webm" style={{ display: "inline-flex", marginTop: 12 }}>⬇ Download recording (WebM)</a>
          <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 8 }}>Need MP4? Convert the WebM with the <a href="/tools/compress-video" style={{ color: "var(--accent)" }}>video compressor</a>.</p>
        </div>
      )}

      <p className="privacy-note">🔒 The recording is captured and saved entirely in your browser — nothing is uploaded to any server.</p>
    </div>
  );
}
