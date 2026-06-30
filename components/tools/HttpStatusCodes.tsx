"use client";

import { useMemo, useState } from "react";

const CODES: [number, string, string][] = [
  [100, "Continue", "The server received the request headers; the client should send the body."],
  [101, "Switching Protocols", "The server is switching protocols as requested."],
  [200, "OK", "The request succeeded."],
  [201, "Created", "The request succeeded and a new resource was created."],
  [202, "Accepted", "The request was accepted for processing but isn't complete."],
  [204, "No Content", "Success, but there's no content to return."],
  [206, "Partial Content", "The server is delivering part of the resource (range request)."],
  [301, "Moved Permanently", "The resource has permanently moved to a new URL."],
  [302, "Found", "The resource is temporarily at a different URL."],
  [304, "Not Modified", "The cached version is still valid; no need to re-download."],
  [307, "Temporary Redirect", "Temporary redirect that preserves the request method."],
  [308, "Permanent Redirect", "Permanent redirect that preserves the request method."],
  [400, "Bad Request", "The server can't process the request due to a client error."],
  [401, "Unauthorized", "Authentication is required and has failed or not been provided."],
  [403, "Forbidden", "The server understood the request but refuses to authorize it."],
  [404, "Not Found", "The requested resource could not be found."],
  [405, "Method Not Allowed", "The HTTP method isn't allowed for this resource."],
  [408, "Request Timeout", "The server timed out waiting for the request."],
  [409, "Conflict", "The request conflicts with the current state of the resource."],
  [410, "Gone", "The resource is permanently gone."],
  [418, "I'm a teapot", "An April Fools' joke code — the server refuses to brew coffee."],
  [422, "Unprocessable Entity", "The request was well-formed but had semantic errors (validation)."],
  [429, "Too Many Requests", "The client has sent too many requests (rate limited)."],
  [500, "Internal Server Error", "A generic server error occurred."],
  [501, "Not Implemented", "The server doesn't support the functionality required."],
  [502, "Bad Gateway", "An upstream server returned an invalid response."],
  [503, "Service Unavailable", "The server is temporarily overloaded or down for maintenance."],
  [504, "Gateway Timeout", "An upstream server didn't respond in time."],
];

const category = (c: number) =>
  c < 200 ? "Informational" : c < 300 ? "Success" : c < 400 ? "Redirect" : c < 500 ? "Client error" : "Server error";

export default function HttpStatusCodes() {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return CODES;
    return CODES.filter(([c, name, desc]) =>
      String(c).includes(t) || name.toLowerCase().includes(t) || desc.toLowerCase().includes(t) || category(c).toLowerCase().includes(t)
    );
  }, [q]);

  return (
    <div>
      <div className="field">
        <label>Search status codes</label>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="404, not found, redirect…" />
      </div>
      <ul className="file-list">
        {list.map(([c, name, desc]) => (
          <li key={c} style={{ display: "block" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <strong className="mono" style={{ color: "var(--accent)" }}>{c}</strong>
              <strong>{name}</strong>
              <span style={{ marginLeft: "auto", fontSize: ".72rem", color: "var(--muted)" }}>{category(c)}</span>
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: ".85rem" }}>{desc}</p>
          </li>
        ))}
        {!list.length && <li>No status code matches “{q}”.</li>}
      </ul>
    </div>
  );
}
