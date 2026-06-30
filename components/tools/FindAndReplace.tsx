"use client";

import { useState } from "react";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function FindAndReplace() {
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function result(): string {
    if (!find) return text;
    try {
      const flags = caseSensitive ? "g" : "gi";
      const pattern = useRegex ? find : escapeRegExp(find);
      setError(null);
      return text.replace(new RegExp(pattern, flags), replace);
    } catch {
      setError("Invalid regular expression.");
      return text;
    }
  }

  const out = result();
  const count = find && !error
    ? (text.match(new RegExp(useRegex ? find : escapeRegExp(find), caseSensitive ? "g" : "gi")) || []).length
    : 0;

  async function copy() {
    await navigator.clipboard.writeText(out);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Text</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your text…" />
      </div>
      <div className="row">
        <div className="field"><label>Find</label><input className="input" value={find} onChange={(e) => setFind(e.target.value)} /></div>
        <div className="field"><label>Replace with</label><input className="input" value={replace} onChange={(e) => setReplace(e.target.value)} /></div>
      </div>
      <div className="row" style={{ marginBottom: 14 }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} /> Case sensitive
        </label>
        <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
          <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} /> Regex
        </label>
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      {find && !error && <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>{count} match{count === 1 ? "" : "es"} replaced.</p>}

      <div className="field">
        <label>Result</label>
        <textarea readOnly value={out} />
      </div>
      <button className="btn" onClick={copy} disabled={!out}>{copied ? "✓ Copied" : "Copy result"}</button>
      <p className="privacy-note">🔒 Runs locally in your browser.</p>
    </div>
  );
}
