"use client";

import { formatScore } from "@/lib/utils/formatters";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface TrendScoreGaugeProps {
  score: number;
}

/** Determines the gauge fill color based on score band (visual cue, not a strict rule). */
function scoreColor(score: number): string {
  if (score >= 70) return "bg-success";
  if (score >= 40) return "bg-warning";
  return "bg-danger";
}

/** Horizontal 0-100 gauge/bar visualizing a category's trend score. */
export default function TrendScoreGauge({ score }: TrendScoreGaugeProps): JSX.Element {
  const { t } = useLanguage();
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("market.trendScoreLabel")}
        </span>
        <span className="text-3xl font-semibold tracking-tight text-foreground">
          {formatScore(clamped)}
          <span className="text-base font-normal text-muted">/100</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(clamped)}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
