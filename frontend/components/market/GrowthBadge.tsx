import Badge, { BadgeVariant } from "@/components/ui/Badge";
import { GrowthTrend } from "@/lib/types/trend";

/** Maps a growth trend to the semantic badge color: green/gray/red. */
const GROWTH_VARIANT: Record<GrowthTrend, BadgeVariant> = {
  Increasing: "success",
  Stable: "neutral",
  Decreasing: "danger",
};

const GROWTH_ICON: Record<GrowthTrend, string> = {
  Increasing: "↑",
  Stable: "→",
  Decreasing: "↓",
};

export interface GrowthBadgeProps {
  growth: GrowthTrend;
}

export default function GrowthBadge({ growth }: GrowthBadgeProps): JSX.Element {
  return (
    <Badge variant={GROWTH_VARIANT[growth]}>
      <span aria-hidden="true">{GROWTH_ICON[growth]}</span>
      {growth}
    </Badge>
  );
}
