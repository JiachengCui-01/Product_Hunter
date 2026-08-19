"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface PainPointsListProps {
  painPoints: string[];
}

/**
 * More granular, specific pain-point breakdown (distinct from the broader
 * `negative[]` aspect list in SentimentColumns) — intended to feed directly
 * into the AI Recommendation generator.
 */
export default function PainPointsList({ painPoints }: PainPointsListProps): JSX.Element {
  const { t } = useLanguage();

  if (painPoints.length === 0) {
    return (
      <EmptyState
        title={t("reviews.noPainPointsTitle")}
        description={t("reviews.noPainPointsDescription")}
      />
    );
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {t("reviews.specificPainPointsHeading")}
      </h3>
      <ul className="space-y-2.5">
        {painPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Badge variant="danger" className="mt-0.5 shrink-0">
              {i + 1}
            </Badge>
            <span className="text-sm text-foreground">{point}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
