import Card from "@/components/ui/Card";

export interface SentimentColumnsProps {
  positive: string[];
  negative: string[];
}

function SentimentList({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}): JSX.Element {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-foreground">
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Two side-by-side columns summarizing what reviewers loved (positive[])
 * vs. what they complained about (negative[]).
 */
export default function SentimentColumns({
  positive,
  negative,
}: SentimentColumnsProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-success">
          <span aria-hidden="true">+</span> Users Love
        </h3>
        <SentimentList items={positive} emptyLabel="No standout positives detected." />
      </Card>
      <Card>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger">
          <span aria-hidden="true">−</span> Pain Points
        </h3>
        <SentimentList items={negative} emptyLabel="No notable complaints detected." />
      </Card>
    </div>
  );
}
