"use client";

import { useMemo, useState } from "react";

// Invisible / special characters that AI assistants, word processors and web
// pages leave behind. Each gets a short visible token in the preview.
const INVISIBLES: { ch: string; code: string; name: string; token: string }[] = [
  { ch: "​", code: "U+200B", name: "Zero width space", token: "ZWSP" },
  { ch: "‌", code: "U+200C", name: "Zero width non-joiner", token: "ZWNJ" },
  { ch: "‍", code: "U+200D", name: "Zero width joiner", token: "ZWJ" },
  { ch: "⁠", code: "U+2060", name: "Word joiner", token: "WJ" },
  { ch: "﻿", code: "U+FEFF", name: "Byte order mark", token: "BOM" },
  { ch: "­", code: "U+00AD", name: "Soft hyphen", token: "SHY" },
  { ch: "‎", code: "U+200E", name: "Left-to-right mark", token: "LRM" },
  { ch: "‏", code: "U+200F", name: "Right-to-left mark", token: "RLM" },
  { ch: "‪", code: "U+202A", name: "LTR embedding", token: "LRE" },
  { ch: "‫", code: "U+202B", name: "RTL embedding", token: "RLE" },
  { ch: "‬", code: "U+202C", name: "Pop directional", token: "PDF" },
  { ch: "‭", code: "U+202D", name: "LTR override", token: "LRO" },
  { ch: "‮", code: "U+202E", name: "RTL override", token: "RLO" },
  { ch: "⁦", code: "U+2066", name: "LTR isolate", token: "LRI" },
  { ch: "⁧", code: "U+2067", name: "RTL isolate", token: "RLI" },
  { ch: "⁨", code: "U+2068", name: "First strong isolate", token: "FSI" },
  { ch: "⁩", code: "U+2069", name: "Pop isolate", token: "PDI" },
  { ch: "᠎", code: "U+180E", name: "Mongolian vowel separator", token: "MVS" },
];

const SPACES: { ch: string; code: string; name: string; token: string }[] = [
  { ch: " ", code: "U+00A0", name: "Non-breaking space", token: "NBSP" },
  { ch: " ", code: "U+202F", name: "Narrow no-break space", token: "NNBSP" },
  { ch: " ", code: "U+2000", name: "En quad", token: "SP" },
  { ch: " ", code: "U+2001", name: "Em quad", token: "SP" },
  { ch: " ", code: "U+2002", name: "En space", token: "SP" },
  { ch: " ", code: "U+2003", name: "Em space", token: "SP" },
  { ch: " ", code: "U+2004", name: "Three-per-em space", token: "SP" },
  { ch: " ", code: "U+2005", name: "Four-per-em space", token: "SP" },
  { ch: " ", code: "U+2006", name: "Six-per-em space", token: "SP" },
  { ch: " ", code: "U+2007", name: "Figure space", token: "SP" },
  { ch: " ", code: "U+2008", name: "Punctuation space", token: "SP" },
  { ch: " ", code: "U+2009", name: "Thin space", token: "SP" },
  { ch: " ", code: "U+200A", name: "Hair space", token: "SP" },
  { ch: "　", code: "U+3000", name: "Ideographic space", token: "SP" },
];

const ALL_SPECIAL = [...INVISIBLES, ...SPACES];
const SPECIAL_RE = new RegExp(`[${ALL_SPECIAL.map((s) => s.ch).join("")}]`, "g");

