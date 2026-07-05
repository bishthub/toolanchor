import { Link } from "@/i18n/navigation";
import CategoryIcon from "@/components/CategoryIcon";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  const isSoon = tool.status === "soon";

  const inner = (
    <>
      <div className="card-top">
        <span className="card-icon">
          <CategoryIcon id={tool.category} />
        </span>
        {isSoon ? (
          <span className="badge">Soon</span>
        ) : (
          <span className="card-arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </span>
        )}
      </div>
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
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
