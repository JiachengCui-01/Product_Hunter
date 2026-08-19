import Badge from "@/components/ui/Badge";
import { formatScore } from "@/lib/utils/formatters";

export interface OpportunityScoreCellProps {
  score: number;
}

/** Renders an opportunity/demand score as a small colored badge based on band. */
export default function OpportunityScoreCell({ score }: OpportunityScoreCellProps): JSX.Element {
  const variant = score >= 70 ? "success" : score >= 40 ? "warning" : "danger";
  return <Badge variant={variant}>{formatScore(score)}</Badge>;
}
