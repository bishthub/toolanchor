"use client";

import { useEffect, useRef, useState } from "react";
import { usePreset, presetNumber } from "@/lib/preset";
import SendToTool from "@/components/SendToTool";

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function CompressImage({
  initialFiles,
  preset,
}: {
  initialFiles?: File[];
  preset?: Record<string, string>;
}) {
  const [origSize, setOrigSize] = useState(0);
  const [outSize, setOutSize] = useState<number | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("image");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const qualityRef = useRef(0.7);
  qualityRef.current = quality;

  // Preset / deep-link quality (e.g. ?q=0.5) — applied once on mount.
  const presetValues = usePreset(preset, ["q"]);
  useEffect(() => {
    const q = presetNumber(presetValues, "q", 0.1, 1);
    if (q !== undefined) {
      setQuality(q);
      qualityRef.current = q;
      if (imgRef.current) compress(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetValues]);

  function loadFile(file: File) {
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setOrigSize(file.size);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; compress(qualityRef.current, img); };
    img.src = url;
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  useEffect(() => {
    const f = initialFiles?.find((x) => x.type.startsWith("image/"));
    if (f) loadFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  function compress(q = quality, img = imgRef.current) {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (outUrl) URL.revokeObjectURL(outUrl);
        setOutUrl(URL.createObjectURL(blob));
        setOutSize(blob.size);
      },
      "image/jpeg",
      q
    );
  }

  function onQuality(q: number) {
    setQuality(q);
    compress(q);
  }

  function download() {
    if (!outUrl) return;
    const a = document.createElement("a");
    a.href = outUrl;
    a.download = `${fileName}-compressed.jpg`;
    a.click();
  }

  const saved = outSize !== null && origSize > 0 ? Math.max(0, Math.round((1 - outSize / origSize) * 100)) : 0;

  return (
    <div>
      <div className="field">
        <label>Choose an image</label>
        <input type="file" accept="image/*" onChange={onFile} className="input" />
      </div>

      {outSize !== null && (
        <>
          <div className="field">
            <label>Quality: {Math.round(quality * 100)}%</label>
            <input
              type="range" min={0.1} max={1} step={0.05} value={quality}
              onChange={(e) => onQuality(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div className="stats">
            <div className="stat"><div className="n">{fmtBytes(origSize)}</div><div className="l">Original</div></div>
            <div className="stat"><div className="n">{fmtBytes(outSize)}</div><div className="l">Compressed</div></div>
            <div className="stat"><div className="n">{saved}%</div><div className="l">Saved</div></div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button className="btn" onClick={download}>⬇ Download compressed image</button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {outUrl && <img src={outUrl} alt="compressed preview" className="preview-img" style={{ maxHeight: 280 }} />}

          <SendToTool
            kind="image"
            exclude="compress-image"
            getFile={async () => {
              if (!outUrl) return null;
              const blob = await fetch(outUrl).then((r) => r.blob());
              return new File([blob], `${fileName}-compressed.jpg`, { type: "image/jpeg" });
            }}
          />
        </>
      )}

      <p className="privacy-note">🔒 Compression runs locally — your image is never uploaded.</p>
    </div>
  );
}
