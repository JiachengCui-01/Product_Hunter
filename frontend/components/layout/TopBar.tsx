"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** Maps a route segment to its translation-dictionary key for the breadcrumb label. */
const SEGMENT_LABEL_KEYS: Record<string, string> = {
  dashboard: "nav.dashboard",
  categories: "nav.categories",
  "market-analysis": "nav.marketAnalysis",
  products: "nav.productRanking",
  reviews: "nav.reviewInsight",
  recommendations: "nav.aiRecommendation",
  settings: "nav.settings",
};

/**
 * Resolves a single route segment to its display label. Known static
 * segments are translated via the dictionary; a numeric segment (e.g. a
 * category id) falls back to the translated "Detail" label; anything else
 * (an unrecognized slug) is rendered as-is since it isn't translatable UI text.
 */
function resolveSegmentLabel(segment: string, t: (key: string) => string): string {
  const key = SEGMENT_LABEL_KEYS[segment];
  if (key) return t(key);
  return Number.isNaN(Number(segment)) ? segment : t("topbar.detail");
}

export interface TopBarProps {
  /** Optional override for the page title; otherwise derived from the route. */
  title?: string;
}

/** Top bar with the current page title and a simple breadcrumb trail. */
export default function TopBar({ title }: TopBarProps): JSX.Element {
  const pathname = usePathname() ?? "/dashboard";
  const { t } = useLanguage();
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "dashboard";
  const derivedTitle = resolveSegmentLabel(lastSegment, t);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-muted hover:text-foreground">
          {t("topbar.home")}
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
              {resolveSegmentLabel(seg, t)}
            </span>
          </span>
        ))}
      </div>
      <h1 className="text-sm font-semibold text-foreground">{title ?? derivedTitle}</h1>
    </header>
  );
}
