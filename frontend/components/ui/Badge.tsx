import { ReactNode } from "react";

export type BadgeVariant = "success" | "neutral" | "danger" | "info" | "warning";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Colored pill used for growth/status/score semantics.
 * success = green (e.g. Increasing), neutral = gray (e.g. Stable),
 * danger = red (e.g. Decreasing), info = indigo (generic accent), warning = amber.
 */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-success-light text-success ring-1 ring-inset ring-success/20",
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10",
  danger: "bg-danger-light text-danger ring-1 ring-inset ring-danger/20",
  info: "bg-accent-light text-accent ring-1 ring-inset ring-accent/20",
  warning: "bg-warning-light text-warning ring-1 ring-inset ring-warning/20",
};

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: BadgeProps): JSX.Element {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
