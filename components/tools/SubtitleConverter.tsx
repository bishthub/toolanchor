"use client";

import { useEffect, useMemo, useState } from "react";

interface Cue {
  start: number; // ms
  end: number; // ms
  text: string;
}

type SubFormat = "srt" | "vtt";

// Accepts HH:MM:SS,mmm (srt) and [HH:]MM:SS.mmm (vtt — hours optional).
function parseTime(s: string): number | null {
  const m = s.trim().match(/^(?:(\d{1,3}):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/);
  if (!m) return null;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3], 10);
  const ms = parseInt(m[4].padEnd(3, "0"), 10);
  return ((h * 60 + min) * 60 + sec) * 1000 + ms;
}

function parseSubtitles(src: string): { format: SubFormat; cues: Cue[] } {
  const clean = src.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const format: SubFormat = clean.trimStart().startsWith("WEBVTT") ? "vtt" : "srt";
  const cues: Cue[] = [];
  for (const block of clean.split(/\n{2,}/)) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    const first = lines[0].trim();
    // Skip the WEBVTT header plus NOTE/STYLE/REGION blocks.
    if (format === "vtt" && (/^WEBVTT/.test(first) || /^(NOTE|STYLE|REGION)\b/.test(first))) continue;
    const tsIdx = lines.findIndex((l) => l.includes("-->"));
    if (tsIdx === -1) continue;
    const [rawStart, rawEnd] = lines[tsIdx].split("-->");
    if (rawEnd === undefined) continue;
    const start = parseTime(rawStart);
    // Strip vtt cue settings (position:… align:…) after the end timestamp.
    const end = parseTime(rawEnd.trim().split(/\s+/)[0]);
    if (start === null || end === null) continue;
    // Lines before the timestamp are srt indexes / vtt cue identifiers — skip them.
    const text = lines.slice(tsIdx + 1).join("\n").trim();
    if (!text) continue;
    cues.push({ start, end, text });
  }
  return { format, cues };
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function fmtTime(ms: number, sep: "," | "."): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms % 1000, 3)}`;
}

function serialize(cues: Cue[], format: SubFormat, shiftMs: number): string {
  const shifted = cues.map((c) => ({
    ...c,
    start: Math.max(0, c.start + shiftMs),
    end: Math.max(0, c.end + shiftMs),
  }));
  if (format === "srt") {
    return shifted
      .map((c, i) => `${i + 1}\n${fmtTime(c.start, ",")} --> ${fmtTime(c.end, ",")}\n${c.text}\n`)
      .join("\n");
  }
  return (
    "WEBVTT\n\n" +
    shifted.map((c) => `${fmtTime(c.start, ".")} --> ${fmtTime(c.end, ".")}\n${c.text}\n`).join("\n")
  );
}

export default function SubtitleConverter({ initialFiles }: { initialFiles?: File[] }) {
  const [source, setSource] = useState("");
  const [baseName, setBaseName] = useState("subtitles");
  const [outFormat, setOutFormat] = useState<SubFormat>("vtt");
  const [shiftStr, setShiftStr] = useState("0");
  const [copied, setCopied] = useState(false);

  async function loadFile(f: File) {
    setBaseName(f.name.replace(/\.(srt|vtt)$/i, "") || "subtitles");
    setSource(await f.text());
  }

  useEffect(() => {
    const f = initialFiles?.find(
      (x) => /\.(srt|vtt)$/i.test(x.name) || x.type === "text/vtt" || x.type === "application/x-subrip"
    );
    if (f) loadFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  const parsed = useMemo(() => (source.trim() ? parseSubtitles(source) : null), [source]);
  const detected = parsed?.format ?? null;

  // Default the output format to the opposite of whatever was detected.
  useEffect(() => {
    if (detected) setOutFormat(detected === "srt" ? "vtt" : "srt");
  }, [detected]);

  const shiftMs = Math.round((parseFloat(shiftStr) || 0) * 1000);

  const output = useMemo(() => {
    if (!parsed || parsed.cues.length === 0) return "";
    return serialize(parsed.cues, outFormat, shiftMs);
  }, [parsed, outFormat, shiftMs]);

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function download() {
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${baseName}.${outFormat}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="field">
        <label>Choose a subtitle file (.srt or .vtt)</label>
        <input
          type="file"
          accept=".srt,.vtt,text/vtt,application/x-subrip"
          className="input"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
        />
      </div>

      <div className="field">
        <label>…or paste subtitles here</label>
        <textarea
          className="input"
          rows={8}
          value={source}
          placeholder={"1\n00:00:01,000 --> 00:00:04,000\nHello world"}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      {source.trim() && parsed && (
        parsed.cues.length > 0 ? (
          <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
            Parsed {parsed.cues.length} cue{parsed.cues.length === 1 ? "" : "s"} · detected format: {parsed.format.toUpperCase()}
          </p>
        ) : (
          <p style={{ color: "#ff6b6b" }}>Couldn&apos;t parse any cues — check that this is a valid SRT or VTT file.</p>
        )
      )}

      {parsed && parsed.cues.length > 0 && (
        <>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Output format</label>
              <select className="input" value={outFormat} onChange={(e) => setOutFormat(e.target.value as SubFormat)}>
                <option value="srt">SRT</option>
                <option value="vtt">VTT</option>
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Time shift (seconds)</label>
              <input
                type="number"
                step={0.1}
                className="input"
                value={shiftStr}
                onChange={(e) => setShiftStr(e.target.value)}
              />
            </div>
          </div>
          <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
            positive = subtitles appear later, negative = earlier
          </p>

          <div className="field" style={{ marginTop: 14 }}>
            <label>Converted output ({outFormat.toUpperCase()})</label>
            <textarea readOnly value={output} rows={10} className="input" />
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
              <button className="btn secondary" onClick={download}>Download .{outFormat}</button>
            </div>
          </div>
        </>
      )}

      <p className="privacy-note">🔒 Your subtitles are converted entirely in your browser — nothing is uploaded.</p>
    </div>
  );
}
