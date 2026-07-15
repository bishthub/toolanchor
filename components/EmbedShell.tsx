"use client";

import { useEffect, useRef } from "react";

// Client wrapper for /embed/<slug> pages: reports its rendered height to the
// parent page (for the auto-resizing embed.js loader) and shows the
// always-on attribution link back to the tool page.

export default function EmbedShell({
  toolUrl,
  toolName,
  children,
}: {
  toolUrl: string;
  toolName: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Echo back the loader-assigned id so multiple widgets on one host page
    // each resize their own iframe.
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    const send = () => {
      const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
      window.parent?.postMessage({ type: "toolanchor:resize", id, height }, "*");
    };
    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ padding: "16px 16px 10px", minHeight: 120 }}>
      {children}
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          fontSize: ".78rem",
          color: "var(--muted)",
        }}
      >
        <span>Runs in your browser — no data leaves this page.</span>
        <a
          href={toolUrl}
          target="_blank"
          rel="noopener"
          style={{ color: "var(--muted)", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          {toolName} · Powered by <strong style={{ color: "var(--fg, inherit)" }}>ToolAnchor</strong>
        </a>
      </div>
    </div>
  );
}