export default function AiTextCleaner() {
  const [text, setText] = useState("");
  const [optInvisible, setOptInvisible] = useState(true);
  const [optSpaces, setOptSpaces] = useState(true);
  const [optQuotes, setOptQuotes] = useState(true);
  const [optDashes, setOptDashes] = useState(false);
  const [optMarkdown, setOptMarkdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detection report: count every special char present.
  const report = useMemo(() => {
    const counts = new Map<string, { name: string; code: string; count: number }>();
    for (const def of ALL_SPECIAL) {
      let n = 0;
      for (let i = text.indexOf(def.ch); i !== -1; i = text.indexOf(def.ch, i + 1)) n++;
      if (n > 0) counts.set(def.ch, { name: def.name, code: def.code, count: n });
    }
    const smartQuotes = (text.match(/[“”„‟‘’‚‛]/g) ?? []).length;
    const dashes = (text.match(/[–—]/g) ?? []).length;
    const hiddenTotal = [...counts.values()].reduce((a, b) => a + b.count, 0);
    return { counts, smartQuotes, dashes, hiddenTotal };
  }, [text]);

  const cleaned = useMemo(() => {
    let out = text;
    if (optInvisible) {
      const re = new RegExp(`[${INVISIBLES.map((s) => s.ch).join("")}]`, "g");
      out = out.replace(re, "");
    }
    if (optSpaces) {
      const re = new RegExp(`[${SPACES.map((s) => s.ch).join("")}]`, "g");
      out = out.replace(re, " ");
    }
    if (optQuotes) {
      out = out.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'");
    }
    if (optDashes) {
      out = out.replace(/\s*—\s*/g, " - ").replace(/–/g, "-").replace(/ {2,}/g, " ");
    }
    if (optMarkdown) {
      out = out
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, "$1$2")
        .replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g, "$1$2")
        .replace(/`([^`\n]+)`/g, "$1");
    }
    return out;
  }, [text, optInvisible, optSpaces, optQuotes, optDashes, optMarkdown]);

  const removedCount = text.length - cleaned.length + (optQuotes ? report.smartQuotes : 0) + (optDashes ? report.dashes : 0);

  // Highlighted preview of the first 5000 chars with hidden chars made visible.
  const preview = useMemo(() => {
    if (report.hiddenTotal === 0) return null;
    const slice = text.slice(0, 5000);
    const parts = slice.split(SPECIAL_RE);
    const found = slice.match(SPECIAL_RE) ?? [];
    const nodes: React.ReactNode[] = [];
    parts.forEach((p, i) => {
      nodes.push(p);
      const ch = found[i];
      if (ch !== undefined) {
        const def = ALL_SPECIAL.find((s) => s.ch === ch)!;
        nodes.push(
          <mark key={i} title={`${def.name} (${def.code})`}
            style={{ background: "rgba(255,107,107,.22)", color: "#ff6b6b", borderRadius: 3, padding: "0 3px", fontSize: ".75em", fontWeight: 600 }}>
            {def.token}
          </mark>
        );
      }
    });
    return nodes;
  }, [text, report.hiddenTotal]);

  function copy() {
    navigator.clipboard.writeText(cleaned).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const check = (label: string, value: boolean, set: (v: boolean) => void) => (
    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: ".9rem" }}>
      <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  );

  return (
    <div>
      <div className="field">
        <label>Paste your text</label>
        <textarea className="input" rows={8} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Paste text to inspect for hidden characters…" />
      </div>

      {text && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
          {report.hiddenTotal === 0 ? (
            <p style={{ margin: 0, color: "var(--accent)" }}>✓ No hidden characters found{report.smartQuotes || report.dashes ? " — but there are typographic characters below" : ""}.</p>
          ) : (
            <p style={{ margin: 0, fontWeight: 600 }}>{report.hiddenTotal} hidden/special character{report.hiddenTotal === 1 ? "" : "s"} found</p>
          )}
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--muted)", fontSize: ".85rem" }}>
            {[...report.counts.values()].map((c) => (
              <li key={c.code}>{c.name} ({c.code}) × {c.count}</li>
            ))}
            {report.smartQuotes > 0 && <li>Smart quotes × {report.smartQuotes}</li>}
            {report.dashes > 0 && <li>Em/en dashes × {report.dashes}</li>}
          </ul>
        </div>
      )}

      {preview && (
        <div className="field">
          <label>Where they hide (first 5,000 characters)</label>
          <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10, maxHeight: 220, overflow: "auto", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: ".85rem", lineHeight: 1.6 }}>
            {preview}
          </div>
        </div>
      )}

      {text && (
        <>
          <div className="row" style={{ gap: 14, flexWrap: "wrap", margin: "10px 0" }}>
            {check("Remove invisible characters", optInvisible, setOptInvisible)}
            {check("Normalize special spaces", optSpaces, setOptSpaces)}
            {check("Straighten smart quotes", optQuotes, setOptQuotes)}
            {check("Replace em/en dashes", optDashes, setOptDashes)}
            {check("Strip markdown (** # `)", optMarkdown, setOptMarkdown)}
          </div>
          <p style={{ color: "var(--muted)", fontSize: ".8rem" }}>
            Note: removing zero-width joiners can break multi-part emoji (👩‍💻 → separate emoji).
          </p>

          <div className="field">
            <label>Cleaned text</label>
            <textarea className="input" rows={8} readOnly value={cleaned} />
          </div>
          <div className="row" style={{ alignItems: "center", gap: 12 }}>
            <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy cleaned text"}</button>
            {removedCount > 0 && (
              <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>
                {removedCount} character{removedCount === 1 ? "" : "s"} removed or normalized
              </span>
            )}
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Detection and cleaning run entirely in your browser — nothing you paste is uploaded.</p>
    </div>
  );
}
