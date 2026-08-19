import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/utils/formatters";
import { OpportunityReport } from "@/lib/types/opportunity";

export interface OpportunityReportCardProps {
  report: OpportunityReport;
  onClick?: (report: OpportunityReport) => void;
  active?: boolean;
}

/** Compact summary card for one AI-generated opportunity report in a list. */
export default function OpportunityReportCard({
  report,
  onClick,
  active = false,
}: OpportunityReportCardProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onClick?.(report)}
      className="block w-full text-left"
    >
      <Card
        className={`flex flex-col gap-2 transition-colors ${
          active ? "border-accent ring-1 ring-accent" : "hover:border-slate-300"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {report.product_name}
          </h3>
          <span className="shrink-0 text-xs text-muted">
            {formatDate(report.created_at)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted">{report.solution}</p>
        <p className="text-xs font-medium text-muted">
          Target: <span className="text-foreground">{report.target_customer}</span>
        </p>
      </Card>
    </button>
  );
}
