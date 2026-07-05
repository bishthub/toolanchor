"use client";

import { useEffect, useMemo, useState } from "react";
import DatePicker from "@/components/DatePicker";
import { readShared } from "@/lib/share";
import ShareResult from "@/components/ShareResult";

function diff(fromISO: string, toISO: string) {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (isNaN(+from) || isNaN(+to) || from > to) return null;

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.floor((+to - +from) / 86400000);
  return {
    years, months, days,
    totalMonths: years * 12 + months,
    totalWeeks: Math.floor(totalDays / 7),
    totalDays,
  };
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [at, setAt] = useState(todayISO());

  useEffect(() => {
    const s = readShared(["dob", "at"]);
    if (s.dob) setDob(s.dob);
    if (s.at) setAt(s.at);
  }, []);

  const result = useMemo(() => (dob ? diff(dob, at) : null), [dob, at]);

  return (
    <div>
      <div className="row">
        <div className="field">
          <label htmlFor="dob">Date of birth</label>
          <DatePicker id="dob" value={dob} max={at} onChange={setDob} placeholder="e.g. 14 Aug 1996 or “28 years ago”" />
        </div>
        <div className="field">
          <label htmlFor="at">Age at date</label>
          <DatePicker id="at" value={at} onChange={setAt} placeholder="Defaults to today" />
        </div>
      </div>

      {dob && !result && <p style={{ color: "#ff6b6b" }}>The “age at” date must be on or after the date of birth.</p>}

      {result && (
        <>
          <div className="stat" style={{ marginTop: 8 }}>
            <div className="n">{result.years}y {result.months}m {result.days}d</div>
            <div className="l">Exact age</div>
          </div>
          <div className="stats">
            <div className="stat"><div className="n">{result.totalMonths.toLocaleString()}</div><div className="l">Total months</div></div>
            <div className="stat"><div className="n">{result.totalWeeks.toLocaleString()}</div><div className="l">Total weeks</div></div>
            <div className="stat"><div className="n">{result.totalDays.toLocaleString()}</div><div className="l">Total days</div></div>
          </div>
        </>
      )}

      {result && <ShareResult values={{ dob, at }} />}

      <p className="privacy-note">🔒 The calculation runs entirely in your browser.</p>
    </div>
  );
}
