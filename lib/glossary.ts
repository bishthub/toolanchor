// ─────────────────────────────────────────────────────────────────────────
// Glossary — short, authoritative "What is X?" definition pages. These target
// definitional queries (high volume, low competition) and are the format AI
// answer engines cite most: a self-contained definition + facts + a source.
// Each term links to the ToolAnchor tool that acts on it. Data-driven → the
// index, detail pages, sitemap and llms.txt all generate from this array.
// ─────────────────────────────────────────────────────────────────────────

import { LAST_REVIEWED } from "./site";

export interface GlossarySection { h2: string; body: string; }
export interface GlossaryTerm {
  slug: string;        // URL: /glossary/<slug>
  term: string;        // <h1> — the thing being defined, e.g. "JWT (JSON Web Token)"
  aka?: string[];      // alternative names / abbreviations
  short: string;       // one-line meta description + DefinedTerm.description
  definition: string;  // 40–60 word self-contained definition (the callout + answer)
  sections: GlossarySection[];
  toolSlug?: string;   // the tool that acts on this term
  related: string[];   // other glossary slugs
  faqs?: { q: string; a: string }[];
  sources?: { label: string; url: string }[];
  updated?: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: "jwt",
    term: "JWT (JSON Web Token)",
    aka: ["JSON Web Token", "bearer token"],
    short: "What a JWT is, its three parts, and how it's used for authentication.",
    definition:
      "A JWT (JSON Web Token, defined in RFC 7519) is a compact, URL-safe way to represent claims between two parties. It has three Base64url-encoded parts separated by dots — header, payload and signature — and is commonly used as an authentication token. It's signed, not encrypted, so the payload is readable by anyone.",
    sections: [
      { h2: "The three parts", body: "A JWT is written as header.payload.signature. The header declares the signing algorithm (e.g. HS256 or RS256). The payload holds the claims — data such as the user ID, expiry (exp) and issuer (iss). The signature is computed from the first two parts plus a secret or private key, and proves the token hasn't been altered." },
      { h2: "Signed, not encrypted", body: "By default a JWT is signed but not encrypted. Anyone can Base64url-decode and read the payload, so you must never store secrets in it. The signature only guarantees integrity and authenticity — that the token came from who it claims and wasn't tampered with." },
    ],
    toolSlug: "jwt-decoder",
    related: ["base64", "hash", "sha-256"],
    faqs: [
      { q: "Is a JWT encrypted?", a: "No — by default it is signed, not encrypted. The payload is only Base64url-encoded and can be read by anyone, so never put secrets in it." },
      { q: "What does decoding a JWT show?", a: "The header and payload as readable JSON, including standard claims like exp (expiry), iat (issued-at) and iss (issuer)." },
    ],
    sources: [
      { label: "RFC 7519 — JSON Web Token", url: "https://datatracker.ietf.org/doc/html/rfc7519" },
      { label: "JSON Web Token — Wikipedia", url: "https://en.wikipedia.org/wiki/JSON_Web_Token" },
    ],
  },
  {
    slug: "base64",
    term: "Base64",
    aka: ["base-64 encoding"],
    short: "What Base64 encoding is, why it exists, and how much it grows data.",
    definition:
      "Base64 (specified in RFC 4648) is a binary-to-text encoding that represents data using 64 printable ASCII characters. It lets binary data travel safely through text-only channels such as email or data URIs. Encoding grows the data by about 33%, because every 3 bytes become 4 characters. It is encoding, not encryption — it provides no security.",
    sections: [
      { h2: "Why Base64 exists", body: "Many older systems — email (MIME), URLs, JSON, HTML data URIs — were designed for text, not raw bytes. Base64 maps arbitrary binary into a safe 64-character alphabet (A–Z, a–z, 0–9, + and /) so it survives those channels intact. The URL-safe variant swaps + and / for - and _." },
      { h2: "It is not encryption", body: "Base64 is fully reversible by anyone with no key, so it offers zero confidentiality. Use it to transport data, not to protect it. To secure data you need encryption; to verify integrity you need a hash or signature." },
    ],
    toolSlug: "base64",
    related: ["jwt", "url-encoding", "mime-type"],
    faqs: [
      { q: "Does Base64 make data bigger?", a: "Yes — by roughly 33%, since every 3 bytes are encoded as 4 characters." },
      { q: "Is Base64 secure?", a: "No. It's an encoding, not encryption — anyone can decode it without a key." },
    ],
    sources: [
      { label: "RFC 4648 — Base16/32/64 encodings", url: "https://datatracker.ietf.org/doc/html/rfc4648" },
      { label: "Base64 — Wikipedia", url: "https://en.wikipedia.org/wiki/Base64" },
    ],
  },
  {
    slug: "cron-expression",
    term: "Cron expression",
    aka: ["crontab schedule", "cron syntax"],
    short: "What a cron expression is and how its five fields schedule tasks.",
    definition:
      "A cron expression is a string of five (sometimes six) fields that tells the Unix cron scheduler when to run a task: minute, hour, day-of-month, month and day-of-week. For example, 0 9 * * 1 means 09:00 every Monday. An asterisk (*) means 'every' value for that field.",
    sections: [
      { h2: "The five fields", body: "In order: minute (0–59), hour (0–23), day of month (1–31), month (1–12) and day of week (0–7, where 0 and 7 are both Sunday). Fields accept lists (1,15), ranges (1-5) and steps (*/15 = every 15). Some schedulers add a leading seconds field, making six fields." },
      { h2: "Reading an example", body: "*/15 * * * * runs every 15 minutes. 0 0 * * * runs daily at midnight. 30 8 1 * * runs at 08:30 on the first of every month. Because the syntax is terse, a cron explainer that translates it into plain English helps avoid mistakes." },
    ],
    toolSlug: "cron-explainer",
    related: ["unix-time", "uuid"],
    faqs: [
      { q: "What does * mean in cron?", a: "An asterisk means 'every' possible value for that field — so * in the hour field means every hour." },
      { q: "How many fields does a cron expression have?", a: "Five in standard Unix cron (minute, hour, day-of-month, month, day-of-week). Some systems add a sixth seconds field." },
    ],
    sources: [
      { label: "cron — Wikipedia", url: "https://en.wikipedia.org/wiki/Cron" },
    ],
  },
  {
    slug: "uuid",
    term: "UUID (Universally Unique Identifier)",
    aka: ["GUID", "globally unique identifier"],
    short: "What a UUID is, how big it is, and why version 4 is effectively collision-free.",
    definition:
      "A UUID (universally unique identifier), also called a GUID, is a 128-bit identifier written as 36 characters in the form 8-4-4-4-12, e.g. 550e8400-e29b-41d4-a716-446655440000. Version 4 UUIDs are generated from random numbers, making collisions so improbable that independent systems can create them without any coordination.",
    sections: [
      { h2: "Why they're unique", body: "A version-4 UUID has 122 random bits (per RFC 9562, which supersedes RFC 4122). The number of possible values is so vast that generating billions per second for many years still gives a negligible chance of a collision — which is why UUIDs are safe to create on many machines at once." },
      { h2: "When to use one", body: "Use a UUID when you need a unique identifier without a central counter: distributed systems, offline-first apps, merge-friendly database keys, or public IDs you don't want users to guess or enumerate sequentially." },
    ],
    toolSlug: "uuid-generator",
    related: ["hash", "sha-256", "cron-expression"],
    faqs: [
      { q: "Can two UUIDs be the same?", a: "In theory yes, but for version 4 the probability is so small it's ignored in practice." },
      { q: "Is a GUID the same as a UUID?", a: "Yes — GUID is Microsoft's name for the same 128-bit identifier." },
    ],
    sources: [
      { label: "RFC 9562 — UUID", url: "https://datatracker.ietf.org/doc/html/rfc9562" },
      { label: "Universally unique identifier — Wikipedia", url: "https://en.wikipedia.org/wiki/Universally_unique_identifier" },
    ],
  },
  {
    slug: "mime-type",
    term: "MIME type (media type)",
    aka: ["content type", "media type"],
    short: "What a MIME type is and how it tells software how to handle a file.",
    definition:
      "A MIME type (also called a media type or content type) is a two-part label like text/html or image/png that tells software what kind of data a file or response contains. The part before the slash is the type (text, image, application); the part after is the subtype. Browsers use it to decide how to handle content.",
    sections: [
      { h2: "How it's structured", body: "The format is type/subtype, optionally with parameters — e.g. text/html; charset=utf-8. Common examples: application/json, image/jpeg, application/pdf, text/csv. The IANA maintains the official registry of media types." },
      { h2: "Why it matters", body: "Servers send a Content-Type header so the browser renders HTML, displays an image, or downloads a file correctly. A wrong MIME type causes bugs — code shown as plain text, downloads that won't open, or images that don't display." },
    ],
    toolSlug: "mime-type-lookup",
    related: ["http-status-code", "base64", "url-encoding"],
    faqs: [
      { q: "What's the MIME type for JSON?", a: "application/json." },
      { q: "Is content type the same as MIME type?", a: "Yes — 'content type' (from the HTTP header) and 'media type' are other names for the same label." },
    ],
    sources: [
      { label: "Media type — Wikipedia", url: "https://en.wikipedia.org/wiki/Media_type" },
      { label: "IANA Media Types registry", url: "https://www.iana.org/assignments/media-types/media-types.xhtml" },
    ],
  },
  {
    slug: "http-status-code",
    term: "HTTP status code",
    aka: ["response code", "status code"],
    short: "What HTTP status codes are and what each numeric class (1xx–5xx) means.",
    definition:
      "An HTTP status code is a three-digit number a server returns to describe the outcome of a request. The first digit sets the class: 1xx informational, 2xx success, 3xx redirection, 4xx client error, and 5xx server error. For example, 200 means OK, 404 means Not Found, and 500 means Internal Server Error.",
    sections: [
      { h2: "The five classes", body: "1xx (100–199) are informational; 2xx (200–299) mean success — 200 OK, 201 Created; 3xx (300–399) are redirects — 301 permanent, 302 temporary; 4xx (400–499) are client errors — 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests; 5xx (500–599) are server errors — 500, 502 Bad Gateway, 503 Service Unavailable." },
      { h2: "Common ones to know", body: "200 (success), 301 (moved permanently — important for SEO), 404 (not found), 429 (rate-limited) and 500/503 (server problems) cover most day-to-day debugging and are the codes worth memorising first." },
    ],
    toolSlug: "http-status-codes",
    related: ["mime-type", "url-encoding"],
    faqs: [
      { q: "What does a 404 mean?", a: "Not Found — the server couldn't find the requested resource at that URL." },
      { q: "What's the difference between 301 and 302?", a: "301 is a permanent redirect (search engines pass ranking to the new URL); 302 is temporary." },
    ],
    sources: [
      { label: "List of HTTP status codes — Wikipedia", url: "https://en.wikipedia.org/wiki/List_of_HTTP_status_codes" },
      { label: "RFC 9110 — HTTP Semantics", url: "https://datatracker.ietf.org/doc/html/rfc9110" },
    ],
  },
  {
    slug: "url-encoding",
    term: "URL encoding (percent-encoding)",
    aka: ["percent-encoding", "URI encoding"],
    short: "What URL encoding is and why spaces and symbols become %XX in links.",
    definition:
      "URL encoding, or percent-encoding, replaces characters that aren't allowed in a URL with a percent sign followed by two hexadecimal digits of their byte value. For example a space becomes %20 and an ampersand becomes %26. It lets spaces, symbols and non-ASCII text travel safely inside web addresses and query strings.",
    sections: [
      { h2: "Why it's needed", body: "URLs may only contain a limited set of characters. Reserved characters like ?, &, = and / have special meaning, and spaces aren't allowed at all. Percent-encoding escapes anything unsafe so a value like a name with spaces survives inside a query parameter without breaking the URL." },
      { h2: "How it looks", body: "Each unsafe byte becomes %XX. Space is %20, @ is %40, and a comma is %2C. Non-ASCII characters are first encoded as UTF-8 bytes, then each byte is percent-encoded — so an emoji or accented letter becomes several %XX sequences." },
    ],
    toolSlug: "url-encoder",
    related: ["base64", "mime-type", "http-status-code"],
    faqs: [
      { q: "Why is a space shown as %20 in a URL?", a: "Because spaces aren't valid in URLs, so they're percent-encoded to %20." },
      { q: "Is URL encoding the same as Base64?", a: "No — URL encoding escapes unsafe characters as %XX; Base64 re-encodes data into a 64-character alphabet." },
    ],
    sources: [
      { label: "Percent-encoding — Wikipedia", url: "https://en.wikipedia.org/wiki/Percent-encoding" },
      { label: "RFC 3986 — URI Generic Syntax", url: "https://datatracker.ietf.org/doc/html/rfc3986" },
    ],
  },
  {
    slug: "sha-256",
    term: "SHA-256 (hash function)",
    aka: ["SHA-2", "cryptographic hash"],
    short: "What SHA-256 is, what a hash is, and why hashing is one-way.",
    definition:
      "SHA-256 is a cryptographic hash function from the SHA-2 family that turns any input into a fixed 256-bit (64-character hexadecimal) value called a digest. The same input always yields the same digest, but the process is one-way — you cannot reverse a digest back to the original — which makes it useful for integrity checks and fingerprints.",
    sections: [
      { h2: "What a hash is", body: "A hash function maps data of any size to a fixed-size value. Good cryptographic hashes are deterministic, fast to compute, infeasible to reverse, and collision-resistant — it's practically impossible to find two inputs with the same digest. Changing a single bit of input changes the digest completely." },
      { h2: "What it's used for", body: "SHA-256 verifies file integrity (compare digests before and after transfer), fingerprints data, and underpins signatures and blockchains. Note: for storing passwords you should use a slow, salted algorithm like bcrypt or Argon2 — a plain fast hash like SHA-256 is not sufficient on its own." },
    ],
    toolSlug: "hash-generator",
    related: ["jwt", "uuid", "base64"],
    faqs: [
      { q: "Can you reverse a SHA-256 hash?", a: "No — hashing is one-way. You can only guess inputs and compare their digests." },
      { q: "How long is a SHA-256 hash?", a: "256 bits, usually shown as 64 hexadecimal characters." },
    ],
    sources: [
      { label: "SHA-2 — Wikipedia", url: "https://en.wikipedia.org/wiki/SHA-2" },
      { label: "FIPS 180-4 — Secure Hash Standard", url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final" },
    ],
  },
];

export function getTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}

/** ISO date a term was last reviewed (falls back to the site-wide date). */
export function termUpdated(t: GlossaryTerm): string {
  return t.updated ?? LAST_REVIEWED;
}
