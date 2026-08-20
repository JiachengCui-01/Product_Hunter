"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import CategoryKeywordChips from "@/components/categories/CategoryKeywordChips";
import { Category } from "@/lib/types/category";
import { translateCategory, translateCategoryDescription } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface CategoryCardProps {
  category: Category;
}

/** Clickable card summarizing one category on the Category Explorer grid. */
export default function CategoryCard({ category }: CategoryCardProps): JSX.Element {
  const { locale } = useLanguage();
  return (
    <Link href={`/categories/${category.id}`} className="block h-full">
      <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {translateCategory(category.name, locale)}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {translateCategoryDescription(category.name, locale, category.description)}
          </p>
        </div>
        <CategoryKeywordChips keywords={category.keywords} limit={4} />
      </Card>
    </Link>
  );
}
