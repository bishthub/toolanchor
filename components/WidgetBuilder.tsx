"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, type Tool } from "@/lib/tools";
import { EMBED_DEFAULTS, embedQuery, type EmbedOptions } from "@/lib/embed";
import { SITE_URL } from "@/lib/site";

// Interactive builder for /widgets: pick a tool, customize theme/accent/
// radius/width, preview live, copy the embed code.

const ACCENT_PRESETS = [
  { label: "Indigo (default)", hex: "" },
  { label: "Blue", hex: "2563eb" },
  { label: "Teal", hex: "0d9488" },
  { label: "Green", hex: "16a34a" },
  { label: "Amber", hex: "d97706" },
  { label: "Red", hex: "dc2626" },
  { label: "Pink", hex: "db2777" },
  { label: "Slate", hex: "475569" },
];

function CodeBlock({ label, code, hint }: { label: string; code: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }
  return (
    <div className="field" style={{ marginTop: 14 }}>
      <label>{label}</label>
      {hint && <p style={{ color: "var(--muted)", fontSize: ".82rem", margin: "2px 0 6px" }}>{hint}</p>}
      <textarea
        readOnly
        value={code}
        rows={code.split("\n").length + 1}
        style={{ fontFamily: "var(--font-mono), monospace", fontSize: ".8rem", background: "var(--bg-2)", whiteSpace: "pre", overflowX: "auto" }}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button className="btn" style={{ marginTop: 8 }} onClick={copy}>
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  );
}

function Builder({ tools }: { tools: Tool[] }) {
  const search = useSearchParams();
  const requested = search.get("tool");
  const initial = requested && tools.some((t) => t.slug === requested) ? requested : "bmi-calculator";

  const [slug, setSlug] = useState(tools.some((t) => t.slug === initial) ? initial : tools[0].slug);
  const [opts, setOpts] = useState<EmbedOptions>(EMBED_DEFAULTS);
  const [customAccent, setCustomAccent] = useState("#4f46e5");
  const [useCustom, setUseCustom] = useState(false);
  const [width, setWidth] = useState("100%");
  const previewRef = useRef<HTMLIFrameElement>(null);

  const accent = useCustom ? customAccent.replace(/^#/, "") : opts.accent;
  const effective: EmbedOptions = { ...opts, accent };

  // Auto-resize the preview iframe exactly like embed.js does on host pages.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data;
      if (!d || d.type !== "toolanchor:resize" || d.id !== "preview") return;
      const h = parseInt(String(d.height), 10);
      if (previewRef.current && h > 0 && h < 10000) previewRef.current.style.height = h + "px";
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const tool = tools.find((t) => t.slug === slug);
  const q = embedQuery(effective);
  const previewSrc = `/embed/${slug}${q ? q + "&" : "?"}id=preview`;

  const scriptSnippet = useMemo(() => {
    const attrs = [`data-toolanchor="${slug}"`];
    if (effective.theme !== "auto") attrs.push(`data-theme="${effective.theme}"`);
    if (effective.accent) attrs.push(`data-accent="${effective.accent}"`);
    if (effective.radius !== 12) attrs.push(`data-radius="${effective.radius}"`);
    if (width !== "100%") attrs.push(`data-width="${width}"`);
    return `<div ${attrs.join(" ")}></div>\n<script async src="${SITE_URL}/embed.js"></script>`;
  }, [slug, effective.theme, effective.accent, effective.radius, width]);

  const iframeSnippet = useMemo(() => {
    return `<iframe src="${SITE_URL}/embed/${slug}${q}"\n  width="${width}" height="520" loading="lazy"\n  style="border:0;border-radius:${effective.radius}px"\n  title="${tool?.name ?? slug} — ToolAnchor"></iframe>`;
  }, [slug, q, width, effective.radius, tool]);

  const byCategory = CATEGORIES.map((c) => ({
    cat: c,
    items: tools.filter((t) => t.category === c.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 28, alignItems: "start" }} className="widget-builder">
      <div>
        <div className="field">
          <label>Widget</label>
          <select className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {byCategory.map((g) => (
              <optgroup key={g.cat.id} label={g.cat.name}>
                {g.items.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Theme</label>
          <select className="input" value={opts.theme} onChange={(e) => setOpts({ ...opts, theme: e.target.value as EmbedOptions["theme"] })}>
            <option value="auto">Auto — follow the visitor&apos;s system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="field">
          <label>Accent color</label>
          <select
            className="input"
            value={useCustom ? "custom" : opts.accent}
            onChange={(e) => {
              if (e.target.value === "custom") { setUseCustom(true); return; }
              setUseCustom(false);
              setOpts({ ...opts, accent: e.target.value });
            }}
          >
            {ACCENT_PRESETS.map((a) => (
              <option key={a.label} value={a.hex}>{a.label}</option>
            ))}
            <option value="custom">Custom…</option>
          </select>
          {useCustom && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
              <input
                type="color"
                value={customAccent}
                onChange={(e) => setCustomAccent(e.target.value)}
                aria-label="Custom accent color"
                style={{ width: 44, height: 32, padding: 2, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-2)" }}
              />
              <code style={{ fontSize: ".85rem" }}>{customAccent}</code>
            </div>
          )}
        </div>

        <div className="row">
          <div className="field" style={{ maxWidth: 130 }}>
            <label>Corner radius</label>
            <input className="input" type="number" min={0} max={32} value={effective.radius}
              onChange={(e) => setOpts({ ...opts, radius: Math.max(0, Math.min(32, parseInt(e.target.value, 10) || 0)) })} />
          </div>
          <div className="field" style={{ maxWidth: 150 }}>
            <label>Width</label>
            <select className="input" value={width} onChange={(e) => setWidth(e.target.value)}>
              <option value="100%">100% (fluid)</option>
              <option value="720px">720 px</option>
              <option value="480px">480 px</option>
              <option value="360px">360 px</option>
            </select>
          </div>
        </div>

        <CodeBlock
          label="Embed code — script (recommended)"
          hint="Auto-resizes to fit the widget's content. Paste where the widget should appear."
          code={scriptSnippet}
        />
        <CodeBlock
          label="Embed code — plain iframe"
          hint="For sites that don't allow scripts (some CMSs). Fixed height."
          code={iframeSnippet}
        />
      </div>

      <div style={{ position: "sticky", top: 24 }}>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Live preview — exactly as it will appear on your site</label>
        </div>
        <div style={{ maxWidth: width === "100%" ? undefined : width }}>
          <iframe
            ref={previewRef}
            key={previewSrc}
            src={previewSrc}
            title={`${tool?.name ?? slug} widget preview`}
            style={{
              width: "100%",
              height: 420,
              border: "1px solid var(--border)",
              borderRadius: effective.radius,
              background: "var(--bg-2)",
              display: "block",
            }}
          />
        </div>
        <p style={{ color: "var(--muted)", fontSize: ".82rem", marginTop: 10 }}>
          Exactly what your visitors get: the tool runs in their browser, on your page,
          with no data sent anywhere. The attribution link is part of the free license.
        </p>
      </div>
    </div>
  );
}

export default function WidgetBuilder({ tools }: { tools: Tool[] }) {
  return (
    <Suspense fallback={null}>
      <Builder tools={tools} />
    </Suspense>
  );
}
