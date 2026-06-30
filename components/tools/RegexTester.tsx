"use client";

import { useMemo, useState } from "react";

const FLAGS = ["g", "i", "m", "s", "u"] as const;

export default function RegexTester() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [text, setText] = useState("Contact us at hi@example.com or sales@test.org.");

  const { error, matches, html } = useMemo(() => {
    if (!pattern) return { error: null, matches: [], html: escapeHtml(text) };
    try {
      const fl = flags.includes("g") ? flags.join("") : flags.join("") + "g";
      const re = new RegExp(pattern, fl);
      const found: { match: string; groups: string[] }[] = [];
      let out = "";
      let last = 0;
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(text)) && guard++ < 10000) {
        out += escapeHtml(text.slice(last, m.index));
        out += `<mark style="background:var(--accent-soft);color:var(--text);border-radius:3px">${escapeHtml(m[0])}</mark>`;
        last = m.index + m[0].length;
        found.push({ match: m[0], groups: m.slice(1) });
        if (m[0] === "") re.lastIndex++;
      }
      out += escapeHtml(text.slice(last));
      return { error: null, matches: found, html: out };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Invalid regex", matches: [], html: escapeHtml(text) };
    }
  }, [pattern, flags, text]);

  function toggleFlag(f: string) {
    setFlags((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  return (
    <div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field">
          <label>Pattern</label>
          <input className="input mono" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="\d+" />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Flags</label>
          <div className="row">
            {FLAGS.map((f) => (
              <button key={f} type="button" className={`btn ${flags.includes(f) ? "" : "secondary"}`} style={{ padding: "8px 12px" }} onClick={() => toggleFlag(f)}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>⚠ {error}</p>}

      <div className="field">
        <label>Test text</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="mono" />
      </div>

      <div className="field">
        <label>{matches.length} match{matches.length === 1 ? "" : "es"}</label>
        <div className="mono" style={{ background: "var(--bg, #0a0c12)", border: "1px solid var(--border)", borderRadius: 10, padding: 12, whiteSpace: "pre-wrap", fontSize: ".88rem" }} dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {matches.some((m) => m.groups.length) && (
        <div className="field">
          <label>Capture groups</label>
          <ul className="file-list">
            {matches.map((m, i) => m.groups.length > 0 && (
              <li key={i} className="mono" style={{ fontSize: ".82rem" }}>{m.match} → [{m.groups.map((g) => JSON.stringify(g)).join(", ")}]</li>
            ))}
          </ul>
        </div>
      )}
      <p className="privacy-note">🔒 Matching runs locally in your browser (JavaScript regex).</p>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
