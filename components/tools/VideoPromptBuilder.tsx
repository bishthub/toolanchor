"use client";

import { useMemo, useState } from "react";

const MODELS: Record<string, { label: string; video: boolean }> = {
  "sora-2": { label: "Sora 2 (OpenAI)", video: true },
  "veo-3": { label: "Veo 3.1 (Google)", video: true },
  "nano-banana": { label: "Nano Banana (Gemini image)", video: false },
};

const SHOTS = [
  "Wide shot", "Medium shot", "Close-up", "Extreme close-up", "Over-the-shoulder",
  "POV", "Aerial / drone", "Low angle", "High angle", "Dutch angle",
];

const CAMERA_MOVES = [
  "Static", "Slow push-in", "Pull-back", "Pan left", "Pan right", "Tilt up",
  "Tracking shot", "Handheld", "Orbit", "Crane down", "Dolly zoom", "FPV fly-through",
];

const STYLES = [
  "Photorealistic", "Cinematic film", "Documentary", "Anime", "3D animation",
  "Stop motion", "Claymation", "Vintage film (16mm)", "Music video", "Commercial",
  "Hyperlapse", "Macro photography",
];

const LIGHTING = [
  "Natural light", "Golden hour", "Blue hour", "Overcast", "Neon", "Candlelight",
  "Studio softbox", "Harsh midday sun", "Moonlight", "Volumetric fog", "Practical lights",
];

const MOODS = [
  "Epic", "Serene", "Tense", "Playful", "Melancholic", "Mysterious",
  "Nostalgic", "Energetic", "Dreamy", "Gritty",
];

export default function VideoPromptBuilder() {
  const [model, setModel] = useState("sora-2");
  const [scene, setScene] = useState("");
  const [action, setAction] = useState("");
  const [shot, setShot] = useState("");
  const [camera, setCamera] = useState("");
  const [style, setStyle] = useState("");
  const [lighting, setLighting] = useState("");
  const [mood, setMood] = useState("");
  const [audio, setAudio] = useState("");
  const [duration, setDuration] = useState("8");
  const [aspect, setAspect] = useState("16:9");
  const [negative, setNegative] = useState("");
  const [format, setFormat] = useState<"json" | "text">("json");
  const [copied, setCopied] = useState(false);

  const isVideo = MODELS[model].video;

  const jsonPrompt = useMemo(() => {
    const p: Record<string, unknown> = {};
    if (scene) p.scene = scene;
    if (action) p[isVideo ? "action" : "edit_instruction"] = action;
    if (shot) p.shot_type = shot;
    if (isVideo && camera) p.camera_movement = camera;
    if (style) p.style = style;
    if (lighting) p.lighting = lighting;
    if (mood) p.mood = mood;
    if (isVideo && audio) p.audio = audio;
    if (isVideo && duration) p.duration_seconds = Number(duration) || duration;
    if (aspect) p.aspect_ratio = aspect;
    if (negative) p.negative_prompt = negative;
    return JSON.stringify(p, null, 2);
  }, [scene, action, shot, camera, style, lighting, mood, audio, duration, aspect, negative, isVideo]);

  const textPrompt = useMemo(() => {
    const parts = [
      scene, action, shot && `${shot.toLowerCase()}`, camera && isVideo && `camera: ${camera.toLowerCase()}`,
      style && `${style.toLowerCase()} style`, lighting && `${lighting.toLowerCase()}`,
      mood && `${mood.toLowerCase()} mood`, audio && isVideo && `audio: ${audio}`,
      isVideo && duration && `${duration}s`, aspect,
    ].filter(Boolean);
    let t = parts.join(", ");
    if (negative) t += `. Avoid: ${negative}`;
    return t;
  }, [scene, action, shot, camera, style, lighting, mood, audio, duration, aspect, negative, isVideo]);

  const prompt = format === "json" ? jsonPrompt : textPrompt;

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 260 }}>
          <label>AI model</label>
          <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
            {Object.entries(MODELS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Output format</label>
          <select className="input" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="json">JSON prompt</option>
            <option value="text">Plain text</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>{isVideo ? "Scene — what and where?" : "Image — what should be generated or edited?"}</label>
        <input className="input" value={scene} onChange={(e) => setScene(e.target.value)}
          placeholder="e.g. A weathered lighthouse on a cliff at dawn, waves crashing below" />
      </div>

      <div className="field">
        <label>{isVideo ? "Action — what happens?" : "Edit instruction (optional)"}</label>
        <input className="input" value={action} onChange={(e) => setAction(e.target.value)}
          placeholder={isVideo ? "e.g. The keeper climbs the spiral stairs and lights the lamp" : "e.g. Replace the sky with a thunderstorm, keep the subject unchanged"} />
      </div>

      <div className="row">
        <div className="field">
          <label>Shot type</label>
          <select className="input" value={shot} onChange={(e) => setShot(e.target.value)}>
            <option value="">Auto</option>
            {SHOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {isVideo && (
          <div className="field">
            <label>Camera movement</label>
            <select className="input" value={camera} onChange={(e) => setCamera(e.target.value)}>
              <option value="">Auto</option>
              {CAMERA_MOVES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>Style</label>
          <select className="input" value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="">Auto</option>
            {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="row">
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
        {isVideo && (
          <div className="field" style={{ maxWidth: 110 }}>
            <label>Duration (s)</label>
            <input className="input" type="number" min={1} max={60} value={duration}
              onChange={(e) => setDuration(e.target.value)} />
          </div>
        )}
        <div className="field" style={{ maxWidth: 110 }}>
          <label>Aspect ratio</label>
          <select className="input" value={aspect} onChange={(e) => setAspect(e.target.value)}>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
            <option value="21:9">21:9</option>
            <option value="4:3">4:3</option>
          </select>
        </div>
      </div>

      {isVideo && (
        <div className="field">
          <label>Audio / dialogue (optional — Veo 3 and Sora 2 generate sound)</label>
          <input className="input" value={audio} onChange={(e) => setAudio(e.target.value)}
            placeholder='e.g. Wind and distant gulls; the keeper mutters "almost there"' />
        </div>
      )}

      <div className="field">
        <label>Negative prompt — what to avoid (optional)</label>
        <input className="input" value={negative} onChange={(e) => setNegative(e.target.value)}
          placeholder="e.g. text overlays, watermarks, extra fingers, jump cuts" />
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Generated {format === "json" ? "JSON" : "text"} prompt</label>
        <textarea readOnly value={prompt}
          style={{ minHeight: 160, fontFamily: "var(--font-mono), monospace", fontSize: ".85rem", background: "var(--bg-2)" }} />
        <button className="btn" style={{ marginTop: 8 }} onClick={copy} disabled={!scene && !action}>
          {copied ? "✓ Copied" : "Copy prompt"}
        </button>
      </div>

      <p className="privacy-note">🔒 Does not generate video or images — it only builds the prompt. Everything runs in your browser; nothing is uploaded.</p>
    </div>
  );
}
