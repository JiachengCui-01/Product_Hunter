"use client";

import { useMemo, useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import OpportunityScoreCell from "@/components/products/OpportunityScoreCell";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { Product, ProductSortField, SortOrder } from "@/lib/types/product";

export interface ProductTableProps {
  products: Product[];
}

interface ColumnDef {
  field: ProductSortField;
  label: string;
  align?: "left" | "right";
}

const COLUMNS: ColumnDef[] = [
  { field: "name", label: "Product" },
  { field: "price", label: "Price", align: "right" },
  { field: "rating", label: "Rating", align: "right" },
  { field: "review_count", label: "Reviews", align: "right" },
  { field: "demand_score", label: "Demand", align: "right" },
  { field: "opportunity_score", label: "Opportunity", align: "right" },
];

/**
 * Sortable product ranking table. Sorting is client-side over whatever the
 * server already returned (the page fetches with a default server-side sort,
 * this component lets the user re-sort by any column by clicking the header).
 */
export default function ProductTable({ products }: ProductTableProps): JSX.Element {
  const [sortField, setSortField] = useState<ProductSortField>("opportunity_score");
  const [order, setOrder] = useState<SortOrder>("desc");

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

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try a different category filter, or make sure the backend has product data seeded."
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
                {col.label}
                {sortField === col.field && (
                  <span aria-hidden="true">{order === "asc" ? "▲" : "▼"}</span>
                )}
              </span>
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {sorted.map((product) => (
          <Tr key={product.id}>
            <Td>
              <div className="font-medium text-foreground">{product.name}</div>
              {product.features.length > 0 && (
                <div className="mt-0.5 line-clamp-1 text-xs text-muted">
                  {product.features.join(" · ")}
                </div>
              )}
            </Td>
            <Td className="text-right tabular-nums">{formatCurrency(product.price)}</Td>
            <Td className="text-right tabular-nums">{product.rating.toFixed(1)}</Td>
            <Td className="text-right tabular-nums">{formatNumber(product.review_count)}</Td>
            <Td className="text-right">
              <OpportunityScoreCell score={product.demand_score} />
            </Td>
            <Td className="text-right">
              <OpportunityScoreCell score={product.opportunity_score} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
