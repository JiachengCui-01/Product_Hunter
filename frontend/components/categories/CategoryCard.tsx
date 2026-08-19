import Link from "next/link";
import Card from "@/components/ui/Card";
import CategoryKeywordChips from "@/components/categories/CategoryKeywordChips";
import { Category } from "@/lib/types/category";

export interface CategoryCardProps {
  category: Category;
}

/** Clickable card summarizing one category on the Category Explorer grid. */
export default function CategoryCard({ category }: CategoryCardProps): JSX.Element {
  return (
    <Link href={`/categories/${category.id}`} className="block h-full">
      <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-md">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {category.description}
          </p>
        </div>
        <CategoryKeywordChips keywords={category.keywords} limit={4} />
      </Card>
    </Link>
  );
}
