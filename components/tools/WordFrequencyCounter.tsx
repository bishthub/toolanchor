"use client";

import { useMemo, useState } from "react";

const STOP = new Set(("a an and are as at be by for from has he in is it its of on that the to was were will with i you it he she they we this but or not".split(" ")));

export default function WordFrequencyCounter() {
  const [text, setText] = useState("");
  const [ignoreStop, setIgnoreStop] = useState(true);

  const rows = useMemo(() => {
    const words = (text.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []).filter(
      (w) => !(ignoreStop && STOP.has(w))
    );
    const counts = new Map<string, number>();
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
    const total = words.length;
    return { total, list: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 100) };
  }, [text, ignoreStop]);

  return (
    <div>
      <div className="field">
        <label>Your text</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text to analyse…" />
      </div>
      <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem", marginBottom: 14 }}>
        <input type="checkbox" checked={ignoreStop} onChange={(e) => setIgnoreStop(e.target.checked)} /> Ignore common stop words
      </label>

      {rows.list.length > 0 && (
        <div className="mono" style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          {rows.list.map(([word, n], i) => (
            <div key={word} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: i % 2 ? "transparent" : "var(--surface, rgba(255,255,255,0.02))", fontSize: ".88rem" }}>
              <span>{i + 1}. {word}</span>
              <span style={{ color: "var(--muted)" }}>{n} · {((n / rows.total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
      <p className="privacy-note">🔒 Analysed locally in your browser.</p>
    </div>
  );
}
