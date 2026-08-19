import { ReactNode } from "react";

export interface PageContainerProps {
  children: ReactNode;
  /** Optional page heading rendered above the content. */
  heading?: string;
  /** Optional supporting copy under the heading. */
  description?: string;
  /** Optional right-aligned action area next to the heading (e.g. a button). */
  actions?: ReactNode;
}

/** Consistent max-width/padding wrapper used by every page's content area. */
export default function PageContainer({
  children,
  heading,
  description,
  actions,
}: PageContainerProps): JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {(heading || actions) && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            {heading && (
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {heading}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
