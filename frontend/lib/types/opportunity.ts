/**
 * AI-generated product opportunity report domain types.
 */

/** Language the report's AI-generated text was produced in. */
export type ReportLanguage = "en" | "zh";

/** One real Amazon listing that informed the generated report. */
export interface SourceProduct {
  /** Raw Amazon product title — verbatim, never translated. */
  name: string;
  /** Amazon product URL, or null in mock-data mode. */
  url: string | null;
  /** Amazon ASIN, or null in mock-data mode. */
  asin: string | null;
}

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
  /** Language this report's AI-generated text was produced in. */
  language: ReportLanguage;
  /** Real Amazon listings that informed this report; may be empty. */
  source_products: SourceProduct[];
}

/** Payload for POST /api/opportunities/generate */
export interface GenerateOpportunityPayload {
  category_id: number;
  product_id?: number | null;
  /** Language for the backend to generate the report text in. */
  language?: ReportLanguage;
}
