"use client";

import { useMemo, useState } from "react";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Inline: code, bold, italic, links (applied AFTER escaping, so it's XSS-safe).
function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener nofollow" target="_blank">$1</a>');
}

function toHtml(md: string): string {
  const lines = escapeHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  let listType: "ul" | "ol" | null = null;
  const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      closeList();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${buf.join("\n")}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (/^>\s?/.test(line)) { closeList(); out.push(`<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`); i++; continue; }
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ul) { if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; } out.push(`<li>${inline(ul[1])}</li>`); i++; continue; }
    if (ol) { if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; } out.push(`<li>${inline(ol[1])}</li>`); i++; continue; }
    if (line.trim() === "") { closeList(); i++; continue; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
    i++;
  }
  closeList();
  return out.join("\n");
}

const SAMPLE = "# Hello\n\nThis is **bold**, *italic* and `code`.\n\n- A list item\n- Another\n\n> A blockquote\n\n[A link](https://example.com)";

export default function MarkdownPreview() {
  const [md, setMd] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => toHtml(md), [md]);

  async function copy() { await navigator.clipboard.writeText(html); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>Markdown</label>
          <textarea value={md} onChange={(e) => setMd(e.target.value)} className="mono" style={{ minHeight: 280 }} />
        </div>
        <div className="field">
          <label>Preview</label>
          <div
            className="md-preview"
            style={{ minHeight: 280, background: "var(--bg, #0a0c12)", border: "1px solid var(--border)", borderRadius: 10, padding: "4px 16px", overflow: "auto" }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
      <button className="btn" onClick={copy}>{copied ? "✓ Copied HTML" : "Copy HTML"}</button>
      <p className="privacy-note">🔒 Rendered locally — input is escaped before formatting, so it&apos;s safe and private.</p>
    </div>
  );
}
