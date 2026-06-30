"use client";

import { useState } from "react";

export default function WhitespaceRemover() {
  const [text, setText] = useState("");
  const [collapseSpaces, setCollapseSpaces] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [removeBlank, setRemoveBlank] = useState(false);
  const [tabsToSpace, setTabsToSpace] = useState(true);
  const [copied, setCopied] = useState(false);

  function process(): string {
    let lines = text.split(/\r?\n/);
    lines = lines.map((l) => {
      let line = l;
      if (tabsToSpace) line = line.replace(/\t/g, " ");
      if (collapseSpaces) line = line.replace(/ {2,}/g, " ");
      if (trimLines) line = line.trim();
      return line;
    });
    if (removeBlank) lines = lines.filter((l) => l.trim() !== "");
    return lines.join("\n");
  }
  const out = process();

  async function copy() { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  const Toggle = ({ label, v, set }: { label: string; v: boolean; set: (b: boolean) => void }) => (
    <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
      <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  );

  return (
    <div>
      <div className="field">
        <label>Text</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste messy text…" />
      </div>
      <div className="row" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        <Toggle label="Collapse double spaces" v={collapseSpaces} set={setCollapseSpaces} />
        <Toggle label="Trim each line" v={trimLines} set={setTrimLines} />
        <Toggle label="Tabs → space" v={tabsToSpace} set={setTabsToSpace} />
        <Toggle label="Remove blank lines" v={removeBlank} set={setRemoveBlank} />
      </div>
      <div className="field">
        <label>Result</label>
        <textarea readOnly value={out} />
      </div>
      <button className="btn" onClick={copy} disabled={!out}>{copied ? "✓ Copied" : "Copy result"}</button>
      <p className="privacy-note">🔒 Cleaned locally in your browser.</p>
    </div>
  );
}
