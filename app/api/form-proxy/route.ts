import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────
// GET /api/form-proxy?url=<google form link>
//
// Google Forms pages don't send CORS headers, so the browser can't read a
// form's questions directly. This route fetches the PUBLIC form page
// server-side, extracts the FB_PUBLIC_LOAD_DATA_ blob Google embeds in it,
// and returns just the question structure (titles, entry IDs, options).
//
// Privacy: only the form's URL ever reaches this route. The user's saved
// profile stays in their browser — matching and prefill-link building all
// happen client-side.
// ─────────────────────────────────────────────────────────────────────────

const ALLOWED_HOSTS = new Set(["docs.google.com", "forms.gle"]);

type QType =
  | "short" | "paragraph" | "choice" | "dropdown" | "checkbox"
  | "scale" | "date" | "time" | "grid" | "file" | "other";

const TYPE_MAP: Record<number, QType> = {
  0: "short", 1: "paragraph", 2: "choice", 3: "dropdown", 4: "checkbox",
  5: "scale", 7: "grid", 9: "date", 10: "time", 13: "file",
};

interface FormQuestion {
  entryId: number;
  title: string;
  help: string;
  type: QType;
  options: string[];
  required: boolean;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get("url")?.trim();
  if (!raw) return bad("Missing url parameter.");

  let target: URL;
  try {
    target = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return bad("That doesn't look like a valid link.");
  }
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return bad("Only Google Forms links (docs.google.com/forms or forms.gle) are supported.");
  }
  if (target.hostname === "docs.google.com" && !target.pathname.startsWith("/forms/")) {
    return bad("That docs.google.com link is not a Google Form.");
  }

  let res: Response;
  try {
    res = await fetch(target.toString(), {
      redirect: "follow",
      headers: {
        // A browser-like UA avoids Google's lite/blocked responses.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "accept-language": "en",
      },
    });
  } catch {
    return bad("Could not reach Google Forms. Try again in a moment.", 502);
  }

  const finalUrl = new URL(res.url);
  if (finalUrl.hostname.includes("accounts.google.com")) {
    return bad("This form requires signing in to Google, so it can't be pre-filled. Open it directly instead.", 422);
  }
  if (!res.ok) return bad(`Google returned an error (${res.status}). Is the form public?`, 502);

  const html = await res.text();
  const m = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\])\s*;\s*<\/script>/);
  if (!m) {
    return bad("Couldn't read this form. It may require sign-in, be closed, or not be a standard Google Form.", 422);
  }

  let data: unknown[];
  try {
    data = JSON.parse(m[1]);
  } catch {
    return bad("Couldn't parse this form's structure.", 422);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const d = data as any;
  const items: any[] = Array.isArray(d?.[1]?.[1]) ? d[1][1] : [];
  const questions: FormQuestion[] = [];

  for (const item of items) {
    if (!Array.isArray(item)) continue;
    const typeCode = item[3];
    const type = TYPE_MAP[typeCode as number];
    // 6 = text block, 8 = section header, images/videos — nothing to fill.
    if (!type) continue;
    const widgets = item[4];
    if (!Array.isArray(widgets) || !Array.isArray(widgets[0])) continue;
    const w = widgets[0];
    const options: string[] = Array.isArray(w[1])
      ? w[1].map((o: any) => String(o?.[0] ?? "")).filter((s: string) => s !== "")
      : [];
    questions.push({
      entryId: Number(w[0]),
      title: String(item[1] ?? "").trim() || "(untitled question)",
      help: String(item[2] ?? "").trim(),
      type: type === "grid" && widgets.length > 1 ? "grid" : type,
      options,
      required: !!w[2],
    });
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  if (questions.length === 0) {
    return bad("This form has no fillable questions.", 422);
  }

  // Canonical viewform URL (shortlinks resolved, params stripped).
  const viewUrl = `${finalUrl.origin}${finalUrl.pathname.replace(/\/(formResponse|edit).*$/, "/viewform")}`;

  const title = String(d?.[1]?.[8] ?? d?.[3] ?? "").trim() || "Google Form";
  const description = String(d?.[1]?.[0] ?? "").trim();
  // data[1][10][6] > 1 → the form collects the responder's email itself.
  const collectsEmail = !!(d?.[1]?.[10]?.[6] && Number(d[1][10][6]) > 1);

  return NextResponse.json(
    { title, description, url: viewUrl, collectsEmail, questions },
    { headers: { "cache-control": "no-store" } },
  );
}
