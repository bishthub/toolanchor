// Serves the IndexNow key file. IndexNow verifies ownership by fetching this
// file and checking its contents equal the key. Set INDEXNOW_KEY in env.
export function GET() {
  const key = process.env.INDEXNOW_KEY || "";
  return new Response(key, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}
