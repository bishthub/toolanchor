"use client";

import { useState, useMemo } from "react";

const MORSE_MAP: Record<string, string> = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....",
  i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.",
  q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
  y: "-.--", z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-.",
  "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...", ";": "-.-.-.",
  "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-", '"': ".-..-.", "@": ".--.-.",
};

const REVERSE_MAP = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

function textToMorse(text: string): string {
  return text.toLowerCase().split("").map((ch) => {
    if (ch === " ") return "/";
    return MORSE_MAP[ch] || ch;
  }).filter(Boolean).join(" ");
}

function morseToText(morse: string): string {
  return morse.trim().split(/\s+/).map((code) => {
    if (code === "/") return " ";
    return REVERSE_MAP[code] || code;
  }).join("");
}

type Mode = "to-morse" | "from-morse";

export default function MorseCodeConverter() {
  const [input, setInput] = useState("SOS");
  const [mode, setMode] = useState<Mode>("to-morse");
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    return mode === "to-morse" ? textToMorse(input) : morseToText(input);
  }, [input, mode]);

  function playMorse() {
    const morse = mode === "to-morse" ? output : (() => {
      // Play from morse input
      return input.trim().replace(/\s+\/\s+/g, " / ").trim();
    })();

    if (!morse) return;
    const ctx = new AudioContext();
    const dot = 0.08; // seconds
    const dash = dot * 3;
    const gap = dot;
    const letterGap = dot * 3;
    const wordGap = dot * 7;

    let time = ctx.currentTime + 0.1;
    for (const ch of morse) {
      if (ch === ".") { beep(ctx, time, dot); time += dot + gap; }
      else if (ch === "-") { beep(ctx, time, dash); time += dash + gap; }
      else if (ch === " ") { time += letterGap; }
      else if (ch === "/") { time += wordGap; }
    }
  }

  return (
    <div>
      <div className="field">
        <label>Mode</label>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className={mode === "to-morse" ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => setMode("to-morse")}>Text → Morse</button>
          <button type="button" className={mode === "from-morse" ? "btn" : "btn secondary"} style={{ padding: "8px 14px", fontSize: ".85rem" }} onClick={() => setMode("from-morse")}>Morse → Text</button>
        </div>
      </div>

      <div className="field">
        <label>{mode === "to-morse" ? "Text input" : "Morse code input"}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "to-morse" ? "Type your text here…" : "e.g. ... --- ..."}
          style={{ minHeight: 100, fontFamily: mode === "from-morse" ? "var(--font-mono), monospace" : undefined }}
        />
      </div>

      {input && (
        <div className="field">
          <label>{mode === "to-morse" ? "Morse code" : "Decoded text"}</label>
          <textarea
            readOnly
            value={output}
            style={{ minHeight: 80, fontFamily: "var(--font-mono), monospace", fontSize: "1rem", lineHeight: 1.7 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={() => navigator.clipboard.writeText(output)}>Copy result</button>
            <button className="btn secondary" onClick={playMorse}>🔊 Play audio</button>
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 Converts entirely in your browser. Audio is generated locally using Web Audio API.</p>
    </div>
  );
}

function beep(ctx: AudioContext, time: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 700;
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.setValueAtTime(0, time + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + duration);
}
