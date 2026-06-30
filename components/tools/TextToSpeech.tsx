"use client";

import { useEffect, useState } from "react";

export default function TextToSpeech() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (v.length && !voiceName) setVoiceName(v.find((x) => x.default)?.name ?? v[0].name);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speak() {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.name === voiceName);
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = pitch;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  if (!supported) {
    return <p style={{ color: "var(--muted)" }}>Your browser doesn&apos;t support speech synthesis. Try a recent version of Chrome, Edge or Safari.</p>;
  }

  return (
    <div>
      <div className="field">
        <label>Text to read aloud</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text…" />
      </div>

      <div className="field">
        <label>Voice</label>
        <select className="input" value={voiceName} onChange={(e) => setVoiceName(e.target.value)}>
          {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
        </select>
      </div>

      <div className="row">
        <div className="field">
          <label>Speed: {rate.toFixed(1)}x</label>
          <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div className="field">
          <label>Pitch: {pitch.toFixed(1)}</label>
          <input type="range" min={0} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
      </div>

      <div className="row">
        <button className="btn" onClick={speak} disabled={!text.trim()}>{speaking ? "🔊 Speaking…" : "▶ Play"}</button>
        <button className="btn secondary" onClick={stop} disabled={!speaking}>■ Stop</button>
      </div>

      <p className="privacy-note">🔒 Speech is synthesized by your browser — your text is never uploaded.</p>
    </div>
  );
}
