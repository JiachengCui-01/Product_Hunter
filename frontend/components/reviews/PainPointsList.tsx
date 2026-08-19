import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export interface PainPointsListProps {
  painPoints: string[];
}

/**
 * More granular, specific pain-point breakdown (distinct from the broader
 * `negative[]` aspect list in SentimentColumns) — intended to feed directly
 * into the AI Recommendation generator.
 */
export default function PainPointsList({ painPoints }: PainPointsListProps): JSX.Element {
  if (painPoints.length === 0) {
    return (
      <EmptyState
        title="No specific pain points identified"
        description="The analysis did not surface granular pain points from the submitted reviews."
      />
    );
  }

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Specific Pain Points
      </h3>
      <ul className="space-y-2.5">
        {painPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Badge variant="danger" className="mt-0.5 shrink-0">
              {i + 1}
            </Badge>
            <span className="text-sm text-foreground">{point}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
