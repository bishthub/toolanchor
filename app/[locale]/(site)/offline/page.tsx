import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="container tool-page tool-focus" style={{ textAlign: "center", paddingTop: 80 }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: 14 }}>You&apos;re offline</h1>
      <p className="section-blurb" style={{ margin: "0 auto 26px" }}>
        No connection — but ToolAnchor runs in your browser, so any tool
        you&apos;ve opened before is still available. Try going back, or open a
        recently used tool from the homepage.
      </p>
      <Link href="/" className="btn" style={{ display: "inline-flex" }}>
        Go to homepage
      </Link>
    </div>
  );
}
