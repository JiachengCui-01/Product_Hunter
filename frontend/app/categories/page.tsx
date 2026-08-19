"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import CategoryCard from "@/components/categories/CategoryCard";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { getCategories } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import { Category } from "@/lib/types/category";

/** Category Explorer: a grid of every tracked furniture category. */
export default function CategoriesPage(): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load categories.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer
      heading="Categories"
      description="Browse every furniture market segment tracked by the insight engine."
    >
      {loading && <SkeletonCardGrid count={6} />}

      {!loading && error && (
        <EmptyState variant="error" title="Couldn't load categories" description={error} />
      )}

      {!loading && !error && categories.length === 0 && (
        <EmptyState
          title="No categories yet"
          description="Run the backend seed script to populate furniture categories."
        />
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
