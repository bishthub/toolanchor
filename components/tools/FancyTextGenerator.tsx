"use client";

import { useState } from "react";

// Map A-Z, a-z, 0-9 to Unicode style ranges by code-point offset where the
// alphabet is contiguous; fall back to per-char maps for the irregular ones.
function offsetMap(upperBase: number, lowerBase: number, digitBase?: number) {
  return (s: string) =>
    Array.from(s)
      .map((ch) => {
        const c = ch.codePointAt(0)!;
        if (c >= 65 && c <= 90) return String.fromCodePoint(upperBase + (c - 65));
        if (c >= 97 && c <= 122) return String.fromCodePoint(lowerBase + (c - 97));
        if (digitBase && c >= 48 && c <= 57) return String.fromCodePoint(digitBase + (c - 48));
        return ch;
      })
      .join("");
}

function combiner(mark: string) {
  return (s: string) => Array.from(s).map((ch) => (/\s/.test(ch) ? ch : ch + mark)).join("");
}

const STYLES: { name: string; fn: (s: string) => string }[] = [
  { name: "𝗕𝗼𝗹𝗱", fn: offsetMap(0x1d5d4, 0x1d5ee, 0x1d7ec) },
  { name: "𝘐𝘵𝘢𝘭𝘪𝘤", fn: offsetMap(0x1d608, 0x1d622) },
  { name: "𝘽𝙤𝙡𝙙 𝙄𝙩𝙖𝙡𝙞𝙘", fn: offsetMap(0x1d63c, 0x1d656) },
  { name: "𝒮𝒸𝓇𝒾𝓅𝓉", fn: offsetMap(0x1d49c, 0x1d4b6) },
  { name: "𝔉𝔯𝔞𝔨𝔱𝔲𝔯", fn: offsetMap(0x1d56c, 0x1d586) },
  { name: "𝕯𝖔𝖚𝖇𝖑𝖊", fn: offsetMap(0x1d538, 0x1d552, 0x1d7d8) },
  { name: "Ⓑⓤⓑⓑⓛⓔ", fn: offsetMap(0x24b6, 0x24d0) },
  { name: "🅱🅻🅾🅲🅺", fn: offsetMap(0x1f130, 0x1f130) },
  { name: "𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎", fn: offsetMap(0x1d670, 0x1d68a, 0x1d7f6) },
  { name: "Ｗｉｄｅ", fn: offsetMap(0xff21, 0xff41, 0xff10) },
  { name: "S̶t̶r̶i̶k̶e̶", fn: combiner("̶") },
  { name: "U̲n̲d̲e̲r̲l̲i̲n̲e̲", fn: combiner("̲") },
];

export default function FancyTextGenerator() {
  const [text, setText] = useState("Hello world");
  const [copied, setCopied] = useState<number | null>(null);

  async function copy(s: string, i: number) {
    await navigator.clipboard.writeText(s);
    setCopied(i);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Your text</label>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type something…" />
      </div>

      <ul className="file-list">
        {STYLES.map((st, i) => (
          <li key={st.name} style={{ cursor: "pointer" }} onClick={() => copy(st.fn(text), i)} title="Click to copy">
            <span style={{ fontSize: "1.05rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.fn(text) || st.name}</span>
            <span className="x" style={{ marginLeft: "auto" }}>{copied === i ? "✓ Copied" : "📋"}</span>
          </li>
        ))}
      </ul>

      <p className="privacy-note">🔒 Generated locally — click any style to copy. Works in bios, captions and messages.</p>
    </div>
  );
}
