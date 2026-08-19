"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import ProductTable from "@/components/products/ProductTable";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { getCategories } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { Category } from "@/lib/types/category";
import { Product } from "@/lib/types/product";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** Isolated so useSearchParams() doesn't force a CSR bailout at the page level. */
function ProductRankingContent(): JSX.Element {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategoryId = searchParams.get("category_id") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string>(initialCategoryId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Populate the category filter dropdown (best-effort — table still works without it).
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err: unknown) => {
        setCategoriesError(err instanceof ApiError ? err.message : t("products.categoriesErrorFallback"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products whenever the category filter changes, sorted by opportunity_score desc.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProducts({
      category_id: selectedId ? Number(selectedId) : undefined,
      sort_by: "opportunity_score",
      order: "desc",
    })
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : t("products.errorFallback"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <PageContainer
      heading={t("products.title")}
      description={t("products.description")}
    >
      <div className="mb-6 max-w-xs">
        <label htmlFor="category-filter" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("products.filterLabel")}
        </label>
        <select
          id="category-filter"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">{t("products.allCategories")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {categoriesError && (
          <p className="mt-1 text-xs text-danger">{categoriesError}</p>
        )}
      </div>

      {loading && (
        <Card>
          <SkeletonTable rows={6} />
        </Card>
      )}

      {!loading && error && (
        <EmptyState variant="error" title={t("products.errorTitle")} description={error} />
      )}

      {!loading && !error && (
        <Card padded={false}>
          <ProductTable products={products} />
        </Card>
      )}
    </PageContainer>
  );
}

function ProductsFallback(): JSX.Element {
  const { t } = useLanguage();
  return (
    <PageContainer heading={t("products.title")}>
      <Skeleton className="h-64 w-full" />
    </PageContainer>
  );
}

export default function ProductsPage(): JSX.Element {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductRankingContent />
    </Suspense>
  );
}
