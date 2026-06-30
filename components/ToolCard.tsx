import Link from "next/link";
import { getCategory, type Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  const isSoon = tool.status === "soon";
  const emoji = getCategory(tool.category)?.emoji ?? "🛠️";

  const inner = (
    <>
      <div className="card-top">
        <span className="card-icon" aria-hidden="true">{emoji}</span>
        <span className={`badge ${isSoon ? "soon-badge" : ""}`}>
          {isSoon ? "Soon" : "Live"}
        </span>
      </div>
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      {!isSoon && (
        <span className="card-go" aria-hidden="true">Open tool →</span>
      )}
    </>
  );

  if (isSoon) {
    return (
      <div className="card soon" data-cat={tool.category} style={catVar(tool.category)}>
        {inner}
      </div>
    );
  }
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="card"
      data-cat={tool.category}
      style={catVar(tool.category)}
    >
      {inner}
    </Link>
  );
}

// Map the tool's category to its accent CSS variable so the card colour-codes itself.
function catVar(category: Tool["category"]): React.CSSProperties {
  return { ["--cat" as string]: `var(--cat-${category})` };
}
