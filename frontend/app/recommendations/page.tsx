"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/ui/Button";
import { Skeleton, SkeletonCardGrid } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import OpportunityReportCard from "@/components/recommendations/OpportunityReportCard";
import OpportunityReportDetail from "@/components/recommendations/OpportunityReportDetail";
import { getCategories } from "@/lib/api/categories";
import { generateOpportunity, getOpportunities } from "@/lib/api/opportunities";
import { ApiError } from "@/lib/api/client";
import { Category } from "@/lib/types/category";
import { OpportunityReport } from "@/lib/types/opportunity";
import { translateCategory } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** Isolated so useSearchParams() doesn't force a CSR bailout at the page level. */
function RecommendationsContent(): JSX.Element {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategoryId = searchParams.get("category_id") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(initialCategoryId);

  const [reports, setReports] = useState<OpportunityReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState<boolean>(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [generating, setGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<OpportunityReport | null>(null);

  // Load categories for the selector.
  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
        if (!selectedId && data.length > 0) setSelectedId(String(data[0].id));
      })
      .catch((err: unknown) => {
        setCategoriesError(err instanceof ApiError ? err.message : t("recommendations.categoriesErrorFallback"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadReports(categoryId: string): void {
    if (!categoryId) return;
    setReportsLoading(true);
    setReportsError(null);
    getOpportunities(Number(categoryId))
      .then((data) => {
        setReports(data);
        setSelectedReport((prev) => prev ?? data[0] ?? null);
      })
      .catch((err: unknown) => {
        setReportsError(err instanceof ApiError ? err.message : t("recommendations.reportsErrorFallback"));
      })
      .finally(() => setReportsLoading(false));
  }

  // Load past reports whenever the selected category changes.
  useEffect(() => {
    setSelectedReport(null);
    setReports([]);
    if (selectedId) loadReports(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function handleGenerate(): Promise<void> {
    if (!selectedId) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const report = await generateOpportunity({
        category_id: Number(selectedId),
        language: locale,
      });
      setReports((prev) => [report, ...prev]);
      setSelectedReport(report);
    } catch (err) {
      setGenerateError(
        err instanceof ApiError ? err.message : t("recommendations.generationFailedFallback")
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PageContainer
      heading={t("recommendations.title")}
      description={t("recommendations.description")}
      actions={
        <Button onClick={handleGenerate} loading={generating} disabled={!selectedId}>
          {t("recommendations.generateButton")}
        </Button>
      }
    >
      <div className="mb-6 max-w-xs">
        <label htmlFor="rec-category" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("recommendations.categoryLabel")}
        </label>
        <select
          id="rec-category"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {categories.length === 0 && <option value="">{t("recommendations.noCategoriesOption")}</option>}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {translateCategory(cat.name, locale)}
            </option>
          ))}
        </select>
        {categoriesError && <p className="mt-1 text-xs text-danger">{categoriesError}</p>}
      </div>

      {generateError && (
        <div className="mb-4">
          <EmptyState variant="error" title={t("recommendations.generationFailedTitle")} description={generateError} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-foreground">{t("recommendations.pastReportsHeading")}</h3>
          {reportsLoading && <SkeletonCardGrid count={2} />}
          {!reportsLoading && reportsError && (
            <EmptyState variant="error" title={t("recommendations.reportsErrorTitle")} description={reportsError} />
          )}
          {!reportsLoading && !reportsError && reports.length === 0 && (
            <EmptyState
              title={t("recommendations.noReportsTitle")}
              description={t("recommendations.noReportsDescription")}
            />
          )}
          {!reportsLoading && !reportsError && reports.length > 0 && (
            <div className="space-y-3">
              {reports.map((report) => (
                <OpportunityReportCard
                  key={report.id}
                  report={report}
                  active={selectedReport?.id === report.id}
                  onClick={setSelectedReport}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h3 className="mb-3 text-sm font-semibold text-foreground">{t("recommendations.reportDetailHeading")}</h3>
          {selectedReport ? (
            <OpportunityReportDetail report={selectedReport} />
          ) : (
            <EmptyState title={t("recommendations.noReportSelectedTitle")} description={t("recommendations.noReportSelectedDescription")} />
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function RecommendationsFallback(): JSX.Element {
  const { t } = useLanguage();
  return (
    <PageContainer heading={t("recommendations.title")}>
      <Skeleton className="h-64 w-full" />
    </PageContainer>
  );
}

export default function RecommendationsPage(): JSX.Element {
  return (
    <Suspense fallback={<RecommendationsFallback />}>
      <RecommendationsContent />
    </Suspense>
  );
}
