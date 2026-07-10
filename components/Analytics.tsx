import Script from "next/script";

// Default GA4 measurement ID. Override per-environment with NEXT_PUBLIC_GA_ID
// (empty string disables GA entirely).
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-PC9WQ6TK92";

// Site analytics. Google Analytics 4 (gtag.js) runs by default; optional
// privacy-friendly Plausible is layered on when NEXT_PUBLIC_PLAUSIBLE_DOMAIN
// is set. Both load after interactive so they never block paint or hurt CWV.
export default function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}

      {plausibleDomain && (
        <Script defer data-domain={plausibleDomain} src={plausibleSrc} strategy="afterInteractive" />
      )}
    </>
  );
}
