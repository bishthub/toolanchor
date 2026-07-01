// Crisp line icons per category — replaces emoji everywhere for a
// professional, consistent visual language. Inherits currentColor.

import type { CategoryId } from "@/lib/tools";

const PATHS: Record<CategoryId, React.ReactNode> = {
  pdf: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  media: (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m22 8.5-6 3.5 6 3.5z" />
    </>
  ),
  text: (
    <>
      <path d="M4 7V4h16v3" />
      <path d="M12 4v16" />
      <path d="M9 20h6" />
    </>
  ),
  developer: (
    <>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </>
  ),
  calculator: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6.5h8" />
      <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </>
  ),
};

export default function CategoryIcon({
  id,
  size = 18,
}: {
  id: CategoryId;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[id]}
    </svg>
  );
}
