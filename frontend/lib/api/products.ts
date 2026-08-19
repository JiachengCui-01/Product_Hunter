import { fetchApi } from "./client";
import { Product, ProductSortField, SortOrder } from "@/lib/types/product";

export interface GetProductsParams {
  category_id?: number;
  sort_by?: ProductSortField;
  order?: SortOrder;
}

/** GET /api/products?category_id&sort_by&order */
export function getProducts(params: GetProductsParams = {}): Promise<Product[]> {
  return fetchApi<Product[]>("/api/products", { query: { ...params } });
}

/** GET /api/products/{id} */
export function getProduct(id: number | string): Promise<Product> {
  return fetchApi<Product>(`/api/products/${id}`);
}
