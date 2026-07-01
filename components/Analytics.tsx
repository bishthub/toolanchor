import Script from "next/script";

// Privacy-friendly, cookieless analytics (Plausible). Renders nothing unless
// NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, so the site works with zero tracking by
// default. Self-hosted instances can override the host via NEXT_PUBLIC_PLAUSIBLE_SRC.
export default function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";
  return <Script defer data-domain={domain} src={src} strategy="afterInteractive" />;
}
