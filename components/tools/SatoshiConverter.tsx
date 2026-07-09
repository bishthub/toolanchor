"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

// 1 BTC = 100,000,000 satoshis
const SATS_PER_BTC = 100_000_000;

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan" },
  { code: "KRW", symbol: "₩", label: "South Korean Won" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real" },
];

function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(4).replace(/\.?0+$/, "") + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(4).replace(/\.?0+$/, "") + "M";
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  return n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export default function SatoshiConverter() {
  const [btc, setBtc] = useState("");
  const [sats, setSats] = useState("");
  const [fiat, setFiat] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);

  // Fetch BTC price from CoinGecko
  useEffect(() => {
    let cancelled = false;
    const ids = "bitcoin";
    const vs = currency.toLowerCase();
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs}`)
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((data) => {
        if (!cancelled && data?.bitcoin?.[vs] != null) {
          setPrice(data.bitcoin[vs]);
          setPriceError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setPriceError(true);
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false);
      });
    return () => { cancelled = true; };
  }, [currency]);

  const curSymbol = useMemo(
    () => CURRENCIES.find((c) => c.code === currency)?.symbol ?? "$",
    [currency]
  );

  // Sync conversions: whichever field the user last edited becomes the source.
  const [source, setSource] = useState<"btc" | "sats" | "fiat">("btc");

  const onBtcChange = useCallback((v: string) => {
    setBtc(v);
    setSource("btc");
    const n = parseFloat(v);
    if (n > 0) {
      setSats(String(n * SATS_PER_BTC));
      if (price) setFiat(String(n * price));
      else setFiat("");
    } else {
      setSats("");
      setFiat("");
    }
  }, [price]);

  const onSatsChange = useCallback((v: string) => {
    setSats(v);
    setSource("sats");
    const n = parseFloat(v);
    if (n > 0) {
      setBtc(String(n / SATS_PER_BTC));
      if (price) setFiat(String((n / SATS_PER_BTC) * price));
      else setFiat("");
    } else {
      setBtc("");
      setFiat("");
    }
  }, [price]);

  const onFiatChange = useCallback((v: string) => {
    setFiat(v);
    setSource("fiat");
    const n = parseFloat(v);
    if (n > 0 && price && price > 0) {
      const b = n / price;
      setBtc(String(b));
      setSats(String(b * SATS_PER_BTC));
    } else {
      setBtc("");
      setSats("");
    }
  }, [price]);

  return (
    <div>
      <div className="field">
        <label>Bitcoin price</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: ".9rem", color: "var(--muted)" }}>
            {priceLoading
              ? "Loading current price…"
              : priceError
                ? "Could not load price — conversions between fiat and BTC/sats disabled."
                : `1 BTC = ${curSymbol}${price!.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
          <select
            className="input"
            style={{ maxWidth: 100, padding: "6px 8px", fontSize: ".82rem" }}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Bitcoin (BTC)</label>
          <input
            className="input"
            type="number"
            min={0}
            step="any"
            placeholder="0.00000000"
            value={btc}
            onChange={(e) => onBtcChange(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Satoshis (sats)</label>
          <input
            className="input"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={sats}
            onChange={(e) => onSatsChange(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{curSymbol} ({currency})</label>
          <input
            className="input"
            type="number"
            min={0}
            step="any"
            placeholder="0.00"
            value={fiat}
            onChange={(e) => onFiatChange(e.target.value)}
            disabled={!price || priceError}
          />
          {priceError && <p style={{ fontSize: ".78rem", color: "var(--danger)", marginTop: 4 }}>Price unavailable — fiat conversion disabled</p>}
        </div>
      </div>

      {/* Quick reference */}
      {price && (
        <div className="stats" style={{ marginTop: 16 }}>
          <div className="stat">
            <div className="n">{curSymbol}{fmtNum(price! / SATS_PER_BTC)}</div>
            <div className="l">1 sat = {currency}</div>
          </div>
          <div className="stat">
            <div className="n">{fmtNum(SATS_PER_BTC / price!)}</div>
            <div className="l">1 {currency} = sats</div>
          </div>
          <div className="stat">
            <div className="n">{curSymbol}{fmtNum(price! * 0.01)}</div>
            <div className="l">100 sats = {currency}</div>
          </div>
          <div className="stat">
            <div className="n">{curSymbol}{fmtNum(price! * 0.1)}</div>
            <div className="l">1,000 sats = {currency}</div>
          </div>
        </div>
      )}

      <p className="privacy-note">🔒 BTC price is fetched from CoinGecko on page load. All conversions run in your browser. 1 BTC = 100,000,000 satoshis.</p>
    </div>
  );
}
