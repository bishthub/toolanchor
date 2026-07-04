"use client";

import { useMemo, useRef, useState } from "react";

interface Fields {
  name: string; title: string; company: string;
  phone: string; email: string; website: string; accent: string;
}

const DEFAULTS: Fields = {
  name: "Alex Morgan", title: "Product Designer", company: "Acme Inc.",
  phone: "+1 555 010 2030", email: "alex@acme.com", website: "acme.com", accent: "#6b57d6",
};

// Table-based, fully inline-styled HTML — the only thing email clients render reliably.
function buildHtml(f: Fields): string {
  const link = (href: string, text: string) => `<a href="${href}" style="color:${f.accent};text-decoration:none;">${text}</a>`;
  const row = (label: string, value: string) =>
    value ? `<tr><td style="padding:1px 0;font-size:12px;color:#555;">${label}${value}</td></tr>` : "";
  return `<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;border-collapse:collapse;">
<tr><td style="padding:0 0 2px 0;font-size:16px;font-weight:bold;color:#1a1a1a;">${f.name || ""}</td></tr>
<tr><td style="padding:0 0 6px 0;font-size:13px;color:#666;">${[f.title, f.company].filter(Boolean).join(" · ")}</td></tr>
<tr><td style="border-top:2px solid ${f.accent};padding-top:6px;"></td></tr>
${row("📞 ", f.phone)}
${row("✉️ ", f.email ? link(`mailto:${f.email}`, f.email) : "")}
${row("🌐 ", f.website ? link(`https://${f.website.replace(/^https?:\/\//, "")}`, f.website) : "")}
</table>`;
}

export default function EmailSignatureGenerator() {
  const [f, setF] = useState<Fields>(DEFAULTS);
  const [copied, setCopied] = useState<"" | "rich" | "html">("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  const html = useMemo(() => buildHtml(f), [f]);
  function set<K extends keyof Fields>(k: K, v: string) { setF((p) => ({ ...p, [k]: v })); setCopied(""); }

  async function copyRich() {
    const plain = `${f.name}\n${[f.title, f.company].filter(Boolean).join(" · ")}\n${f.phone}\n${f.email}\n${f.website}`;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
      setCopied("rich");
    } catch {
      // Fallback: select the rendered preview and copy.
      const node = previewRef.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges(); sel?.addRange(range);
        document.execCommand("copy");
        sel?.removeAllRanges();
        setCopied("rich");
      }
    }
  }

  async function copyHtml() {
    try { await navigator.clipboard.writeText(html); setCopied("html"); } catch { /* ignore */ }
  }

  const F: [keyof Fields, string, string][] = [
    ["name", "Full name", "text"], ["title", "Job title", "text"], ["company", "Company", "text"],
    ["phone", "Phone", "text"], ["email", "Email", "email"], ["website", "Website", "text"], ["accent", "Accent colour", "color"],
  ];

  return (
    <div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {F.map(([k, label, type]) => (
          <div className="field" key={k} style={{ flex: type === "color" ? "0 0 auto" : "1 1 200px" }}>
            <label>{label}</label>
            <input type={type} className="input" value={f[k]} onChange={(e) => set(k, e.target.value)} style={type === "color" ? { width: 56, padding: 4, height: 40 } : undefined} />
          </div>
        ))}
      </div>

      <div className="field">
        <label>Preview</label>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
          <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

      <div className="row">
        <button className="btn" onClick={copyRich}>{copied === "rich" ? "✓ Copied" : "Copy signature"}</button>
        <button className="btn secondary" onClick={copyHtml}>{copied === "html" ? "✓ Copied HTML" : "Copy HTML source"}</button>
      </div>
      <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 10 }}>
        Paste “Copy signature” straight into Gmail/Outlook signature settings. Use “Copy HTML source” if your client asks for HTML.
      </p>

      <p className="privacy-note">🔒 Built entirely in your browser — none of your details are uploaded.</p>
    </div>
  );
}
