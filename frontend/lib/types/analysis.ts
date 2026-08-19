/**
 * Review analysis (NLP sentiment/pain-point extraction) domain types.
 */
export interface ReviewAnalysisResult {
  /** Short phrases/aspects users praised. */
  positive: string[];
  /** Short phrases/aspects users criticized. */
  negative: string[];
  /** More granular, specific pain points extracted from negative feedback. */
  pain_points: string[];
}

/** Payload for POST /api/analysis/reviews */
export interface AnalyzeReviewsPayload {
  reviews: { review: string }[];
}
