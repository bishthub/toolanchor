"use client";

import { useMemo, useState } from "react";

// Tokenize a shell-ish curl command, respecting quotes and line continuations.
function tokenize(input: string): string[] {
  const s = input.replace(/\\\r?\n/g, " ");
  const tokens: string[] = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let tok = "";
    while (i < s.length && !/\s/.test(s[i])) {
      const c = s[i];
      if (c === '"' || c === "'") {
        const quote = c;
        i++;
        while (i < s.length && s[i] !== quote) {
          if (s[i] === "\\" && quote === '"' && i + 1 < s.length) { tok += s[i + 1]; i += 2; }
          else { tok += s[i]; i++; }
        }
        i++; // closing quote
      } else {
        tok += c;
        i++;
      }
    }
    tokens.push(tok);
  }
  return tokens;
}

interface Parsed {
  url: string;
  method: string;
  headers: [string, string][];
  data: string | null;
  user: string | null;
}

function parseCurl(input: string): Parsed | null {
  const toks = tokenize(input.trim());
  if (!toks.length) return null;
  if (toks[0] === "curl") toks.shift();

  const p: Parsed = { url: "", method: "", headers: [], data: null, user: null };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const next = () => toks[++i];
    if (t === "-X" || t === "--request") p.method = next() || "";
    else if (t === "-H" || t === "--header") {
      const h = next() || "";
      const idx = h.indexOf(":");
      if (idx > -1) p.headers.push([h.slice(0, idx).trim(), h.slice(idx + 1).trim()]);
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary" || t === "--data-ascii") {
      p.data = (p.data ? p.data + "&" : "") + (next() || "");
    } else if (t === "-u" || t === "--user") p.user = next() || "";
    else if (t === "-b" || t === "--cookie") p.headers.push(["Cookie", next() || ""]);
    else if (t === "--compressed" || t === "-L" || t === "--location" || t === "-s" || t === "--silent" || t === "-k" || t === "--insecure" || t === "-G" || t === "--get") { /* flags with no value */ }
    else if (t.startsWith("-")) { /* unknown flag — skip its value if it has one */ }
    else if (!p.url && /^https?:\/\//i.test(t)) p.url = t;
    else if (!p.url) p.url = t;
  }
  if (!p.method) p.method = p.data ? "POST" : "GET";
  if (!p.url) return null;
  return p;
}

function toFetch(p: Parsed): string {
  const headers: Record<string, string> = {};
  for (const [k, v] of p.headers) headers[k] = v;
  if (p.user) headers["Authorization"] = `Basic <base64 of ${p.user}>`;
  const opts: string[] = [`  method: ${JSON.stringify(p.method)}`];
  if (Object.keys(headers).length) opts.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")}`);
  if (p.data != null) opts.push(`  body: ${JSON.stringify(p.data)}`);
  return `fetch(${JSON.stringify(p.url)}, {\n${opts.join(",\n")}\n})\n  .then((res) => res.json())\n  .then(console.log);`;
}

function toPython(p: Parsed): string {
  const lines = ["import requests", ""];
  if (p.headers.length) {
    lines.push("headers = {");
    for (const [k, v] of p.headers) lines.push(`    ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
    lines.push("}");
  }
  if (p.data != null) lines.push(`data = ${JSON.stringify(p.data)}`);
  const args = [JSON.stringify(p.url)];
  if (p.headers.length) args.push("headers=headers");
  if (p.data != null) args.push("data=data");
  if (p.user) args.push(`auth=(${p.user.split(":").map((s) => JSON.stringify(s)).join(", ")})`);
  lines.push("", `resp = requests.${p.method.toLowerCase()}(${args.join(", ")})`, "print(resp.json())");
  return lines.join("\n");
}

const box: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace", fontSize: ".84rem", whiteSpace: "pre-wrap",
  wordBreak: "break-word", background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", padding: "14px 16px", margin: "6px 0 0", overflowX: "auto",
};

export default function CurlConverter() {
  const [input, setInput] = useState(`curl https://api.example.com/users -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"Ada"}'`);
  const parsed = useMemo(() => { try { return parseCurl(input); } catch { return null; } }, [input]);

  return (
    <div>
      <div className="field">
        <label>Paste a cURL command</label>
        <textarea className="input" style={{ minHeight: 120, fontFamily: "var(--font-mono), monospace" }} value={input} onChange={(e) => setInput(e.target.value)} />
      </div>

      {parsed ? (
        <>
          <div className="field">
            <label>JavaScript (fetch)</label>
            <pre style={box}>{toFetch(parsed)}</pre>
          </div>
          <div className="field">
            <label>Python (requests)</label>
            <pre style={box}>{toPython(parsed)}</pre>
          </div>
        </>
      ) : (
        <p style={{ color: "var(--muted)" }}>Enter a valid curl command with a URL to see the converted code.</p>
      )}

      <p className="privacy-note">🔒 Conversion runs in your browser — nothing is sent anywhere.</p>
    </div>
  );
}
