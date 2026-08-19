import { ReactNode } from "react";
import Card from "@/components/ui/Card";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}

/** A single top-line metric card used on the Dashboard's stat row. */
export default function StatCard({ label, value, hint, icon }: StatCardProps): JSX.Element {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <span className="text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </Card>
  );
}
