import { fetchApi } from "./client";
import { DashboardSummary } from "@/lib/types/dashboard";

/** GET /api/dashboard/summary */
export function getDashboardSummary(): Promise<DashboardSummary> {
  return fetchApi<DashboardSummary>("/api/dashboard/summary");
}
