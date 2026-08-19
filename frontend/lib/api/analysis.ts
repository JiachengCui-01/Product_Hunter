import { fetchApi } from "./client";
import { AnalyzeReviewsPayload, ReviewAnalysisResult } from "@/lib/types/analysis";

/** POST /api/analysis/reviews */
export function analyzeReviews(
  payload: AnalyzeReviewsPayload
): Promise<ReviewAnalysisResult> {
  return fetchApi<ReviewAnalysisResult>("/api/analysis/reviews", {
    method: "POST",
    body: payload,
  });
}
