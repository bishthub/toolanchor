"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePreset, presetNumber } from "@/lib/preset";
import { loadImage, canvasBlob } from "@/lib/canvas";
import BatchFileList, { type BatchOutput } from "@/components/tools/BatchFileList";
import SendToTool from "@/components/SendToTool";

export default function ResizeImage({
  initialFiles,
  preset,
}: {
  initialFiles?: File[];
  preset?: Record<string, string>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [origDims, setOrigDims] = useState<{ w: number; h: number } | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [fileName, setFileName] = useState("image");
  const [batchFiles, setBatchFiles] = useState<File[] | null>(null);
  const [boxW, setBoxW] = useState(1080);
  const [boxH, setBoxH] = useState(1080);
  const [runToken, setRunToken] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Preset / deep-link dimensions (e.g. ?w=1080&h=1080) — applied on load.
  const presetValues = usePreset(preset, ["w", "h"]);
  const targetRef = useRef<{ w?: number; h?: number }>({});
  useEffect(() => {
    targetRef.current = {
      w: presetNumber(presetValues, "w", 1, 10000),
      h: presetNumber(presetValues, "h", 1, 10000),
    };
    // Seed the batch bounding box from a preset too.
    if (targetRef.current.w) setBoxW(targetRef.current.w);
    if (targetRef.current.h) setBoxH(targetRef.current.h);
  }, [presetValues]);
  const target = {
    w: presetNumber(presetValues, "w", 1, 10000),
    h: presetNumber(presetValues, "h", 1, 10000),
  };

  function loadFile(file: File) {
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSrc(url);
      setOrigDims({ w: img.naturalWidth, h: img.naturalHeight });
      const t = targetRef.current;
      if (t.w && t.h) {
        setWidth(t.w);
        setHeight(t.h);
        setLockRatio(false);
      } else if (t.w) {
        setWidth(t.w);
        setHeight(Math.round((t.w / img.naturalWidth) * img.naturalHeight));
      } else if (t.h) {
        setHeight(t.h);
        setWidth(Math.round((t.h / img.naturalHeight) * img.naturalWidth));
      } else {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      }
      imgRef.current = img;
    };
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

  function changeWidth(w: number) {
    setWidth(w);
    if (lockRatio && origDims) setHeight(Math.round((w / origDims.w) * origDims.h));
  }
  function changeHeight(h: number) {
    setHeight(h);
    if (lockRatio && origDims) setWidth(Math.round((h / origDims.h) * origDims.w));
  }

  function makeBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!imgRef.current) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(imgRef.current, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  async function download() {
    const blob = await makeBlob();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName}-${width}x${height}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Batch: scale each image to fit within boxW × boxH, keeping aspect ratio.
  const processBatch = useCallback(
    async (file: File): Promise<BatchOutput> => {
      const img = await loadImage(file);
      const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const blob = await canvasBlob(canvas, "image/png");
      const base = file.name.replace(/\.[^.]+$/, "");
      return { blob, name: `${base}-${w}x${h}.png` };
    },
    [boxW, boxH]
  );

  return (
    <div>
      {(target.w || target.h) && (
        <p className="preset-note">
          Preset active: images resize to{" "}
          <strong>
            {target.w && target.h ? `${target.w}×${target.h}px` : target.w ? `${target.w}px wide` : `${target.h}px tall`}
          </strong>{" "}
          automatically.
        </p>
      )}

      <div className="field">
        <label>Choose image{batchFiles ? "s" : "(s)"}</label>
        <input type="file" accept="image/*" multiple onChange={onFile} className="input" />
      </div>

      {batchFiles ? (
        <>
          <p style={{ color: "var(--muted)", fontSize: ".88rem", marginBottom: 10 }}>
            Each image scales to fit within this box, keeping its aspect ratio.
          </p>
          <div className="row">
            <div className="field">
              <label>Max width (px)</label>
              <input type="number" className="input" value={boxW} min={1} onChange={(e) => setBoxW(Math.max(1, Number(e.target.value)))} />
            </div>
            <div className="field">
              <label>Max height (px)</label>
              <input type="number" className="input" value={boxH} min={1} onChange={(e) => setBoxH(Math.max(1, Number(e.target.value)))} />
            </div>
          </div>
          <button type="button" className="btn secondary" style={{ marginBottom: 4 }} onClick={() => setRunToken((t) => t + 1)}>
            Re-resize all to fit {boxW}×{boxH}
          </button>
          <BatchFileList
            files={batchFiles}
            process={processBatch}
            runToken={runToken}
            zipName="resized-images"
            showSavings={false}
            onClear={() => setBatchFiles(null)}
          />
        </>
      ) : src && origDims && (
        <>
          <div className="row">
            <div className="field">
              <label>Width (px)</label>
              <input type="number" className="input" value={width} min={1} onChange={(e) => changeWidth(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Height (px)</label>
              <input type="number" className="input" value={height} min={1} onChange={(e) => changeHeight(Number(e.target.value))} />
            </div>
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)", fontSize: ".9rem" }}>
            <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} />
            Lock aspect ratio (original {origDims.w}×{origDims.h})
          </label>

          <div style={{ marginTop: 18 }}>
            <button className="btn" onClick={download}>⬇ Download resized PNG</button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="preview" className="preview-img" style={{ maxHeight: 280 }} />

          <SendToTool
            kind="image"
            exclude="resize-image"
            getFile={async () => {
              const blob = await makeBlob();
              return blob ? new File([blob], `${fileName}-${width}x${height}.png`, { type: "image/png" }) : null;
            }}
          />
        </>
      )}

      <p className="privacy-note">🔒 Resizing happens locally — your image{batchFiles ? "s are" : " is"} never uploaded.</p>
    </div>
  );
}
