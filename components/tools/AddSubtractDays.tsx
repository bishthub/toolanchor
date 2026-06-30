"use client";

import { useMemo, useState } from "react";
import DatePicker from "@/components/DatePicker";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AddSubtractDays() {
  const [start, setStart] = useState(todayISO());
  const [op, setOp] = useState<"add" | "sub">("add");
  const [amount, setAmount] = useState("30");
  const [unit, setUnit] = useState<"days" | "weeks" | "months" | "years">("days");

  const result = useMemo(() => {
    const d = new Date(start);
    const n = parseInt(amount, 10);
    if (isNaN(+d) || isNaN(n)) return null;
    const sign = op === "add" ? 1 : -1;
    const v = sign * n;
    if (unit === "days") d.setDate(d.getDate() + v);
    else if (unit === "weeks") d.setDate(d.getDate() + v * 7);
    else if (unit === "months") d.setMonth(d.getMonth() + v);
    else d.setFullYear(d.getFullYear() + v);
    return d;
  }, [start, op, amount, unit]);

  const fmt = result
    ? result.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div>
      <div className="field">
        <label htmlFor="start">Start date</label>
        <DatePicker id="start" value={start} onChange={setStart} placeholder="Pick a date or type “today”" />
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field">
          <label>Operation</label>
          <div className="row">
            <button type="button" className={`btn ${op === "add" ? "" : "secondary"}`} onClick={() => setOp("add")}>Add</button>
            <button type="button" className={`btn ${op === "sub" ? "" : "secondary"}`} onClick={() => setOp("sub")}>Subtract</button>
          </div>
        </div>
        <div className="field" style={{ maxWidth: 120 }}>
          <label>Amount</label>
          <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 140 }}>
          <label>Unit</label>
          <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}>
            <option value="days">Days</option><option value="weeks">Weeks</option>
            <option value="months">Months</option><option value="years">Years</option>
          </select>
        </div>
      </div>

      {result && (
        <div className="stat">
          <div className="n" style={{ fontSize: "1.2rem" }}>{fmt}</div>
          <div className="l">Resulting date</div>
        </div>
      )}
      <p className="privacy-note">🔒 Calculated instantly in your browser.</p>
    </div>
  );
}
