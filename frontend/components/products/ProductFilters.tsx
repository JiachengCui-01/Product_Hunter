"use client";

import { KeyboardEvent } from "react";
import Button from "@/components/ui/Button";
import { Category } from "@/lib/types/category";
import { ProductFacets } from "@/lib/types/product";
import { translateCategory, translateMaterial } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface ProductFiltersProps {
  categories: Category[];
  categoriesError: string | null;

  selectedCategoryId: string;
  onCategoryChange: (id: string) => void;

  priceMinDraft: string;
  priceMaxDraft: string;
  onPriceMinDraftChange: (value: string) => void;
  onPriceMaxDraftChange: (value: string) => void;
  onCommitPriceRange: () => void;

  facets: ProductFacets | null;
  facetsError: string | null;

  minRating: string;
  onMinRatingChange: (value: string) => void;

  selectedMaterials: string[];
  onToggleMaterial: (value: string) => void;

  hasActiveFilters: boolean;
  onClear: () => void;
}

const RATING_OPTIONS = ["3", "3.5", "4", "4.5"];

/** Filter bar for the Product Ranking page: category, price range, min rating, material. */
export default function ProductFilters({
  categories,
  categoriesError,
  selectedCategoryId,
  onCategoryChange,
  priceMinDraft,
  priceMaxDraft,
  onPriceMinDraftChange,
  onPriceMaxDraftChange,
  onCommitPriceRange,
  facets,
  facetsError,
  minRating,
  onMinRatingChange,
  selectedMaterials,
  onToggleMaterial,
  hasActiveFilters,
  onClear,
}: ProductFiltersProps): JSX.Element {
  const { t, locale } = useLanguage();

  function handlePriceKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") {
      onCommitPriceRange();
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="w-full max-w-xs sm:w-auto">
        <label htmlFor="category-filter" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("products.filterLabel")}
        </label>
        <select
          id="category-filter"
          value={selectedCategoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full min-w-[180px] rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">{t("products.allCategories")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {translateCategory(cat.name, locale)}
            </option>
          ))}
        </select>
        {categoriesError && <p className="mt-1 text-xs text-danger">{categoriesError}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {t("products.priceRangeLabel")}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={priceMinDraft}
            onChange={(e) => onPriceMinDraftChange(e.target.value)}
            onBlur={onCommitPriceRange}
            onKeyDown={handlePriceKeyDown}
            placeholder={
              facets ? facets.price_min.toFixed(0) : t("products.priceMinPlaceholder")
            }
            aria-label={t("products.priceMinPlaceholder")}
            className="w-24 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={priceMaxDraft}
            onChange={(e) => onPriceMaxDraftChange(e.target.value)}
            onBlur={onCommitPriceRange}
            onKeyDown={handlePriceKeyDown}
            placeholder={
              facets ? facets.price_max.toFixed(0) : t("products.priceMaxPlaceholder")
            }
            aria-label={t("products.priceMaxPlaceholder")}
            className="w-24 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="min-rating" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("products.minRatingLabel")}
        </label>
        <select
          id="min-rating"
          value={minRating}
          onChange={(e) => onMinRatingChange(e.target.value)}
          className="w-full min-w-[100px] rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">{t("products.minRatingAny")}</option>
          {RATING_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {Number(value).toFixed(1)}+
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          {t("products.materialLabel")}
        </span>
        {facetsError && <p className="text-xs text-danger">{facetsError}</p>}
        {!facetsError && (!facets || facets.materials.length === 0) && (
          <p className="text-xs text-muted">{t("products.materialEmpty")}</p>
        )}
        {!facetsError && facets && facets.materials.length > 0 && (
          <div className="flex max-w-md flex-wrap gap-2">
            {facets.materials.map((m) => {
              const active = selectedMaterials.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggleMaterial(m.value)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent-light text-accent"
                      : "border-border bg-white text-foreground hover:bg-slate-50"
                  }`}
                >
                  {translateMaterial(m.value, locale)} ({m.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <Button type="button" variant="secondary" onClick={onClear}>
          {t("products.clearFiltersButton")}
        </Button>
      )}
    </div>
  );
}
