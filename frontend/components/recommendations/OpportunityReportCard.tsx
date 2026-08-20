"use client";

import { KeyboardEvent } from "react";
import Card from "@/components/ui/Card";
import ExternalLinkIcon from "@/components/ui/ExternalLinkIcon";
import { formatDate } from "@/lib/utils/formatters";
import { OpportunityReport } from "@/lib/types/opportunity";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface OpportunityReportCardProps {
  report: OpportunityReport;
  onClick?: (report: OpportunityReport) => void;
  active?: boolean;
}

/** Compact summary card for one AI-generated opportunity report in a list. */
export default function OpportunityReportCard({
  report,
  onClick,
  active = false,
}: OpportunityReportCardProps): JSX.Element {
  const { t } = useLanguage();
  const [firstSource, ...restSources] = report.source_products;

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>): void {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(report);
    }
  }

  return (
    // A plain <button> can't legally contain the nested <a> in the source-product
    // hint below, so this uses a keyboard-accessible div-as-button instead.
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(report)}
      onKeyDown={handleKeyDown}
      className="block w-full cursor-pointer text-left"
    >
      <Card
        className={`flex flex-col gap-2 transition-colors ${
          active ? "border-accent ring-1 ring-accent" : "hover:border-slate-300"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {report.product_name}
          </h3>
          <span className="shrink-0 text-xs text-muted">
            {formatDate(report.created_at)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted">{report.solution}</p>
        <p className="text-xs font-medium text-muted">
          {t("recommendations.targetLabel")} <span className="text-foreground">{report.target_customer}</span>
        </p>
        {firstSource && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            {firstSource.url ? (
              <a
                href={firstSource.url}
                target="_blank"
                rel="noopener noreferrer"
                title={t("recommendations.externalLinkLabel")}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex min-w-0 items-center gap-1 truncate text-accent hover:underline"
              >
                <span className="truncate">{firstSource.name}</span>
                <ExternalLinkIcon className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="truncate">{firstSource.name}</span>
            )}
            {restSources.length > 0 && <span className="shrink-0">+{restSources.length}</span>}
          </div>
        )}
      </Card>
    </div>
  );
}
