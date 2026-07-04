"use client";

import { useEffect, useRef, useState } from "react";
import { canvasBlob } from "@/lib/canvas";

// Lightweight, language-agnostic highlighting done straight on the canvas — no
// dependency, no webfont (system monospace), so the canvas never taints and
// export always works. Not a full parser; good enough for a shareable snippet.
const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "do", "switch", "case", "break",
  "continue", "class", "extends", "new", "this", "super", "import", "export", "from", "default", "async", "await",
  "try", "catch", "finally", "throw", "typeof", "instanceof", "in", "of", "void", "delete", "yield", "static",
  "def", "elif", "lambda", "pass", "with", "as", "None", "True", "False", "and", "or", "not", "print", "self",
  "public", "private", "protected", "interface", "type", "enum", "struct", "func", "package", "fn", "let", "mut",
  "null", "undefined", "true", "false", "int", "string", "bool", "float", "double", "char", "void",
]);

const THEMES = {
  dark: { bg: "#1e1e2e", text: "#e6e6e6", keyword: "#c792ea", string: "#c3e88d", number: "#f78c6c", comment: "#6b7385" },
  light: { bg: "#ffffff", text: "#2b2b2b", keyword: "#8a3ffc", string: "#0a7d3f", number: "#b35900", comment: "#9aa0a6" },
};

const BACKDROPS: Record<string, [string, string]> = {
  slate: ["#3a4152", "#20242e"],
  ocean: ["#2b5876", "#1e3a5f"],
  plum: ["#4b3a5a", "#2a2140"],
  none: ["transparent", "transparent"],
};

interface Tok { text: string; color: string }

function tokenizeLine(line: string, t: typeof THEMES.dark): Tok[] {
  const re = /(\/\/.*$|#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\s\w])/g;
  const out: Tok[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ text: m[1], color: t.comment });
    else if (m[2]) out.push({ text: m[2], color: t.string });
    else if (m[3]) out.push({ text: m[3], color: t.number });
    else if (m[4]) out.push({ text: m[4], color: KEYWORDS.has(m[4]) ? t.keyword : t.text });
    else out.push({ text: m[5] || m[6] || "", color: t.text });
  }
  return out;
}

export default function CodeToImage() {
  const [code, setCode] = useState(`function greet(name) {\n  // say hello\n  return \`Hello, \${name}!\`;\n}`);
  const [theme, setTheme] = useState<keyof typeof THEMES>("dark");
  const [backdrop, setBackdrop] = useState("slate");
  const [padding, setPadding] = useState(48);
  const [chrome, setChrome] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const t = THEMES[theme];
    const FONT = 16;
    const LH = Math.round(FONT * 1.55);
    const FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    const ctx = canvas.getContext("2d")!;
    ctx.font = `${FONT}px ${FONT_STACK}`;

    const lines = code.replace(/\t/g, "  ").split("\n");
    const codeW = Math.max(120, ...lines.map((l) => ctx.measureText(l).width));
    const titleH = chrome ? 34 : 0;
    const innerPad = 20;
    const winW = Math.ceil(codeW + innerPad * 2);
    const winH = titleH + innerPad * 2 + lines.length * LH;

    const W = winW + padding * 2;
    const H = winH + padding * 2;
    canvas.width = W;
    canvas.height = H;

    // Backdrop.
    const [c0, c1] = BACKDROPS[backdrop];
    if (backdrop === "none") {
      ctx.clearRect(0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    // Window card + shadow.
    const x = padding, y = padding, r = 12;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    ctx.fillStyle = t.bg;
    roundRect(ctx, x, y, winW, winH, r); ctx.fill();
    ctx.restore();

    if (chrome) {
      const dots = ["#ff5f57", "#febc2e", "#28c840"];
      dots.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 20 + i * 20, y + 18, 6, 0, Math.PI * 2); ctx.fill(); });
    }

    // Code.
    ctx.font = `${FONT}px ${FONT_STACK}`;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      let cx = x + innerPad;
      const cy = y + titleH + innerPad + i * LH;
      for (const tok of tokenizeLine(line, t)) {
        ctx.fillStyle = tok.color;
        ctx.fillText(tok.text, cx, cy);
        cx += ctx.measureText(tok.text).width;
      }
    });
  }, [code, theme, backdrop, padding, chrome]);

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasBlob(canvas, "image/png");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "code.png";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="field">
        <label>Paste your code</label>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace", fontSize: ".9rem" }} />
      </div>

      <div className="row">
        <div className="field">
          <label>Theme</label>
          <div className="row">
            <button type="button" className={`btn ${theme === "dark" ? "" : "secondary"}`} onClick={() => setTheme("dark")}>Dark</button>
            <button type="button" className={`btn ${theme === "light" ? "" : "secondary"}`} onClick={() => setTheme("light")}>Light</button>
          </div>
        </div>
        <div className="field">
          <label>Backdrop</label>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {Object.keys(BACKDROPS).map((b) => (
              <button key={b} type="button" className={`btn ${backdrop === b ? "" : "secondary"}`} onClick={() => setBackdrop(b)} style={{ textTransform: "capitalize" }}>{b}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Padding: {padding}px</label>
          <input type="range" min={0} max={120} step={4} value={padding} onChange={(e) => setPadding(Number(e.target.value))} style={{ width: "100%" }} />
        </div>
        <div className="field">
          <label>Window bar</label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)", fontSize: ".9rem", marginTop: 8 }}>
            <input type="checkbox" checked={chrome} onChange={(e) => setChrome(e.target.checked)} /> Show title bar dots
          </label>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto", marginTop: 8, borderRadius: 6, border: "1px solid var(--border)" }} />
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={download}>⬇ Download PNG</button>
      </div>

      <p className="privacy-note">🔒 The image is drawn in your browser — your code is never uploaded. Highlighting is lightweight and language-agnostic.</p>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
