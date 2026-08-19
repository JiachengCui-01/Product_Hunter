import { fetchApi } from "./client";
import { GenerateOpportunityPayload, OpportunityReport } from "@/lib/types/opportunity";

/** GET /api/opportunities?category_id */
export function getOpportunities(
  categoryId?: number
): Promise<OpportunityReport[]> {
  return fetchApi<OpportunityReport[]>("/api/opportunities", {
    query: { category_id: categoryId },
  });
}

/** GET /api/opportunities/{id} */
export function getOpportunity(id: number | string): Promise<OpportunityReport> {
  return fetchApi<OpportunityReport>(`/api/opportunities/${id}`);
}

/** POST /api/opportunities/generate */
export function generateOpportunity(
  payload: GenerateOpportunityPayload
): Promise<OpportunityReport> {
  return fetchApi<OpportunityReport>("/api/opportunities/generate", {
    method: "POST",
    body: payload,
  });
}
