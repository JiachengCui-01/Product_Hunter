import { HTMLAttributes, ReactNode } from "react";

/**
 * Generic rounded-lg bordered surface used throughout the app for stat cards,
 * report cards, panels, etc. Keep this dumb/presentational — no data fetching.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Set false to remove the default internal padding (e.g. when nesting a table). */
  padded?: boolean;
}

export default function Card({
  children,
  className = "",
  padded = true,
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      className={`rounded-lg border border-border bg-surface shadow-card ${
        padded ? "p-card" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
