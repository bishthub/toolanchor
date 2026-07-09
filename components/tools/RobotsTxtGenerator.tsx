"use client";

import { useState, useMemo, useCallback } from "react";

interface Rule {
  id: string;
  userAgent: string;
  type: "allow" | "disallow";
  path: string;
}

let idCounter = 0;
function nextId() {
  return `rule-${++idCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

const UA_OPTIONS = ["*", "Googlebot", "Googlebot-Image", "Bingbot", "Slurp", "Baiduspider", "YandexBot", "DuckDuckBot", "GPTBot", "Claude-Web", "CCBot", "Applebot"];

export default function RobotsTxtGenerator() {
  const [rules, setRules] = useState<Rule[]>([
    { id: nextId(), userAgent: "*", type: "allow", path: "/" },
  ]);
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [copied, setCopied] = useState(false);

  function addRule() {
    setRules((prev) => [...prev, { id: nextId(), userAgent: "*", type: "disallow", path: "/" }]);
  }

  function updateRule(id: string, patch: Partial<Rule>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  const generated = useMemo(() => {
    // Group by user-agent
    const groups = new Map<string, Rule[]>();
    for (const rule of rules) {
      const ua = rule.userAgent || "*";
      if (!groups.has(ua)) groups.set(ua, []);
      groups.get(ua)!.push(rule);
    }

    const lines: string[] = [];
    let first = true;
    for (const [ua, uaRules] of groups) {
      if (!first) lines.push("");
      first = false;
      lines.push(`User-agent: ${ua}`);
      for (const rule of uaRules) {
        lines.push(`${rule.type === "allow" ? "Allow" : "Disallow"}: ${rule.path || "/"}`);
      }
    }

    if (crawlDelay.trim()) {
      lines.push("");
      lines.push(`Crawl-delay: ${crawlDelay.trim()}`);
    }

    if (sitemapUrl.trim()) {
      lines.push("");
      lines.push(`Sitemap: ${sitemapUrl.trim()}`);
    }

    return lines.join("\n") || "# Your robots.txt will appear here";
  }, [rules, crawlDelay, sitemapUrl]);

  async function copy() {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function download() {
    const blob = new Blob([generated], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="field">
        <label>Rules — one row per agent and path</label>
        {rules.map((rule, i) => (
          <div key={rule.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <select
              className="input"
              style={{ maxWidth: 160, padding: "8px 10px", fontSize: ".85rem" }}
              value={rule.userAgent}
              onChange={(e) => updateRule(rule.id, { userAgent: e.target.value })}
            >
              {UA_OPTIONS.map((ua) => (
                <option key={ua} value={ua}>{ua}</option>
              ))}
            </select>
            <select
              className="input"
              style={{ maxWidth: 110, padding: "8px 10px", fontSize: ".85rem" }}
              value={rule.type}
              onChange={(e) => updateRule(rule.id, { type: e.target.value as "allow" | "disallow" })}
            >
              <option value="allow">Allow</option>
              <option value="disallow">Disallow</option>
            </select>
            <input
              className="input"
              style={{ flex: 1, padding: "8px 10px", fontSize: ".85rem", minWidth: 80 }}
              placeholder="/path"
              value={rule.path}
              onChange={(e) => updateRule(rule.id, { path: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeRule(rule.id)}
              style={{
                background: "none", border: "1px solid var(--border)", borderRadius: 7,
                color: "var(--muted)", cursor: "pointer", padding: "6px 10px", fontSize: ".82rem",
              }}
              aria-label="Remove rule"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn secondary" style={{ padding: "8px 16px", fontSize: ".85rem" }} onClick={addRule}>
          + Add rule
        </button>
      </div>

      <div className="row">
        <div className="field" style={{ maxWidth: 320 }}>
          <label>Sitemap URL (optional)</label>
          <input
            className="input"
            placeholder="https://example.com/sitemap.xml"
            value={sitemapUrl}
            onChange={(e) => setSitemapUrl(e.target.value)}
          />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Crawl delay (optional)</label>
          <input
            className="input"
            type="number"
            min={0}
            step={1}
            placeholder="Seconds"
            value={crawlDelay}
            onChange={(e) => setCrawlDelay(e.target.value)}
          />
        </div>
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Generated robots.txt</label>
        <textarea
          readOnly
          value={generated}
          style={{ minHeight: 140, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem", color: "var(--text)" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn" onClick={copy}>{copied ? "✓ Copied" : "Copy to clipboard"}</button>
          <button className="btn secondary" onClick={download}>⬇ Download</button>
        </div>
      </div>

      <p className="privacy-note">🔒 Runs in your browser — nothing is uploaded. The generated file is ready to paste into your website root.</p>
    </div>
  );
}
