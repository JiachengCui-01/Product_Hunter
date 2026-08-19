/**
 * Category domain types.
 *
 * A "Category" represents a furniture market segment (e.g. "Ergonomic Office Chairs")
 * that the backend has indexed for trend/product/review analysis.
 */
export interface Category {
  id: number;
  name: string;
  description: string;
  keywords: string[];
}
