"use client";

import { useEffect, useState } from "react";
import { readShared } from "@/lib/share";
import ShareResult from "@/components/ShareResult";

// All IPv4 math on unsigned 32-bit integers (>>> 0 keeps values unsigned).

function parseIp(s: string): number | null {
  const parts = s.trim().split(".");
  if (parts.length !== 4) return null;
  let v = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    v = ((v << 8) | n) >>> 0;
  }
  return v;
}

const ipStr = (v: number) =>
  [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join(".");

const maskOf = (prefix: number) => (prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0);

const binStr = (v: number) =>
  [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]
    .map((o) => o.toString(2).padStart(8, "0"))
    .join(".");

function ipClass(firstOctet: number): string {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (multicast)";
  return "E (reserved)";
}

function scopeOf(ip: number): string {
  const a = (ip >>> 24) & 255;
  const b = (ip >>> 16) & 255;
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return "Private";
  if (a === 127) return "Loopback";
  if (a === 169 && b === 254) return "Link-local";
  return "Public";
}

export default function SubnetCalculator() {
  const [ipInput, setIpInput] = useState("192.168.1.0");
  const [prefixSel, setPrefixSel] = useState("24");

  useEffect(() => {
    const s = readShared(["ip", "prefix"]);
    if (s.ip) setIpInput(s.ip);
    if (s.prefix && /^\d{1,2}$/.test(s.prefix) && Number(s.prefix) <= 32) setPrefixSel(s.prefix);
  }, []);

  // Accept "192.168.1.0/24" pasted straight into the IP field — the slash
  // prefix then takes precedence over the select.
  const slash = ipInput.indexOf("/");
  const ipPart = slash >= 0 ? ipInput.slice(0, slash) : ipInput;
  const prefixPart = slash >= 0 ? ipInput.slice(slash + 1).trim() : prefixSel;

  const ip = parseIp(ipPart);
  const prefixOk = /^\d{1,2}$/.test(prefixPart) && Number(prefixPart) <= 32;
  const prefix = prefixOk ? Number(prefixPart) : -1;

  let error: string | null = null;
  if (ipInput.trim() !== "" && ip === null) error = "Enter a valid IPv4 address like 192.168.1.0 or 10.0.0.0/8.";
  else if (slash >= 0 && !prefixOk) error = "The CIDR prefix after the slash must be between 0 and 32.";

  const ready = ip !== null && prefixOk;

  let network = 0, broadcast = 0, first = 0, last = 0, mask = 0, wildcard = 0;
  let totalHosts = 0, usableHosts = 0;
  if (ready) {
    mask = maskOf(prefix);
    wildcard = ~mask >>> 0;
    network = (ip & mask) >>> 0;
    broadcast = (network | wildcard) >>> 0;
    totalHosts = Math.pow(2, 32 - prefix);
    if (prefix === 32) { usableHosts = 1; first = network; last = network; }
    else if (prefix === 31) { usableHosts = 2; first = network; last = broadcast; } // RFC 3021
    else { usableHosts = totalHosts - 2; first = (network + 1) >>> 0; last = (broadcast - 1) >>> 0; }
  }

  return (
    <div>
      <div className="row">
        <div className="field">
          <label>IPv4 address (CIDR form accepted, e.g. 192.168.1.0/24)</label>
          <input
            type="text"
            className="input"
            value={ipInput}
            placeholder="192.168.1.0"
            onChange={(e) => setIpInput(e.target.value)}
          />
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <label>CIDR prefix / subnet mask</label>
          <select className="input" value={prefixSel} onChange={(e) => setPrefixSel(e.target.value)} disabled={slash >= 0}>
            {Array.from({ length: 33 }, (_, p) => (
              <option key={p} value={String(p)}>/{p} — {ipStr(maskOf(p))}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {ready && (
        <>
          <div className="stats">
            <div className="stat"><div className="n">{ipStr(network)}</div><div className="l">Network address</div></div>
            <div className="stat"><div className="n">{ipStr(broadcast)}</div><div className="l">Broadcast address</div></div>
            <div className="stat"><div className="n">{ipStr(first)}</div><div className="l">First usable host</div></div>
            <div className="stat"><div className="n">{ipStr(last)}</div><div className="l">Last usable host</div></div>
            <div className="stat"><div className="n">{totalHosts.toLocaleString()}</div><div className="l">Total hosts</div></div>
            <div className="stat"><div className="n">{usableHosts.toLocaleString()}</div><div className="l">Usable hosts</div></div>
            <div className="stat"><div className="n">{ipStr(mask)} (/{prefix})</div><div className="l">Subnet mask</div></div>
            <div className="stat"><div className="n">{ipStr(wildcard)}</div><div className="l">Wildcard mask</div></div>
            <div className="stat"><div className="n">Class {ipClass((ip! >>> 24) & 255)} · {scopeOf(ip!)}</div><div className="l">IP class</div></div>
          </div>
          <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 10, fontFamily: "monospace" }}>
            Mask binary: {binStr(mask)}
          </p>
          <ShareResult values={{ ip: ipPart.trim(), prefix: String(prefix) }} />
        </>
      )}

      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
