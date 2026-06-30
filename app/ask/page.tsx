import type { Metadata } from "next";
import ToolAssistant from "@/components/ToolAssistant";

export const metadata: Metadata = {
  title: "Ask — describe what you need",
  description:
    "Just tell us what you want to do and attach your file — we'll find the right free tool and run it, all in your browser. No AI guesswork, no uploads.",
  alternates: { canonical: "/ask" },
};

export default function AskPage() {
  return (
    <div className="container tool-page">
      <div className="tool-head" style={{ textAlign: "center" }}>
        <span className="eyebrow" style={{ justifyContent: "center" }}>Tell us what you need</span>
        <h1>What do you want to do?</h1>
        <p className="lede" style={{ marginLeft: "auto", marginRight: "auto" }}>
          Describe your task in plain words and attach a file if you have one —
          we&apos;ll pick the right tool and run it, right here in your browser.
        </p>
      </div>
      <ToolAssistant />
    </div>
  );
}
