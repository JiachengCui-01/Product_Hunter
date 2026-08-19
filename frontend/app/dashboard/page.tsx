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

/**
 * Dashboard landing page: three headline stat cards plus a ranked list of
 * currently trending categories, sourced from GET /api/dashboard/summary.
 */
export default function DashboardPage(): JSX.Element {
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
            err instanceof ApiError ? err.message : "Failed to load dashboard summary."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const topCategory = summary?.trending_categories?.[0];

  return (
    <PageContainer
      heading="Dashboard"
      description="High-level snapshot of tracked furniture categories and generated reports."
    >
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
          title="Couldn't load the dashboard"
          description={error}
        />
      )}

      {!loading && !error && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Tracked Categories"
              value={formatNumber(summary.category_count)}
              hint="Furniture segments monitored"
            />
            <StatCard
              label="Opportunity Reports"
              value={formatNumber(summary.report_count)}
              hint="AI-generated so far"
            />
            <StatCard
              label="Top Trending Category"
              value={topCategory ? topCategory.name : "—"}
              hint={topCategory ? `Score ${topCategory.trend_score}` : "No trend data yet"}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Trending Categories
            </h3>
            <TrendingCategoriesList categories={summary.trending_categories ?? []} />
          </div>
        </div>
      )}

      {!loading && !error && !summary && (
        <EmptyState
          title="No dashboard data yet"
          description="Run the backend seed script to populate categories and reports."
        />
      )}
    </PageContainer>
  );
}
