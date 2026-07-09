"use client";

import { useState } from "react";

export default function SerpPreview() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");

  const titleDisplay = title || "Your Page Title";
  const descDisplay = desc || "Your meta description appears here in Google search results.";
  const urlDisplay = url
    ? url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "example.com/page";

  // Google typically truncates titles at ~55-60 chars and descriptions at ~150-160
  const titleOver = title.length > 60 ? title.length : 0;
  const descOver = desc.length > 160 ? desc.length - 160 : 0;

  return (
    <div>
      <div className="field">
        <label>Title tag</label>
        <input
          className="input"
          placeholder="The page title, around 55–60 characters"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <span style={{ fontSize: ".78rem", fontFamily: "var(--font-mono), monospace", color: title.length > 60 ? "var(--danger)" : title.length > 50 ? "#d9944b" : "var(--faint)" }}>
            {title.length} chars {title.length > 60 ? `(${title.length - 60} over limit)` : "(60 max)"}
          </span>
          <span style={{ fontSize: ".78rem", color: "var(--faint)" }}>
            ~{Math.round(title.length / 4)} avg words
          </span>
        </div>
      </div>

      <div className="field">
        <label>Meta description</label>
        <textarea
          style={{ minHeight: 70 }}
          placeholder="The meta description, around 150–160 characters"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <span style={{ fontSize: ".78rem", fontFamily: "var(--font-mono), monospace", color: desc.length > 160 ? "var(--danger)" : desc.length > 145 ? "#d9944b" : "var(--faint)" }}>
            {desc.length} chars {desc.length > 160 ? `(${desc.length - 160} over limit)` : "(160 max)"}
          </span>
        </div>
      </div>

      <div className="field">
        <label>URL (optional)</label>
        <input
          className="input"
          placeholder="https://example.com/page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {/* Live SERP preview */}
      <div className="field">
        <label>Google search preview</label>
        <div className="serp-card">
          <div className="serp-url">{urlDisplay}</div>
          <div className="serp-title">{titleDisplay}</div>
          <div className="serp-desc">
            {descDisplay}
            {(titleOver > 0 || descOver > 0) && (
              <span className="serp-truncated">
                {" "}(may be truncated)
              </span>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .serp-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px 17px;
          max-width: 600px;
          font-family: arial, sans-serif;
        }
        .serp-url {
          font-size: 14px;
          color: #006621;
          line-height: 1.3;
          margin-bottom: 2px;
        }
        .serp-title {
          font-size: 18px;
          color: #1a0dab;
          line-height: 1.3;
          margin-bottom: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .serp-title:hover { text-decoration: underline; }
        .serp-desc {
          font-size: 14px;
          color: #545454;
          line-height: 1.58;
          word-wrap: break-word;
        }
        .serp-truncated {
          color: #d93025;
          font-size: .78rem;
        }
        @media (prefers-color-scheme: dark) {
          .serp-card { background: #1e1e1e; }
          .serp-url { color: #8ab4f8; }
          .serp-title { color: #8ab4f8; }
          .serp-desc { color: #bdc1c6; }
        }
      `}</style>

      <p className="privacy-note">🔒 Runs in your browser — nothing is uploaded. Character counters warn you before Google truncates your snippet.</p>
    </div>
  );
}
