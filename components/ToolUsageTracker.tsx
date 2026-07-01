"use client";

// Records a visit to this tool in local recents. Renders nothing.

import { useEffect } from "react";
import { addRecent } from "@/lib/usage";

export default function ToolUsageTracker({ slug }: { slug: string }) {
  useEffect(() => {
    addRecent(slug);
  }, [slug]);
  return null;
}
