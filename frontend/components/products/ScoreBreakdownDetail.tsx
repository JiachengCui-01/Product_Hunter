"use client";

import { Product } from "@/lib/types/product";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface ScoreBreakdownDetailProps {
  product: Product;
}

function fmt(value: number): string {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

/**
 * Expanded row content showing one product's own score_breakdown numbers
 * substituted into the demand/opportunity formulas, e.g.
 * "0.35×84.0 + 0.40×81.0 + 0.25×76.3 = 80.9".
 */
export default function ScoreBreakdownDetail({ product }: ScoreBreakdownDetailProps): JSX.Element {
  const { t } = useLanguage();
  const b = product.score_breakdown;

  return (
    <div className="grid grid-cols-1 gap-4 py-1 text-sm sm:grid-cols-2">
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("products.scoreBreakdownDemandHeading")}
        </h4>
        <p className="font-mono text-xs text-foreground sm:text-sm">
          log10({product.review_count}+1) / log10(5001) × 100 = {fmt(b.demand_score)}
        </p>
      </div>
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("products.scoreBreakdownOpportunityHeading")}
        </h4>
        <p className="font-mono text-xs text-foreground sm:text-sm">
          {b.weights.rating}×{fmt(b.rating_norm)} + {b.weights.demand}×{fmt(b.demand_score)} + {b.weights.trend}×{fmt(b.trend_score)} = {fmt(product.opportunity_score)}
        </p>
      </div>
    </div>
  );
}
