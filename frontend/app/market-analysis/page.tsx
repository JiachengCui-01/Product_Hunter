"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import GrowthBadge from "@/components/market/GrowthBadge";
import TrendScoreGauge from "@/components/market/TrendScoreGauge";
import KeywordCloud from "@/components/market/KeywordCloud";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { getCategories } from "@/lib/api/categories";
import { getTrend } from "@/lib/api/trends";
import { ApiError } from "@/lib/api/client";
import { Category } from "@/lib/types/category";
import { MarketTrend } from "@/lib/types/trend";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Inner content component — isolated so `useSearchParams()` (which requires a
 * Suspense boundary in the Next.js App Router) doesn't force the whole route
 * to bail out of static optimization at build time.
 */
function MarketAnalysisContent(): JSX.Element {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategoryId = searchParams.get("category_id");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const [selectedId, setSelectedId] = useState<string>(initialCategoryId ?? "");
  const [trend, setTrend] = useState<MarketTrend | null>(null);
  const [trendLoading, setTrendLoading] = useState<boolean>(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  // Load the category list to populate the selector.
  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(data);
        if (!selectedId && data.length > 0) {
          setSelectedId(String(data[0].id));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCategoriesError(
            err instanceof ApiError ? err.message : t("marketAnalysis.categoriesErrorFallback")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the trend whenever the selected category changes.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setTrendLoading(true);
    setTrendError(null);

    getTrend(selectedId)
      .then((data) => {
        if (!cancelled) setTrend(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTrend(null);
          setTrendError(
            err instanceof ApiError ? err.message : t("marketAnalysis.trendErrorFallback")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <PageContainer
      heading={t("marketAnalysis.title")}
      description={t("marketAnalysis.description")}
    >
      <div className="mb-6 max-w-xs">
        <label htmlFor="category-select" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("marketAnalysis.categoryLabel")}
        </label>
        {categoriesLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : categoriesError ? (
          <EmptyState variant="error" title={t("marketAnalysis.categoriesErrorTitle")} description={categoriesError} />
        ) : categories.length === 0 ? (
          <EmptyState title={t("marketAnalysis.noCategoriesTitle")} description={t("marketAnalysis.noCategoriesDescription")} />
        ) : (
          <select
            id="category-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {trendLoading && (
        <Card className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </Card>
      )}

      {!trendLoading && trendError && (
        <EmptyState variant="error" title={t("marketAnalysis.trendErrorTitle")} description={trendError} />
      )}

      {!trendLoading && !trendError && trend && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{trend.category_name}</h3>
              <GrowthBadge growth={trend.growth} />
            </div>
            <TrendScoreGauge score={trend.trend_score} />
          </Card>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{t("marketAnalysis.topKeywordsHeading")}</h3>
            <KeywordCloud keywords={trend.keywords} />
          </Card>
        </div>
      )}

      {!trendLoading && !trendError && !trend && !categoriesLoading && categories.length > 0 && (
        <EmptyState title={t("marketAnalysis.selectCategoryTitle")} description={t("marketAnalysis.selectCategoryDescription")} />
      )}
    </PageContainer>
  );
}

function MarketAnalysisFallback(): JSX.Element {
  const { t } = useLanguage();
  return (
    <PageContainer heading={t("marketAnalysis.title")}>
      <Skeleton className="h-40 w-full" />
    </PageContainer>
  );
}

export default function MarketAnalysisPage(): JSX.Element {
  return (
    <Suspense fallback={<MarketAnalysisFallback />}>
      <MarketAnalysisContent />
    </Suspense>
  );
}
