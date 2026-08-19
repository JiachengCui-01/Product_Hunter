"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CategoryKeywordChips from "@/components/categories/CategoryKeywordChips";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { getCategory } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import { Category } from "@/lib/types/category";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Category detail page: description, keyword chips, and quick-link buttons
 * into Market Analysis / Product Ranking pre-filtered to this category.
 */
export default function CategoryDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const categoryId = params?.id;
  const { t } = useLanguage();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCategory(categoryId)
      .then((data) => {
        if (!cancelled) setCategory(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : t("categoryDetail.errorFallback")
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
  }, [categoryId]);

  return (
    <PageContainer heading={category?.name ?? t("categoryDetail.heading")}>
      {loading && (
        <Card className="space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      )}

      {!loading && error && (
        <EmptyState variant="error" title={t("categoryDetail.errorTitle")} description={error} />
      )}

      {!loading && !error && !category && (
        <EmptyState
          title={t("categoryDetail.notFoundTitle")}
          description={t("categoryDetail.notFoundDescription")}
        />
      )}

      {!loading && !error && category && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">
              {category.description}
            </p>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {t("categoryDetail.keywordsHeading")}
              </h3>
              <CategoryKeywordChips keywords={category.keywords} />
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Link href={`/market-analysis?category_id=${category.id}`}>
              <Button variant="primary">{t("categoryDetail.viewMarketAnalysis")}</Button>
            </Link>
            <Link href={`/products?category_id=${category.id}`}>
              <Button variant="secondary">{t("categoryDetail.viewProductRanking")}</Button>
            </Link>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
