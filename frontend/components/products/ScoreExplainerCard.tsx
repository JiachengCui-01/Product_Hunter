"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const STORAGE_KEY = "furniture-insight-score-explainer-dismissed";

/**
 * Compact, dismissible explainer for how Rating / Demand / Opportunity
 * scores are calculated. Dismissal is remembered in localStorage (mirrors
 * the pattern LanguageContext uses for persisting the locale choice).
 */
export default function ScoreExplainerCard(): JSX.Element | null {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable — leave visible.
    }
  }, []);

  function handleDismiss(): void {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore write failures — dismissal just won't persist across reloads.
    }
  }

  if (dismissed) return null;

  return (
    <Card className="mb-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold text-foreground">
          {t("products.scoreExplainerTitle")}
        </h3>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("products.scoreExplainerDismiss")}
          className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-slate-100 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("products.scoreExplainerRatingHeading")}
          </h4>
          <p className="text-sm leading-relaxed text-foreground">
            {t("products.scoreExplainerRatingBody")}
          </p>
        </div>
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("products.scoreExplainerDemandHeading")}
          </h4>
          <p className="text-sm leading-relaxed text-foreground">
            {t("products.scoreExplainerDemandBody")}
          </p>
        </div>
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("products.scoreExplainerOpportunityHeading")}
          </h4>
          <p className="text-sm leading-relaxed text-foreground">
            {t("products.scoreExplainerOpportunityBody")}
          </p>
        </div>
      </div>
    </Card>
  );
}
