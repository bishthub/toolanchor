"use client";

import { useEffect, useRef, useState } from "react";

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function VoiceRecorder() {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [mp3Url, setMp3Url] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }

  async function start() {
    setError(null); setUrl(null); setMp3Url(null); setSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Live level meter.
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
        setLevel(Math.min(1, peak / 96));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
        setUrl(URL.createObjectURL(blob));
        cleanup();
        setLevel(0);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setPaused(false);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error(err);
      setError("Couldn't access the microphone. Check that you granted permission and no other app is using it.");
      cleanup();
    }
  }

  function stop() {
    recRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setPaused(false);
  }

  function togglePause() {
    const rec = recRef.current;
    if (!rec) return;
    if (paused) {
      rec.resume();
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      setPaused(false);
    } else {
      rec.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setPaused(true);
    }
  }

  async function toMp3() {
    if (!url) return;
    setConverting(true);
    try {
      const { getFfmpeg, toFileData } = await import("@/lib/ffmpeg");
      const ff = await getFfmpeg();
      const blob = await fetch(url).then((r) => r.blob());
      await ff.writeFile("rec.webm", await toFileData(new File([blob], "rec.webm")));
      await ff.exec(["-i", "rec.webm", "-vn", "-b:a", "192k", "rec.mp3"]);
      const data = (await ff.readFile("rec.mp3")) as Uint8Array;
      await ff.deleteFile("rec.webm").catch(() => {});
      await ff.deleteFile("rec.mp3").catch(() => {});
      setMp3Url(URL.createObjectURL(new Blob([data.slice().buffer], { type: "audio/mpeg" })));
    } catch (err) {
      console.error(err);
      setError("Could not convert to MP3. You can still download the original recording.");
    } finally {
      setConverting(false);
    }
  }

  if (!supported) {
    return <p style={{ color: "var(--muted)" }}>Your browser doesn’t support in-browser audio recording. Try a recent version of Chrome, Edge, Firefox or Safari.</p>;
  }

  return (
    <div>
      <div className="recorder-panel">
        <div className="recorder-time">{mmss(seconds)}</div>
        <div className="recorder-meter" aria-hidden="true">
          <div className="recorder-meter-fill" style={{ width: `${Math.round(level * 100)}%` }} />
        </div>
        <div className="recorder-controls">
          {!recording ? (
            <button className="btn" onClick={start}>● Start recording</button>
          ) : (
            <>
              <button className="btn secondary" onClick={togglePause}>{paused ? "Resume" : "Pause"}</button>
              <button className="btn" onClick={stop}>■ Stop</button>
            </>
          )}
        </div>
      </div>

      {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}

      {url && !recording && (
        <div style={{ marginTop: 16 }}>
          <audio controls src={url} style={{ width: "100%" }} />
          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn" href={url} download="recording.webm" style={{ display: "inline-flex" }}>⬇ Download (WebM)</a>
            {mp3Url ? (
              <a className="btn secondary" href={mp3Url} download="recording.mp3" style={{ display: "inline-flex" }}>⬇ Download MP3</a>
            ) : (
              <button className="btn secondary" onClick={toMp3} disabled={converting}>{converting ? "Converting…" : "Convert to MP3"}</button>
            )}
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 Recording happens entirely in your browser — nothing is uploaded. MP3 conversion runs locally via ffmpeg.wasm.</p>
    </div>
  );
}
