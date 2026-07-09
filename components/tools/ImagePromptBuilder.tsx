"use client";

import { useState, useCallback } from "react";

interface PlatformOpts {
  label: string;
  promptPrefix: string;
  aspectKey: string;
  negativePrompt: boolean;
}

const PLATFORMS: Record<string, PlatformOpts> = {
  midjourney: { label: "Midjourney", promptPrefix: "/imagine prompt: ", aspectKey: "--ar ", negativePrompt: false },
  "dall-e": { label: "DALL-E 3", promptPrefix: "", aspectKey: "", negativePrompt: false },
  "stable-diffusion": { label: "Stable Diffusion", promptPrefix: "", aspectKey: "", negativePrompt: true },
  leonardo: { label: "Leonardo AI", promptPrefix: "", aspectKey: "", negativePrompt: true },
};

const STYLES = [
  "Photorealistic", "Cinematic", "Oil painting", "Watercolor", "Digital art",
  "Anime", "Pixel art", "3D render", "Sketch", "Vector illustration",
  "Minimalist", "Surrealist", "Impressionist", "Cyberpunk", "Steampunk",
  "Fantasy", "Vintage", "Retro futurism", "Abstract", "Pop art",
];

const LIGHTING = [
  "Natural lighting", "Golden hour", "Studio lighting", "Dramatic lighting",
  "Soft diffused light", "Neon lighting", "Rim light", "Backlit",
  "Candlelight", "Overcast", "Cinematic lighting", "Volumetric lighting",
];

const MOODS = [
  "Serene", "Energetic", "Mysterious", "Melancholic", "Joyful", "Dark",
  "Dreamy", "Bold", "Peaceful", "Dramatic", "Whimsical", "Gloomy",
];

const COMPOSITIONS = [
  "Close-up", "Wide shot", "Full body", "Portrait", "Bird's eye view",
  "Low angle", "Macro", "Symmetrical", "Rule of thirds", "Leading lines",
];

const COLOR_PALETTES = [
  "Vibrant colors", "Pastel palette", "Monochrome", "Warm tones", "Cool tones",
  "High contrast", "Muted colors", "Earth tones", "Neon palette", "Analogous colors",
];

export default function ImagePromptBuilder() {
  const [platform, setPlatform] = useState<string>("midjourney");
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState("");
  const [lighting, setLighting] = useState("");
  const [mood, setMood] = useState("");
  const [composition, setComposition] = useState("");
  const [colors, setColors] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [extra, setExtra] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const parts: string[] = [];

    // Core subject
    if (subject) parts.push(subject);

    // Medium / style
    if (style) parts.push(style);

    // Lighting
    if (lighting) parts.push(lighting);

    // Colors
    if (colors) parts.push(colors);

    // Mood
    if (mood) parts.push(mood);

    // Composition
    if (composition) parts.push(composition);

    // Extra details
    if (extra) parts.push(extra);

    // Platform suffix
    let prompt = parts.join(", ");

    const opts = PLATFORMS[platform];

    if (platform === "midjourney") {
      prompt = opts.promptPrefix + prompt;
      if (aspectRatio) prompt += ` --ar ${aspectRatio}`;
    }

    if (platform === "stable-diffusion" || platform === "leonardo") {
      if (aspectRatio && platform === "stable-diffusion") {
        const [w, h] = aspectRatio.split(":").map(Number);
        if (w && h) prompt += ` --ar ${w}:${h}`;
      }
    }

    return prompt;
  }, [platform, subject, style, lighting, mood, composition, colors, aspectRatio, extra]);

  const prompt = generate();

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="field" style={{ maxWidth: 240 }}>
        <label>AI Image Platform</label>
        <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          {Object.entries(PLATFORMS).map(([key, p]) => (
            <option key={key} value={key}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Subject — what do you want to see?</label>
        <input className="input" placeholder="e.g. A cat wearing a Victorian suit, sitting at a tiny desk" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <div className="row">
        <div className="field">
          <label>Style / Medium</label>
          <select className="input" value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="">Auto</option>
            {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Lighting</label>
          <select className="input" value={lighting} onChange={(e) => setLighting(e.target.value)}>
            <option value="">Auto</option>
            {LIGHTING.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Mood</label>
          <select className="input" value={mood} onChange={(e) => setMood(e.target.value)}>
            <option value="">Auto</option>
            {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Composition</label>
          <select className="input" value={composition} onChange={(e) => setComposition(e.target.value)}>
            <option value="">Auto</option>
            {COMPOSITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Color palette</label>
          <select className="input" value={colors} onChange={(e) => setColors(e.target.value)}>
            <option value="">Auto</option>
            {COLOR_PALETTES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {platform === "midjourney" && (
          <div className="field" style={{ maxWidth: 100 }}>
            <label>Aspect ratio</label>
            <select className="input" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              <option value="1:1">1:1</option>
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="3:2">3:2</option>
              <option value="9:16">9:16</option>
              <option value="2:3">2:3</option>
              <option value="21:9">21:9</option>
            </select>
          </div>
        )}
      </div>

      <div className="field">
        <label>Additional details (optional)</label>
        <textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="e.g. highly detailed, 8K, intricate details, award-winning photography"
          style={{ minHeight: 60 }}
        />
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Generated prompt</label>
        <textarea
          readOnly
          value={prompt}
          style={{ minHeight: 100, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem", background: "var(--bg-2)" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn" onClick={copy}>{copied ? "✓ Copied" : "Copy prompt"}</button>
          <button className="btn secondary" onClick={() => navigator.clipboard.writeText(prompt.replace("/imagine prompt: ", ""))}>
            Copy without prefix
          </button>
        </div>
      </div>

      <p className="privacy-note">🔒 Does not generate images — only builds prompt text. Everything runs in your browser; no data is uploaded.</p>
    </div>
  );
}
