"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Maps a route segment to a human-readable breadcrumb label. */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  categories: "Categories",
  "market-analysis": "Market Analysis",
  products: "Product Ranking",
  reviews: "Review Insight",
  recommendations: "AI Recommendation",
};

function titleFromPathname(pathname: string): { label: string; segments: string[] } {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "dashboard";
  const label = SEGMENT_LABELS[last] ?? (Number.isNaN(Number(last)) ? last : "Detail");
  return { label, segments };
}

export interface TopBarProps {
  /** Optional override for the page title; otherwise derived from the route. */
  title?: string;
}

/** Top bar with the current page title and a simple breadcrumb trail. */
export default function TopBar({ title }: TopBarProps): JSX.Element {
  const pathname = usePathname() ?? "/dashboard";
  const { label, segments } = titleFromPathname(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-muted hover:text-foreground">
          Home
        </Link>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-border">/</span>
            <span
              className={
                i === segments.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted"
              }
            >
              {SEGMENT_LABELS[seg] ?? seg}
            </span>
          </span>
        ))}
      </div>
      <h1 className="text-sm font-semibold text-foreground">{title ?? label}</h1>
    </header>
  );
}
