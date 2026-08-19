"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface CategoryKeywordChipsProps {
  keywords: string[];
  /** Cap the number of chips rendered before truncating with a "+N" chip. */
  limit?: number;
}

/** Small pill chips for a category's keyword list. */
export default function CategoryKeywordChips({
  keywords,
  limit,
}: CategoryKeywordChipsProps): JSX.Element {
  const { t } = useLanguage();

  if (keywords.length === 0) {
    return <span className="text-xs text-muted">{t("categoryKeywordChips.none")}</span>;
  }

  const visible = limit ? keywords.slice(0, limit) : keywords;
  const remaining = limit ? keywords.length - visible.length : 0;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((kw) => (
        <span
          key={kw}
          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
        >
          {kw}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-muted">
          +{remaining}
        </span>
      )}
    </div>
  );
}
