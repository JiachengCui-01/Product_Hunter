/**
 * AI-generated product opportunity report domain types.
 */
export interface OpportunityReport {
  id: number;
  category_id: number;
  product_name: string;
  target_customer: string;
  pain_points: string[];
  solution: string;
  features: string[];
  selling_points: string[];
  created_at: string;
}

/** Payload for POST /api/opportunities/generate */
export interface GenerateOpportunityPayload {
  category_id: number;
  product_id?: number;
}
