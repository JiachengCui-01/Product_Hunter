/**
 * Market trend domain types.
 */

/** The three growth states surfaced by the trend engine. */
export type GrowthTrend = "Increasing" | "Stable" | "Decreasing";

export interface MarketTrend {
  category_id: number;
  category_name: string;
  /** 0-100 composite trend score. */
  trend_score: number;
  growth: GrowthTrend;
  keywords: string[];
}
