"use client";

import { useState } from "react";

// Split XML into tags (incl. comments, CDATA, declarations) and text nodes.
function tokenizeXml(xml: string): string[] {
  return xml.match(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\?[\s\S]*?\?>|<[^>]*>|[^<]+/g) ?? [];
}

function isOpenTag(tok: string): boolean {
  return tok.startsWith("<") && !tok.startsWith("</") && !tok.startsWith("<!") && !tok.startsWith("<?") && !tok.endsWith("/>");
}
function isCloseTag(tok: string): boolean {
  return tok.startsWith("</");
}

function formatXml(xml: string): string {
  try {
    const toks = tokenizeXml(xml.trim());
    const lines: string[] = [];
    let depth = 0;
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i];
      const text = !tok.startsWith("<");
      if (text) {
        const trimmed = tok.trim();
        if (trimmed) lines.push("  ".repeat(depth) + trimmed);
        continue;
      }
      if (isCloseTag(tok)) {
        depth = Math.max(0, depth - 1);
        lines.push("  ".repeat(depth) + tok.trim());
        continue;
      }
      // <a>text</a> — keep short text-only elements on one line
      if (isOpenTag(tok) && toks[i + 1] !== undefined && !toks[i + 1].startsWith("<") && toks[i + 2] !== undefined && isCloseTag(toks[i + 2])) {
        const inline = tok.trim() + toks[i + 1].trim() + toks[i + 2].trim();
        if (inline.length <= 80) {
          lines.push("  ".repeat(depth) + inline);
          i += 2;
          continue;
        }
      }
      lines.push("  ".repeat(depth) + tok.trim());
      if (isOpenTag(tok)) depth++;
    }
    return lines.join("\n");
  } catch {
    return xml.trim();
  }
}

function minifyXml(xml: string): string {
  try {
    return tokenizeXml(xml.trim())
      .map((tok) => (tok.startsWith("<") ? tok : tok.trim() === "" ? "" : tok.trim()))
      .join("");
  } catch {
    return xml.trim();
  }
}

function validateXml(xml: string): { valid: boolean; message: string } {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const err = doc.getElementsByTagName("parsererror")[0];
    if (err) {
      const msg = (err.textContent ?? "Invalid XML").replace(/\s+/g, " ").trim();
      return { valid: false, message: msg.slice(0, 300) };
    }
    return { valid: true, message: "Valid XML — well-formed document." };
  } catch {
    return { valid: false, message: "Could not parse this input as XML." };
  }
}

export default function XmlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function run(minify: boolean) {
    setCopied(false);
    if (!input.trim()) { setOutput(""); setStatus(null); return; }
    setStatus(validateXml(input));
    setOutput(minify ? minifyXml(input) : formatXml(input));
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function download() {
    const blob = new Blob([output], { type: "application/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "formatted.xml";
    a.click();
  }

  return (
    <div>
      <div className="field">
        <label>Paste XML</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'<?xml version="1.0"?><note><to>Sam</to><body>Hello</body></note>'}
          style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }}
        />
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <button className="btn" onClick={() => run(false)}>Format / Validate</button>
        <button className="btn secondary" onClick={() => run(true)}>Minify</button>
      </div>

      {status && (
        <p style={{ color: status.valid ? "var(--ok)" : "#ff6b6b" }}>
          {status.valid ? "✓ " : "⚠ "}{status.message}
        </p>
      )}

      {output && (
        <div className="field">
          <label>Result</label>
          <textarea readOnly value={output} style={{ minHeight: 220, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={copy}>{copied ? "✓ Copied" : "Copy result"}</button>
            <button className="btn secondary" onClick={download}>⬇ Download .xml</button>
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 Validation and formatting happen in your browser — your XML is never uploaded.</p>
    </div>
  );
}
