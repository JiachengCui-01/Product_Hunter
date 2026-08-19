"use client";

import Badge, { BadgeVariant } from "@/components/ui/Badge";
import { GrowthTrend } from "@/lib/types/trend";
import { translateGrowth } from "@/lib/i18n/dictionaries";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  const { locale } = useLanguage();
  return (
    <Badge variant={GROWTH_VARIANT[growth]}>
      <span aria-hidden="true">{GROWTH_ICON[growth]}</span>
      {translateGrowth(growth, locale)}
    </Badge>
  );
}
