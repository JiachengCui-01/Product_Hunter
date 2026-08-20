"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/dashboard/StatCard";
import TrendingCategoriesList from "@/components/dashboard/TrendingCategoriesList";
import { SkeletonCardGrid, Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";
import { getDashboardSummary } from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api/client";
import { DashboardSummary } from "@/lib/types/dashboard";
import { formatNumber } from "@/lib/utils/formatters";
import { translateCategory } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Dashboard landing page: three headline stat cards plus a ranked list of
 * currently trending categories, sourced from GET /api/dashboard/summary.
 */
export default function DashboardPage(): JSX.Element {
  const { t, locale } = useLanguage();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDashboardSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : t("dashboard.errorFallback")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topCategory = summary?.trending_categories?.[0];

  return (
    <PageContainer heading={t("dashboard.title")} description={t("dashboard.description")}>
      {loading && (
        <div className="space-y-6">
          <SkeletonCardGrid count={3} />
          <Card>
            <Skeleton className="h-40 w-full" />
          </Card>
        </div>
      )}

      {!loading && error && (
        <EmptyState
          variant="error"
          title={t("dashboard.errorTitle")}
          description={error}
        />
      )}

      {!loading && !error && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label={t("dashboard.statCategories")}
              value={formatNumber(summary.category_count)}
              hint={t("dashboard.statCategoriesHint")}
            />
            <StatCard
              label={t("dashboard.statReports")}
              value={formatNumber(summary.report_count)}
              hint={t("dashboard.statReportsHint")}
            />
            <StatCard
              label={t("dashboard.statTopCategory")}
              value={topCategory ? translateCategory(topCategory.name, locale) : "—"}
              hint={
                topCategory
                  ? `${t("dashboard.scoreLabel")} ${topCategory.trend_score}`
                  : t("dashboard.statTopCategoryHintNone")
              }
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {t("dashboard.trendingCategoriesHeading")}
            </h3>
            <TrendingCategoriesList categories={summary.trending_categories ?? []} />
          </div>
        </div>
      )}

      {!loading && !error && !summary && (
        <EmptyState
          title={t("dashboard.emptyTitle")}
          description={t("dashboard.emptyDescription")}
        />
      )}
    </PageContainer>
  );
}
