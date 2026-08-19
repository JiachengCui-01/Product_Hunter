import { fetchApi } from "./client";
import { MarketTrend } from "@/lib/types/trend";

/** GET /api/trends/{category_id} */
export function getTrend(categoryId: number | string): Promise<MarketTrend> {
  return fetchApi<MarketTrend>(`/api/trends/${categoryId}`);
}
