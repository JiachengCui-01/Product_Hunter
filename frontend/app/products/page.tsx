"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import ProductTable from "@/components/products/ProductTable";
import ProductFilters from "@/components/products/ProductFilters";
import ScoreExplainerCard from "@/components/products/ScoreExplainerCard";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { getCategories } from "@/lib/api/categories";
import { getProductFacets, getProducts } from "@/lib/api/products";
import { ApiError } from "@/lib/api/client";
import { Category } from "@/lib/types/category";
import { Product, ProductFacets } from "@/lib/types/product";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** Isolated so useSearchParams() doesn't force a CSR bailout at the page level. */
function ProductRankingContent(): JSX.Element {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string>(searchParams.get("category_id") ?? "");
  const [priceMinDraft, setPriceMinDraft] = useState<string>(searchParams.get("min_price") ?? "");
  const [priceMaxDraft, setPriceMaxDraft] = useState<string>(searchParams.get("max_price") ?? "");
  const [appliedMinPrice, setAppliedMinPrice] = useState<string>(searchParams.get("min_price") ?? "");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<string>(searchParams.get("max_price") ?? "");
  const [minRating, setMinRating] = useState<string>(searchParams.get("min_rating") ?? "");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(
    searchParams.get("material")?.split(",").filter(Boolean) ?? []
  );

  const [facets, setFacets] = useState<ProductFacets | null>(null);
  const [facetsError, setFacetsError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters =
    selectedId !== "" ||
    appliedMinPrice !== "" ||
    appliedMaxPrice !== "" ||
    minRating !== "" ||
    selectedMaterials.length > 0;

  // Populate the category filter dropdown (best-effort — table still works without it).
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err: unknown) => {
        setCategoriesError(err instanceof ApiError ? err.message : t("products.categoriesErrorFallback"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Facets (price bounds + material list) are scoped to the selected category only.
  useEffect(() => {
    let cancelled = false;
    setFacetsError(null);
    getProductFacets({ category_id: selectedId ? Number(selectedId) : undefined })
      .then((data) => {
        if (!cancelled) setFacets(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFacets(null);
          setFacetsError(err instanceof ApiError ? err.message : t("products.facetsErrorFallback"));
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Fetch products whenever any filter changes, sorted by opportunity_score desc.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const minPriceNum = appliedMinPrice !== "" ? Number(appliedMinPrice) : undefined;
    const maxPriceNum = appliedMaxPrice !== "" ? Number(appliedMaxPrice) : undefined;
    const minRatingNum = minRating !== "" ? Number(minRating) : undefined;

    getProducts({
      category_id: selectedId ? Number(selectedId) : undefined,
      min_price: minPriceNum !== undefined && !Number.isNaN(minPriceNum) ? minPriceNum : undefined,
      max_price: maxPriceNum !== undefined && !Number.isNaN(maxPriceNum) ? maxPriceNum : undefined,
      min_rating: minRatingNum !== undefined && !Number.isNaN(minRatingNum) ? minRatingNum : undefined,
      material: selectedMaterials.length > 0 ? selectedMaterials.join(",") : undefined,
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
  }, [selectedId, appliedMinPrice, appliedMaxPrice, minRating, selectedMaterials]);

  // Keep the URL query string in sync so a filtered view is shareable/refreshable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedId) params.set("category_id", selectedId);
    if (appliedMinPrice) params.set("min_price", appliedMinPrice);
    if (appliedMaxPrice) params.set("max_price", appliedMaxPrice);
    if (minRating) params.set("min_rating", minRating);
    if (selectedMaterials.length > 0) params.set("material", selectedMaterials.join(","));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, appliedMinPrice, appliedMaxPrice, minRating, selectedMaterials]);

  const commitPriceRange = useCallback(() => {
    setAppliedMinPrice(priceMinDraft);
    setAppliedMaxPrice(priceMaxDraft);
  }, [priceMinDraft, priceMaxDraft]);

  function toggleMaterial(value: string): void {
    setSelectedMaterials((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function clearFilters(): void {
    setSelectedId("");
    setPriceMinDraft("");
    setPriceMaxDraft("");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setMinRating("");
    setSelectedMaterials([]);
  }

  return (
    <PageContainer
      heading={t("products.title")}
      description={t("products.description")}
    >
      <ScoreExplainerCard />

      <ProductFilters
        categories={categories}
        categoriesError={categoriesError}
        selectedCategoryId={selectedId}
        onCategoryChange={setSelectedId}
        priceMinDraft={priceMinDraft}
        priceMaxDraft={priceMaxDraft}
        onPriceMinDraftChange={setPriceMinDraft}
        onPriceMaxDraftChange={setPriceMaxDraft}
        onCommitPriceRange={commitPriceRange}
        facets={facets}
        facetsError={facetsError}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        selectedMaterials={selectedMaterials}
        onToggleMaterial={toggleMaterial}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

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
          <ProductTable
            products={products}
            emptyVariant={hasActiveFilters ? "noMatch" : "noData"}
          />
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
