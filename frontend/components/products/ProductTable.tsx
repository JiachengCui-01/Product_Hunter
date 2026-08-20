"use client";

import { Fragment, useMemo, useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import OpportunityScoreCell from "@/components/products/OpportunityScoreCell";
import ScoreBreakdownDetail from "@/components/products/ScoreBreakdownDetail";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { Product, ProductSortField, SortOrder } from "@/lib/types/product";
import { translateMaterial } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export interface ProductTableProps {
  products: Product[];
  /** Distinct empty state to show when filters produced zero rows. */
  emptyVariant?: "noData" | "noMatch";
}

interface ColumnDef {
  field: ProductSortField;
  labelKey: string;
  align?: "left" | "right";
}

const COLUMNS: ColumnDef[] = [
  { field: "name", labelKey: "products.columnProduct" },
  { field: "price", labelKey: "products.columnPrice", align: "right" },
  { field: "rating", labelKey: "products.columnRating", align: "right" },
  { field: "review_count", labelKey: "products.columnReviews", align: "right" },
  { field: "demand_score", labelKey: "products.columnDemand", align: "right" },
  { field: "opportunity_score", labelKey: "products.columnOpportunity", align: "right" },
];

/**
 * Sortable product ranking table. Sorting is client-side over whatever the
 * server already returned (the page fetches with a default server-side sort,
 * this component lets the user re-sort by any column by clicking the header).
 *
 * Clicking the Demand or Opportunity score of a row expands an inline detail
 * row showing that product's own score_breakdown substituted into the
 * formula, without disturbing sort state.
 */
export default function ProductTable({
  products,
  emptyVariant = "noData",
}: ProductTableProps): JSX.Element {
  const { t, locale } = useLanguage();
  const [sortField, setSortField] = useState<ProductSortField>("opportunity_score");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sorted = useMemo(() => {
    const copy = [...products];
    copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      return order === "asc" ? aNum - bNum : bNum - aNum;
    });
    return copy;
  }, [products, sortField, order]);

  function handleSort(field: ProductSortField): void {
    if (field === sortField) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setOrder("desc");
    }
  }

  function toggleExpanded(id: number): void {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={t(emptyVariant === "noMatch" ? "products.noMatchTitle" : "products.emptyTitle")}
        description={t(
          emptyVariant === "noMatch" ? "products.noMatchDescription" : "products.emptyDescription"
        )}
      />
    );
  }

  return (
    <Table>
      <Thead>
        <Tr>
          {COLUMNS.map((col) => (
            <Th
              key={col.field}
              className={`cursor-pointer select-none ${
                col.align === "right" ? "text-right" : ""
              }`}
              onClick={() => handleSort(col.field)}
            >
              <span className="inline-flex items-center gap-1">
                {t(col.labelKey)}
                {sortField === col.field && (
                  <span aria-hidden="true">{order === "asc" ? "▲" : "▼"}</span>
                )}
              </span>
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {sorted.map((product) => {
          const expanded = expandedId === product.id;
          return (
            <Fragment key={product.id}>
              <Tr>
                <Td>
                  <div className="font-medium text-foreground">{product.name}</div>
                  {product.features.length > 0 && (
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted">
                      {product.features.join(" · ")}
                    </div>
                  )}
                  {product.material.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.material.map((m) => (
                        <span
                          key={m}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {translateMaterial(m, locale)}
                        </span>
                      ))}
                    </div>
                  )}
                </Td>
                <Td className="text-right tabular-nums">{formatCurrency(product.price)}</Td>
                <Td className="text-right tabular-nums">{product.rating.toFixed(1)}</Td>
                <Td className="text-right tabular-nums">{formatNumber(product.review_count)}</Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(product.id)}
                    aria-expanded={expanded}
                    aria-controls={`score-breakdown-${product.id}`}
                    title={t("products.scoreBreakdownToggleLabel")}
                    className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <OpportunityScoreCell score={product.demand_score} />
                  </button>
                </Td>
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(product.id)}
                    aria-expanded={expanded}
                    aria-controls={`score-breakdown-${product.id}`}
                    title={t("products.scoreBreakdownToggleLabel")}
                    className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <OpportunityScoreCell score={product.opportunity_score} />
                  </button>
                </Td>
              </Tr>
              {expanded && (
                <Tr id={`score-breakdown-${product.id}`}>
                  <Td colSpan={COLUMNS.length} className="bg-slate-50/70">
                    <ScoreBreakdownDetail product={product} />
                  </Td>
                </Tr>
              )}
            </Fragment>
          );
        })}
      </Tbody>
    </Table>
  );
}
