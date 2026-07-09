"use client";

import { useState, useMemo } from "react";

interface City {
  name: string;
  tz: string;
  country: string;
  flag: string;
}

const CITIES: City[] = [
  { name: "New York", tz: "America/New_York", country: "United States", flag: "🇺🇸" },
  { name: "Chicago", tz: "America/Chicago", country: "United States", flag: "🇺🇸" },
  { name: "Denver", tz: "America/Denver", country: "United States", flag: "🇺🇸" },
  { name: "Los Angeles", tz: "America/Los_Angeles", country: "United States", flag: "🇺🇸" },
  { name: "Anchorage", tz: "America/Anchorage", country: "United States", flag: "🇺🇸" },
  { name: "Honolulu", tz: "Pacific/Honolulu", country: "United States", flag: "🇺🇸" },
  { name: "Vancouver", tz: "America/Vancouver", country: "Canada", flag: "🇨🇦" },
  { name: "Toronto", tz: "America/Toronto", country: "Canada", flag: "🇨🇦" },
  { name: "Mexico City", tz: "America/Mexico_City", country: "Mexico", flag: "🇲🇽" },
  { name: "São Paulo", tz: "America/Sao_Paulo", country: "Brazil", flag: "🇧🇷" },
  { name: "Buenos Aires", tz: "America/Argentina/Buenos_Aires", country: "Argentina", flag: "🇦🇷" },
  { name: "London", tz: "Europe/London", country: "United Kingdom", flag: "🇬🇧" },
  { name: "Paris", tz: "Europe/Paris", country: "France", flag: "🇫🇷" },
  { name: "Berlin", tz: "Europe/Berlin", country: "Germany", flag: "🇩🇪" },
  { name: "Madrid", tz: "Europe/Madrid", country: "Spain", flag: "🇪🇸" },
  { name: "Rome", tz: "Europe/Rome", country: "Italy", flag: "🇮🇹" },
  { name: "Amsterdam", tz: "Europe/Amsterdam", country: "Netherlands", flag: "🇳🇱" },
  { name: "Stockholm", tz: "Europe/Stockholm", country: "Sweden", flag: "🇸🇪" },
  { name: "Moscow", tz: "Europe/Moscow", country: "Russia", flag: "🇷🇺" },
  { name: "Istanbul", tz: "Europe/Istanbul", country: "Turkey", flag: "🇹🇷" },
  { name: "Dubai", tz: "Asia/Dubai", country: "UAE", flag: "🇦🇪" },
  { name: "Mumbai", tz: "Asia/Kolkata", country: "India", flag: "🇮🇳" },
  { name: "Singapore", tz: "Asia/Singapore", country: "Singapore", flag: "🇸🇬" },
  { name: "Hong Kong", tz: "Asia/Hong_Kong", country: "China", flag: "🇭🇰" },
  { name: "Shanghai", tz: "Asia/Shanghai", country: "China", flag: "🇨🇳" },
  { name: "Tokyo", tz: "Asia/Tokyo", country: "Japan", flag: "🇯🇵" },
  { name: "Seoul", tz: "Asia/Seoul", country: "South Korea", flag: "🇰🇷" },
  { name: "Sydney", tz: "Australia/Sydney", country: "Australia", flag: "🇦🇺" },
  { name: "Auckland", tz: "Pacific/Auckland", country: "New Zealand", flag: "🇳🇿" },
];

export default function TimeZoneConverter() {
  const [baseCity, setBaseCity] = useState("America/New_York");
  const [baseDate, setBaseDate] = useState(() => new Date().toISOString().slice(0, 16));

  const times = useMemo(() => {
    const base = new Date(baseDate);
    if (isNaN(base.getTime())) return [];

    return CITIES.map((city) => {
      const t = new Date(base.toLocaleString("en-US", { timeZone: city.tz }));
      return { ...city, time: t, offset: tzOffset(city.tz) };
    }).sort((a, b) => a.time.getTime() - b.time.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCity, baseDate]);

  return (
    <div>
      <div className="row">
        <div className="field" style={{ maxWidth: 300 }}>
          <label>From city</label>
          <select className="input" value={baseCity} onChange={(e) => setBaseCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.tz} value={c.tz}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ maxWidth: 280 }}>
          <label>Date &amp; time</label>
          <input className="input" type="datetime-local" value={baseDate} onChange={(e) => setBaseDate(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Times around the world</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 70px", gap: 0, background: "var(--surface-2)", padding: "8px 14px", fontSize: ".72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--faint)", borderBottom: "1px solid var(--border)" }}>
            <span>City</span>
            <span style={{ textAlign: "right" }}>Local time</span>
            <span style={{ textAlign: "right" }}>Offset</span>
          </div>
          {times.map((city) => {
            const now = new Date();
            const isCurrent = Math.abs(city.time.getTime() - now.getTime()) < 60000;
            return (
              <div
                key={city.tz}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 100px 70px", gap: 0,
                  padding: "8px 14px", fontSize: ".88rem", borderBottom: "1px solid var(--border)",
                  background: isCurrent && city.tz !== baseCity ? "color-mix(in srgb, var(--accent) 5%, transparent)" : undefined,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{city.flag}</span>
                  <span style={{ fontWeight: city.tz === baseCity ? 650 : 500 }}>{city.name}</span>
                  {isCurrent && <span style={{ fontSize: ".6rem", color: "var(--ok)" }}>●</span>}
                </span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono), monospace", fontSize: ".82rem" }}>
                  {city.time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono), monospace", fontSize: ".78rem", color: "var(--muted)" }}>
                  {city.offset}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="privacy-note">🔒 All time zone conversions run in your browser using the built-in Intl API. No data is uploaded.</p>
    </div>
  );
}

function tzOffset(tz: string): string {
  try {
    const d = new Date();
    const locale = d.toLocaleDateString("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
    const parts = locale.split(", ");
    const offset = parts[parts.length - 1] || "";
    return offset.replace("GMT", "UTC");
  } catch { return ""; }
}
