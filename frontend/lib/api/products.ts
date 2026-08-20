import { fetchApi } from "./client";
import { Product, ProductFacets, ProductSortField, SortOrder } from "@/lib/types/product";

export interface GetProductsParams {
  category_id?: number;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  /** Comma-separated material values, e.g. "Wood,Metal" */
  material?: string;
  sort_by?: ProductSortField;
  order?: SortOrder;
  skip?: number;
  limit?: number;
}

/** GET /api/products?category_id&min_price&max_price&min_rating&material&sort_by&order&skip&limit */
export function getProducts(params: GetProductsParams = {}): Promise<Product[]> {
  return fetchApi<Product[]>("/api/products", { query: { ...params } });
}

/** GET /api/products/{id} */
export function getProduct(id: number | string): Promise<Product> {
  return fetchApi<Product>(`/api/products/${id}`);
}

export interface GetProductFacetsParams {
  category_id?: number;
}

/** GET /api/products/facets?category_id */
export function getProductFacets(
  params: GetProductFacetsParams = {}
): Promise<ProductFacets> {
  return fetchApi<ProductFacets>("/api/products/facets", { query: { ...params } });
}
