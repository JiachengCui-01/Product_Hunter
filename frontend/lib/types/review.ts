/**
 * Review domain types.
 */

/** A single raw review string submitted for ingestion/analysis. */
export interface ReviewInput {
  review: string;
}

/** Payload for POST /api/reviews */
export interface SubmitReviewsPayload {
  product_id?: number;
  category_id?: number;
  reviews: ReviewInput[];
}

/** Response for POST /api/reviews */
export interface SubmitReviewsResult {
  count: number;
  review_ids: number[];
}

/** A stored review as returned by GET /api/reviews */
export interface Review {
  id: number;
  review_text: string;
  submitted_at: string;
}

/** Query params accepted by GET /api/reviews */
export interface GetReviewsParams {
  product_id?: number;
  category_id?: number;
}
