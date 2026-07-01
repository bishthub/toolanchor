"use client";

// ─────────────────────────────────────────────────────────────────────────
// Registers the service worker (production only) and renders an
// "Install app" button when the browser offers installability.
// Everything runs client-side, so the installed app works fully offline.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaRegister() {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstallEvt(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvt) return null;

  return (
    <button
      type="button"
      className="install-btn"
      onClick={async () => {
        await installEvt.prompt();
        const { outcome } = await installEvt.userChoice;
        if (outcome === "accepted") setInstallEvt(null);
      }}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      Install app — works offline
    </button>
  );
}
