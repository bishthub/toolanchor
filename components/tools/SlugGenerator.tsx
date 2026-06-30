"use client";

import { useState } from "react";

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SlugGenerator() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const slug = slugify(text);

  async function copy() {
    if (!slug) return;
    await navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field">
        <label>Title or text</label>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="My Awesome Blog Post!" />
      </div>
      <div className="field">
        <label>URL slug</label>
        <input className="input mono" readOnly value={slug} placeholder="my-awesome-blog-post" />
      </div>
      <button className="btn" onClick={copy} disabled={!slug}>{copied ? "✓ Copied" : "Copy slug"}</button>
      <p className="privacy-note">🔒 Generated locally in your browser.</p>
    </div>
  );
}
