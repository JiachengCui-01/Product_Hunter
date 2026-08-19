"use client";

import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import { Locale } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface LanguageOption {
  value: Locale;
  labelKey: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "en", labelKey: "settings.optionEnglish" },
  { value: "zh", labelKey: "settings.optionChinese" },
];

/**
 * Settings page: currently just the English / 中文 language switch, plus a
 * placeholder card so the page doesn't look unfinished. Selecting a language
 * takes effect immediately (via LanguageContext) — no separate save step.
 */
export default function SettingsPage(): JSX.Element {
  const { locale, setLocale, t } = useLanguage();

  return (
    <PageContainer heading={t("settings.title")} description={t("settings.description")}>
      <div className="space-y-6">
        <Card className="space-y-4">
          <div>
            {/* Intentionally bilingual — this label is for the language picker
                itself, so it stays legible to a user in either language. */}
            <h3 className="text-sm font-semibold text-foreground">Language / 语言</h3>
            <p className="mt-1 text-sm text-muted">{t("settings.languageSectionDescription")}</p>
          </div>

          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Language">
            {LANGUAGE_OPTIONS.map((option) => {
              const active = locale === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setLocale(option.value)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent-light text-accent"
                      : "border-border bg-white text-foreground hover:bg-slate-50"
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col items-center gap-1 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("settings.moreSettingsTitle")}
          </p>
          <p className="max-w-sm text-sm text-muted">
            {t("settings.moreSettingsDescription")}
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
