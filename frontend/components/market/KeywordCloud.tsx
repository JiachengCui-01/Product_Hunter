"use client";

import EmptyState from "@/components/ui/EmptyState";
import { translateKeyword } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface KeywordCloudProps {
  keywords: string[];
}

/**
 * Simple keyword cloud. Order is treated as descending relevance so the
 * first keywords render slightly larger/bolder for a lightweight "cloud" feel
 * without pulling in a charting dependency.
 *
 * These keywords are mined from real Amazon titles, so in `zh` locale each
 * renders as "中文 (English)" via translateKeyword — Chinese for
 * readability, English preserved as the actual searchable marketplace term.
 */
export default function KeywordCloud({ keywords }: KeywordCloudProps): JSX.Element {
  const { t, locale } = useLanguage();

  if (keywords.length === 0) {
    return <EmptyState title={t("market.keywordCloudEmpty")} />;
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {keywords.map((kw, i) => {
        const weight = i < 3 ? "text-base font-semibold" : i < 7 ? "text-sm font-medium" : "text-xs font-normal";
        return (
          <span
            key={kw}
            className={`rounded-full bg-accent-light px-3 py-1 text-accent ${weight}`}
          >
            {translateKeyword(kw, locale)}
          </span>
        );
      })}
    </div>
  );
}
