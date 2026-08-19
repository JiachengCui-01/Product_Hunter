import { fetchApi } from "./client";
import { Category } from "@/lib/types/category";

/** GET /api/categories */
export function getCategories(): Promise<Category[]> {
  return fetchApi<Category[]>("/api/categories");
}

/** GET /api/categories/{id} */
export function getCategory(id: number | string): Promise<Category> {
  return fetchApi<Category>(`/api/categories/${id}`);
}
