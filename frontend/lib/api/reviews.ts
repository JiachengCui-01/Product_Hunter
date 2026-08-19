import { fetchApi } from "./client";
import {
  GetReviewsParams,
  Review,
  SubmitReviewsPayload,
  SubmitReviewsResult,
} from "@/lib/types/review";

/** POST /api/reviews */
export function submitReviews(
  payload: SubmitReviewsPayload
): Promise<SubmitReviewsResult> {
  return fetchApi<SubmitReviewsResult>("/api/reviews", {
    method: "POST",
    body: payload,
  });
}

/** GET /api/reviews?product_id&category_id */
export function getReviews(params: GetReviewsParams = {}): Promise<Review[]> {
  return fetchApi<Review[]>("/api/reviews", { query: { ...params } });
}
