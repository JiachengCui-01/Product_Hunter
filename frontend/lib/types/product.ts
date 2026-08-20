/**
 * Product domain types.
 */

/** Per-product breakdown of how demand_score/opportunity_score were computed. */
export interface ScoreBreakdownWeights {
  rating: number;
  demand: number;
  trend: number;
}

export interface ScoreBreakdown {
  /** rating (0-5) normalized to a 0-100 scale. */
  rating_norm: number;
  /** Same value as Product.demand_score, echoed here for the formula substitution. */
  demand_score: number;
  /** The product's category trend score (0-100) at generation time. */
  trend_score: number;
  weights: ScoreBreakdownWeights;
  /** Human-readable demand formula, e.g. "log10(review_count+1)/log10(5001)*100" */
  demand_formula: string;
  /** Human-readable opportunity formula. */
  opportunity_formula: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  price: number;
  rating: number;
  review_count: number;
  features: string[];
  /** Canonical material tags (e.g. ["Wood", "Metal"]); may be empty. */
  material: string[];
  /** Amazon ASIN, or null in mock-data mode. */
  asin: string | null;
  /** Amazon product URL, or null in mock-data mode. */
  url: string | null;
  /** Composite score (0-100) indicating whitespace / opportunity for a competing product. */
  opportunity_score: number;
  /** Composite score (0-100) indicating current market demand. */
  demand_score: number;
  score_breakdown: ScoreBreakdown;
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

/** One material facet bucket: the material value plus how many products have it. */
export interface ProductFacetMaterial {
  value: string;
  count: number;
}

/** Response shape for GET /api/products/facets */
export interface ProductFacets {
  price_min: number;
  price_max: number;
  rating_min: number;
  rating_max: number;
  materials: ProductFacetMaterial[];
}
