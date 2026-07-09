"use client";

import type { Comparison, ComparisonRow } from "@/lib/comparisons";
import { Link } from "@/i18n/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Renders a side-by-side comparison table for format/tool comparisons.
// The "best" column is highlighted with an accent background.
// ─────────────────────────────────────────────────────────────────────────────

export default function ComparisonTable({ comp }: { comp: Comparison }) {
  return (
    <div className="comparison-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th></th>
            {comp.cols.map((col, i) => (
              <th key={i} className={i === comp.cols.length - 1 && comp.cols.length > 2 ? "col-last" : ""}>
                {col.toolSlug ? (
                  <Link href={`/tools/${col.toolSlug}`} style={{ color: "var(--accent)" }}>
                    {col.label}
                  </Link>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comp.rows.map((row, i) => (
            <tr key={i}>
              <td className="attr">{row.attribute}</td>
              {renderCell(row, "a", i)}
              {renderCell(row, "b", i)}
              {row.c !== undefined && renderCell(row, "c", i)}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .comparison-wrap {
          overflow-x: auto;
          margin: 28px 0;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          box-shadow: var(--shadow-sm);
        }
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .9rem;
        }
        th, td {
          text-align: left;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        th {
          font-family: var(--font-mono), monospace;
          font-size: .73rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--muted);
          background: var(--surface-2);
        }
        th:first-child { border-radius: 0; }
        th:last-child { border-radius: 0; }
        .col-last {
          color: var(--accent);
        }
        td {
          color: var(--text);
        }
        td.attr {
          font-weight: 550;
          white-space: nowrap;
          color: var(--muted);
        }
        tr:last-child td {
          border-bottom: none;
        }
        tr.best-row td {
          background: color-mix(in srgb, var(--accent) 6%, transparent);
        }
        .best-badge {
          display: inline-block;
          font-size: .62rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          padding: 2px 8px;
          border-radius: 999px;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}

function renderCell(row: ComparisonRow, col: "a" | "b" | "c", rowIdx: number) {
  const val = row[col];
  if (!val) return <td></td>;
  const isBest = row.best === col;
  return (
    <td className={isBest ? "best-row" : ""}>
      {val}
      {isBest && <div className="best-badge">Best</div>}
    </td>
  );
}
