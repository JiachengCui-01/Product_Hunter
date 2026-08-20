"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import GrowthBadge from "@/components/market/GrowthBadge";
import { formatScore } from "@/lib/utils/formatters";
import { TrendingCategorySummary } from "@/lib/types/dashboard";
import { translateCategory } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface TrendingCategoriesListProps {
  categories: TrendingCategorySummary[];
}

/** Ranked list of the currently trending categories, shown on the Dashboard. */
export default function TrendingCategoriesList({
  categories,
}: TrendingCategoriesListProps): JSX.Element {
  const { t, locale } = useLanguage();

  if (categories.length === 0) {
    return (
      <EmptyState
        title={t("dashboard.trendingEmptyTitle")}
        description={t("dashboard.trendingEmptyDescription")}
      />
    );
  }

  return (
    <Card padded={false}>
      <ul className="divide-y divide-border">
        {categories.map((cat, i) => (
          <li key={cat.category_id}>
            <Link
              href={`/categories/${cat.category_id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-muted">
                  {i + 1}
                </span>
                <span className="truncate text-sm font-medium text-foreground">
                  {translateCategory(cat.name, locale)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm text-muted">
                  {t("dashboard.scoreLabel")} {formatScore(cat.trend_score)}
                </span>
                <GrowthBadge growth={cat.growth} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
