"use client";

import { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import ReviewInputForm from "@/components/reviews/ReviewInputForm";
import SentimentColumns from "@/components/reviews/SentimentColumns";
import PainPointsList from "@/components/reviews/PainPointsList";
import { analyzeReviews } from "@/lib/api/analysis";
import { ApiError } from "@/lib/api/client";
import { ReviewAnalysisResult } from "@/lib/types/analysis";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Review Insight page: paste raw reviews, POST them to the NLP analysis
 * endpoint, and render the resulting sentiment breakdown + pain points.
 * No fetch-on-mount here — everything is driven by the form submission.
 */
export default function ReviewsPage(): JSX.Element {
  const { t } = useLanguage();
  const [result, setResult] = useState<ReviewAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(reviews: string[]): Promise<void> {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzeReviews({
        reviews: reviews.map((review) => ({ review })),
      });
      setResult(analysis);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("reviews.analysisFailedFallback"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer
      heading={t("reviews.title")}
      description={t("reviews.description")}
    >
      <div className="space-y-6">
        <Card>
          <ReviewInputForm onSubmit={handleSubmit} loading={loading} />
        </Card>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="h-40 animate-pulse bg-slate-100">{null}</Card>
            <Card className="h-40 animate-pulse bg-slate-100">{null}</Card>
          </div>
        )}

        {!loading && error && (
          <EmptyState variant="error" title={t("reviews.analysisFailedTitle")} description={error} />
        )}

        {!loading && !error && result && (
          <div className="space-y-4">
            <SentimentColumns positive={result.positive} negative={result.negative} />
            <PainPointsList painPoints={result.pain_points} />
          </div>
        )}

        {!loading && !error && !result && (
          <EmptyState
            title={t("reviews.noAnalysisTitle")}
            description={t("reviews.noAnalysisDescription")}
          />
        )}
      </div>
    </PageContainer>
  );
}
