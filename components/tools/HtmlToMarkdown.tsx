"use client";

import { useState } from "react";

/**
 * A simple, no-dependency HTML-to-Markdown converter.
 * Handles common block and inline elements.
 */
function htmlToMd(html: string): string {
  if (!html.trim()) return "";

  let text = html;

  // Block-level replacements
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");

  // Horizontal rules
  text = text.replace(/<hr\s*\/?>/gi, "\n---\n\n");

  // Blockquotes
  text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) => {
    return "> " + content.trim().replace(/\n/g, "\n> ") + "\n\n";
  });

  // Code blocks (must be before <code> inline)
  text = text.replace(/<pre><code[^>]*>(.*?)<\/code><\/pre>/gis, (_, code) => {
    return "```\n" + unEscapeHtml(code) + "\n```\n\n";
  });

  text = text.replace(/<pre>(.*?)<\/pre>/gis, (_, pre) => {
    return "```\n" + unEscapeHtml(pre) + "\n```\n\n";
  });

  // Ordered lists
  text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
    return items.map((item: string, i: number) => {
      const inner = item.replace(/<\/?li[^>]*>/gi, "").trim();
      return `${i + 1}. ${inner}`;
    }).join("\n") + "\n\n";
  });

  // Unordered lists
  text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
    return items.map((item: string) => {
      const inner = item.replace(/<\/?li[^>]*>/gi, "").trim();
      return `- ${inner}`;
    }).join("\n") + "\n\n";
  });

  // Paragraphs
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Break tags
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Inline elements
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");

  // Links
  text = text.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Images
  text = text.replace(/<img\s+(?:[^>]*?\s+)?(?:src|srcset)="([^"]*)"[^>]*?(?:alt="([^"]*)")?[^>]*\/?>/gi, (_, src, alt) => {
    return `![${alt || ""}](${src})`;
  });

  // Tables (basic — pipe table format)
  text = text.replace(/<table[^>]*>(.*?)<\/table>/gis, (_, content) => {
    const rows = content.match(/<tr[^>]*>(.*?)<\/tr>/gi) || [];
    const mdRows = rows.map((row: string) => {
      const cells = (row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi) || []);
      return "| " + cells.map((c: string) => c.replace(/<\/?t[hd][^>]*>/gi, "").trim()).join(" | ") + " |";
    });

    if (mdRows.length === 0) return "";
    // Add separator after header
    const sep = "| " + mdRows[0].split("|").slice(1, -1).map(() => "---").join(" | ") + " |";
    mdRows.splice(1, 0, sep);
    return "\n" + mdRows.join("\n") + "\n\n";
  });

  // Clean up remaining tags
  text = text.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  text = unEscapeHtml(text);

  // Clean up excessive newlines
  text = text.replace(/\n{4,}/g, "\n\n\n");

  return text.trim();
}

function unEscapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export default function HtmlToMarkdown() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = htmlToMd(input);

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>HTML input</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste HTML here…"
          style={{ minHeight: 180, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }}
        />
      </div>

      <button className="btn" onClick={() => {}} disabled={!input.trim()}>
        ⬇ Convert to Markdown
      </button>

      {output && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>Markdown output</label>
          <textarea
            readOnly
            value={output}
            style={{ minHeight: 180, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem" }}
          />
          <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
            {copied ? "✓ Copied" : "Copy Markdown"}
          </button>
        </div>
      )}

      <p className="privacy-note">🔒 HTML is converted to Markdown entirely in your browser — nothing is uploaded. Supports headings, links, images, lists, tables and code blocks.</p>
    </div>
  );
}
