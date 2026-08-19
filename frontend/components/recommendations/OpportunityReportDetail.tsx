"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/formatters";
import { OpportunityReport } from "@/lib/types/opportunity";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface OpportunityReportDetailProps {
  report: OpportunityReport;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h4>
      {children}
    </div>
  );
}

/** Full detail view for one AI-generated opportunity report. */
export default function OpportunityReportDetail({
  report,
}: OpportunityReportDetailProps): JSX.Element {
  const { t } = useLanguage();
  return (
    <Card className="flex flex-col gap-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {report.product_name}
          </h2>
          <span className="shrink-0 text-xs text-muted">
            {t("recommendations.generatedPrefix")} {formatDate(report.created_at)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {t("recommendations.targetCustomerLabel")}{" "}
          <span className="text-foreground">{report.target_customer}</span>
        </p>
      </div>

      <Section title={t("recommendations.recommendedSolutionHeading")}>
        <p className="text-sm leading-relaxed text-foreground">{report.solution}</p>
      </Section>

      <Section title={t("recommendations.painPointsAddressedHeading")}>
        {report.pain_points.length === 0 ? (
          <p className="text-sm text-muted">{t("recommendations.noneRecorded")}</p>
        ) : (
          <ul className="list-inside list-disc space-y-1.5 text-sm text-foreground">
            {report.pain_points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("recommendations.proposedFeaturesHeading")}>
        {report.features.length === 0 ? (
          <p className="text-sm text-muted">{t("recommendations.noneRecorded")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {report.features.map((f, i) => (
              <Badge key={i} variant="info">
                {f}
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title={t("recommendations.sellingPointsHeading")}>
        {report.selling_points.length === 0 ? (
          <p className="text-sm text-muted">{t("recommendations.noneRecorded")}</p>
        ) : (
          <ul className="list-inside list-disc space-y-1.5 text-sm text-foreground">
            {report.selling_points.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </Section>
    </Card>
  );
}
