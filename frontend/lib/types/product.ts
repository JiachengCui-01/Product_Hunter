/**
 * Product domain types.
 */
export interface Product {
  id: number;
  name: string;
  category_id: number;
  price: number;
  rating: number;
  review_count: number;
  features: string[];
  /** Composite score (0-100) indicating whitespace / opportunity for a competing product. */
  opportunity_score: number;
  /** Composite score (0-100) indicating current market demand. */
  demand_score: number;
}

/** Columns that the Product Ranking table can be sorted by. */
export type ProductSortField =
  | "name"
  | "price"
  | "rating"
  | "review_count"
  | "opportunity_score"
  | "demand_score";

export type SortOrder = "asc" | "desc";
