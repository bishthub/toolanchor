"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePreset, presetNumber } from "@/lib/preset";
import { loadImage, canvasBlob, renameExt } from "@/lib/canvas";
import BatchFileList, { type BatchOutput } from "@/components/tools/BatchFileList";
import SendToTool from "@/components/SendToTool";

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** Encode an image at a given scale + JPEG quality. */
async function encodeAt(img: HTMLImageElement, scale: number, q: number): Promise<Blob> {
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvasBlob(canvas, "image/jpeg", q);
}

/**
 * Find the highest-quality JPEG that fits under `targetBytes`, stepping the
 * dimensions down when quality alone can't get there. Returns the smallest
 * achievable blob (with hitTarget=false) when the target is impossible.
 */
async function compressToTarget(
  img: HTMLImageElement,
  targetBytes: number
): Promise<{ blob: Blob; hitTarget: boolean }> {
  const scales = [1, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2];
  let smallest: Blob | null = null;
  for (const scale of scales) {
    let lo = 0.05;
    let hi = 0.95;
    let fit: Blob | null = null;
    for (let i = 0; i < 7; i++) {
      const q = (lo + hi) / 2;
      const blob = await encodeAt(img, scale, q);
      if (blob.size <= targetBytes) {
        fit = blob; // fits — try for higher quality
        lo = q;
      } else {
        hi = q;
      }
    }
    if (fit) return { blob: fit, hitTarget: true };
    const low = await encodeAt(img, scale, 0.05);
    if (!smallest || low.size < smallest.size) smallest = low;
  }
  return { blob: smallest!, hitTarget: false };
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
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [runToken, setRunToken] = useState(0);
  const [hitTarget, setHitTarget] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const qualityRef = useRef(0.7);
  qualityRef.current = quality;

  // Preset / deep-link: quality (?q=0.5) or a size target (?kb=100).
  const presetValues = usePreset(preset, ["q", "kb"]);
  const targetKb = presetNumber(presetValues, "kb", 1, 100000);
  const targetMode = targetKb !== undefined;
  const targetBytes = targetKb !== undefined ? targetKb * 1024 : 0;
  const targetRef = useRef(0);
  targetRef.current = targetBytes;

  useEffect(() => {
    const q = presetNumber(presetValues, "q", 0.1, 1);
    if (q !== undefined) {
      setQuality(q);
      qualityRef.current = q;
      if (imgRef.current && !targetMode) compress(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetValues]);

  async function loadFile(file: File) {
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setOrigSize(file.size);
    if (targetMode) {
      setWorking(true);
      try {
        const img = await loadImage(file);
        imgRef.current = img;
        const { blob, hitTarget } = await compressToTarget(img, targetRef.current);
        if (outUrl) URL.revokeObjectURL(outUrl);
        setOutUrl(URL.createObjectURL(blob));
        setOutSize(blob.size);
        setHitTarget(hitTarget);
      } finally {
        setWorking(false);
      }
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; compress(qualityRef.current, img); };
    img.src = url;
  }

  function selectFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    if (images.length === 1) {
      setBatchFiles(null);
      loadFile(images[0]);
    } else {
      setBatchFiles(images);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    selectFiles(Array.from(e.target.files ?? []));
  }

  useEffect(() => {
    if (initialFiles?.length) selectFiles(initialFiles);
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

  // Batch: compress each image — to the size target if set, else at quality.
  const processBatch = useCallback(
    async (file: File): Promise<BatchOutput> => {
      const img = await loadImage(file);
      const name = renameExt(file.name, "jpg").replace(/(\.jpg)$/i, "-compressed$1");
      if (targetMode) {
        const { blob } = await compressToTarget(img, targetRef.current);
        return { blob, name };
      }
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      const blob = await canvasBlob(canvas, "image/jpeg", quality);
      return { blob, name };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quality, targetMode]
  );

  const saved = outSize !== null && origSize > 0 ? Math.max(0, Math.round((1 - outSize / origSize) * 100)) : 0;

  return (
    <div>
      {targetMode && (
        <p className="preset-note">
          Target active: images are compressed to <strong>≤ {targetKb} KB</strong> automatically.
        </p>
      )}

      <div className="field">
        <label>Choose image{batchFiles ? "s" : "(s)"}</label>
        <input type="file" accept="image/*" multiple onChange={onFile} className="input" />
      </div>

      {batchFiles ? (
        <>
          {!targetMode && (
            <div className="field">
              <label>Quality: {Math.round(quality * 100)}%</label>
              <input
                type="range" min={0.1} max={1} step={0.05} value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <button type="button" className="btn secondary" style={{ marginTop: 10 }} onClick={() => setRunToken((t) => t + 1)}>
                Re-compress all at {Math.round(quality * 100)}%
              </button>
            </div>
          )}
          <BatchFileList
            files={batchFiles}
            process={processBatch}
            runToken={runToken}
            zipName="compressed-images"
            onClear={() => setBatchFiles(null)}
          />
        </>
      ) : working ? (
        <p style={{ color: "var(--muted)", marginTop: 14 }}>Finding the best quality under {targetKb} KB…</p>
      ) : outSize !== null && (
        <>
          {!targetMode && (
            <div className="field">
              <label>Quality: {Math.round(quality * 100)}%</label>
              <input
                type="range" min={0.1} max={1} step={0.05} value={quality}
                onChange={(e) => onQuality(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
          )}

          <div className="stats">
            <div className="stat"><div className="n">{fmtBytes(origSize)}</div><div className="l">Original</div></div>
            <div className="stat"><div className="n">{fmtBytes(outSize)}</div><div className="l">Compressed</div></div>
            <div className="stat"><div className="n">{saved}%</div><div className="l">Saved</div></div>
          </div>

          {targetMode && hitTarget === false && (
            <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 10 }}>
              This image can’t reach {targetKb} KB while staying legible. The smallest achievable size is <strong>{fmtBytes(outSize)}</strong>.
            </p>
          )}
          {targetMode && hitTarget && (
            <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 10 }}>
              Done — compressed to {fmtBytes(outSize)}, under your {targetKb} KB target.
            </p>
          )}

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

      <p className="privacy-note">🔒 Compression runs locally — your image{batchFiles ? "s are" : " is"} never uploaded.</p>
    </div>
  );
}
