import { GrowthTrend } from "./trend";

/**
 * Aggregate dashboard summary domain types.
 */
export interface TrendingCategorySummary {
  category_id: number;
  name: string;
  trend_score: number;
  growth: GrowthTrend;
}

export interface DashboardSummary {
  category_count: number;
  report_count: number;
  trending_categories: TrendingCategorySummary[];
}
