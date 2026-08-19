import { ReactNode } from "react";

export interface EmptyStateProps {
  /** Short headline, e.g. "No categories yet" */
  title: string;
  /** Longer explanation / next step, e.g. "Run the backend seed script." */
  description?: string;
  /** Pass `variant="error"` to tint the icon/border for fetch-error states. */
  variant?: "empty" | "error";
  action?: ReactNode;
}

/**
 * Shared placeholder for empty lists and fetch errors so every page degrades
 * gracefully instead of crashing when the backend is unreachable or has no data.
 */
export default function EmptyState({
  title,
  description,
  variant = "empty",
  action,
}: EmptyStateProps): JSX.Element {
  const isError = variant === "error";
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full ${
          isError ? "bg-danger-light text-danger" : "bg-slate-100 text-muted"
        }`}
        aria-hidden="true"
      >
        {isError ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 7h18M3 12h18M3 17h18"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      )}
      {action}
    </div>
  );
}
