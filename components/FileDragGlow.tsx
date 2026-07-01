"use client";

// ─────────────────────────────────────────────────────────────────────────
// While the user drags a file anywhere over the page, add a class to <html>
// so every file input lights up as a drop target (native inputs accept
// drops directly). Pure class-toggling — no DOM restructuring.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";

export default function FileDragGlow() {
  useEffect(() => {
    let timer: number | undefined;

    function onDragOver(e: DragEvent) {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      document.documentElement.classList.add("dragging-files");
      window.clearTimeout(timer);
      // dragleave is unreliable across nested elements; expire instead.
      timer = window.setTimeout(
        () => document.documentElement.classList.remove("dragging-files"),
        200
      );
    }
    function clear() {
      window.clearTimeout(timer);
      document.documentElement.classList.remove("dragging-files");
    }

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", clear);
    window.addEventListener("dragend", clear);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", clear);
      window.removeEventListener("dragend", clear);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
