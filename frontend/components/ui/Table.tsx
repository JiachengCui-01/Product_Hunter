import {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

/**
 * Generic table primitives providing consistent styling for every data table
 * in the app. Compose them like plain HTML table elements:
 *
 *   <Table><Thead><Tr><Th>Name</Th></Tr></Thead><Tbody>...</Tbody></Table>
 */

export function Table({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLTableElement>): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-sm ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Thead({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return (
    <thead className={`border-b border-border bg-slate-50 ${className}`} {...rest}>
      {children}
    </thead>
  );
}

export function Tbody({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return (
    <tbody className={`divide-y divide-border ${className}`} {...rest}>
      {children}
    </tbody>
  );
}

export function Tr({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>): JSX.Element {
  return (
    <tr className={`transition-colors hover:bg-slate-50/70 ${className}`} {...rest}>
      {children}
    </tr>
  );
}

export function Th({
  className = "",
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>): JSX.Element {
  return (
    <th
      className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  className = "",
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>): JSX.Element {
  return (
    <td className={`px-4 py-3 align-middle text-foreground ${className}`} {...rest}>
      {children}
    </td>
  );
}
