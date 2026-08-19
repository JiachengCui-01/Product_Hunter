"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface ReviewInputFormProps {
  /** Called with the parsed, non-empty review lines when the user submits. */
  onSubmit: (reviews: string[]) => void | Promise<void>;
  loading?: boolean;
}

/**
 * Textarea-based review input — one review per line. Kept simple (a single
 * textarea rather than N dynamic rows) since raw review dumps are the common
 * paste-in workflow for this MVP.
 */
export default function ReviewInputForm({
  onSubmit,
  loading = false,
}: ReviewInputFormProps): JSX.Element {
  const { t } = useLanguage();
  const [text, setText] = useState<string>("");

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (lines.length === 0) return;
    await onSubmit(lines);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="reviews" className="text-sm font-medium text-foreground">
        {t("reviews.formLabel")}
      </label>
      <textarea
        id="reviews"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("reviews.placeholder")}
        rows={8}
        className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {lines.length} {t(lines.length === 1 ? "reviews.detectedSingular" : "reviews.detectedPlural")}
        </span>
        <Button type="submit" loading={loading} disabled={lines.length === 0}>
          {t("reviews.analyzeButton")}
        </Button>
      </div>
    </form>
  );
}
