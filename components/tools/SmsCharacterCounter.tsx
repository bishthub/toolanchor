"use client";

import { useMemo, useState } from "react";

// GSM 03.38 basic character set (each counts as 1 septet).
const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

// GSM 03.38 extension set (each counts as 2 septets: ESC + char).
const GSM_EXT = "^{}\\[~]|€\f";

const GSM_BASIC_SET = new Set(GSM_BASIC);
const GSM_EXT_SET = new Set(GSM_EXT);

// Common non-GSM characters with a GSM-safe replacement.
const GSM_SWAPS: Record<string, string> = {
  "’": "'", // ’
  "‘": "'", // ‘
  "“": '"', // “
  "”": '"', // ”
  "—": "-", // —
  "–": "-", // –
  "…": "...", // …
  " ": " ", // non-breaking space
  "•": "-", // •
};

const GSM_SINGLE = 160;
const GSM_MULTI = 153;
const UCS2_SINGLE = 70;
const UCS2_MULTI = 67;

function gsmWeight(ch: string): number {
  return GSM_EXT_SET.has(ch) ? 2 : 1;
}

// Split on weighted length; an extension char (2 septets) is atomic so its
// ESC + char pair never straddles a part boundary.
function splitGsm(text: string, perPart: number): string[] {
  const parts: string[] = [];
  let cur = "";
  let curLen = 0;
  for (const ch of text) {
    const w = gsmWeight(ch);
    if (curLen + w > perPart) {
      parts.push(cur);
      cur = ch;
      curLen = w;
    } else {
      cur += ch;
      curLen += w;
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

// UCS-2 counts UTF-16 code units; iterate by code point so a surrogate pair
// (e.g. an emoji, 2 units) is never split across parts.
function splitUcs2(text: string, perPart: number): string[] {
  const parts: string[] = [];
  let cur = "";
  let curLen = 0;
  for (const ch of Array.from(text)) {
    const w = ch.length;
    if (curLen + w > perPart) {
      parts.push(cur);
      cur = ch;
      curLen = w;
    } else {
      cur += ch;
      curLen += w;
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

function gsmLength(text: string): number {
  let len = 0;
  for (const ch of text) len += gsmWeight(ch);
  return len;
}

export default function SmsCharacterCounter() {
  const [text, setText] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const analysis = useMemo(() => {
    const offenders: string[] = [];
    let isGsm = true;
    for (const ch of Array.from(text)) {
      if (!GSM_BASIC_SET.has(ch) && !GSM_EXT_SET.has(ch)) {
        isGsm = false;
        if (!offenders.includes(ch)) offenders.push(ch);
      }
    }
    const length = isGsm ? gsmLength(text) : text.length;
    const single = isGsm ? GSM_SINGLE : UCS2_SINGLE;
    const multi = isGsm ? GSM_MULTI : UCS2_MULTI;
    const perPart = length <= single ? single : multi;
    const parts =
      length <= single
        ? text ? [text] : []
        : isGsm ? splitGsm(text, multi) : splitUcs2(text, multi);
    const lastLen = parts.length
      ? isGsm ? gsmLength(parts[parts.length - 1]) : parts[parts.length - 1].length
      : 0;
    return {
      isGsm,
      offenders,
      length,
      parts,
      remaining: parts.length ? perPart - lastLen : single,
    };
  }, [text]);

  const swappable = analysis.offenders.filter((ch) => GSM_SWAPS[ch] !== undefined);

  async function copy(idx: number, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  }

  function applySwaps() {
    let out = text;
    for (const [from, to] of Object.entries(GSM_SWAPS)) out = out.split(from).join(to);
    setText(out);
  }

  return (
    <div>
      <div className="field">
        <label htmlFor="sms">Your message</label>
        <textarea
          id="sms"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your SMS message…"
          style={{ minHeight: 160, fontSize: "1rem" }}
        />
      </div>

      <div className="stats">
        <div className="stat">
          <div className="n">{analysis.length}</div>
          <div className="l">Characters{analysis.isGsm ? " (GSM)" : ""}</div>
        </div>
        <div className="stat">
          <div className="n">{analysis.isGsm ? "GSM-7" : "UCS-2"}</div>
          <div className="l">Encoding</div>
        </div>
        <div className="stat">
          <div className="n">{analysis.parts.length}</div>
          <div className="l">{analysis.parts.length === 1 ? "Segment" : "Segments"}</div>
        </div>
        <div className="stat">
          <div className="n">{analysis.remaining}</div>
          <div className="l">Left in part</div>
        </div>
      </div>

      {analysis.offenders.length > 0 && (
        <div className="field" style={{ marginTop: 14 }}>
          <label>Characters forcing UCS-2 (limit drops to 70/67 per part)</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {analysis.offenders.map((ch) => (
              <span key={ch} className="mono" style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontSize: ".85rem" }}>
                {ch === " " ? "nbsp" : ch}
                {GSM_SWAPS[ch] !== undefined && (
                  <span style={{ color: "var(--muted)" }}> → {GSM_SWAPS[ch] === " " ? "space" : GSM_SWAPS[ch]}</span>
                )}
              </span>
            ))}
            {swappable.length > 0 && (
              <button type="button" className="btn secondary" style={{ padding: "6px 12px", fontSize: ".8rem" }} onClick={applySwaps}>
                Apply suggested replacements
              </button>
            )}
          </div>
          <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 6 }}>
            {swappable.length > 0
              ? `Tip: replace ${swappable[0]} with ${GSM_SWAPS[swappable[0]] === " " ? "a plain space" : GSM_SWAPS[swappable[0]]} (and similar swaps) to stay in GSM-7 and keep 160 characters per SMS.`
              : "These characters have no GSM-7 equivalent — removing them switches the message back to 160 characters per SMS."}
          </p>
        </div>
      )}

      {analysis.parts.length > 1 && (
        <div className="field" style={{ marginTop: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ margin: 0 }}>Split into {analysis.parts.length} parts</label>
            <button type="button" className="btn secondary" style={{ padding: "6px 12px", fontSize: ".8rem" }} onClick={() => copy(-1, analysis.parts.join("\n\n"))}>
              {copiedIdx === -1 ? "Copied!" : "Copy all parts"}
            </button>
          </div>
          {analysis.parts.map((part, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: ".78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Part {i + 1}/{analysis.parts.length} · {analysis.isGsm ? gsmLength(part) : part.length} chars
                </span>
                <button type="button" className="btn secondary" style={{ padding: "4px 10px", fontSize: ".75rem" }} onClick={() => copy(i, part)}>
                  {copiedIdx === i ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="mono" style={{ fontSize: ".9rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{part}</div>
            </div>
          ))}
        </div>
      )}

      <p className="privacy-note">🔒 Your message never leaves this browser tab — nothing is uploaded.</p>
    </div>
  );
}
