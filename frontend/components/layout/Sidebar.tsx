"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface NavItem {
  href: string;
  labelKey: string;
  icon: JSX.Element;
}

/** Primary nav items, shown above the divider. */
const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    icon: (
      <path
        d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/categories",
    labelKey: "nav.categories",
    icon: (
      <path
        d="M4 6h16M4 12h16M4 18h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/market-analysis",
    labelKey: "nav.marketAnalysis",
    icon: (
      <path
        d="M4 20V10m6 10V4m6 16v-7m6 7V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/products",
    labelKey: "nav.productRanking",
    icon: (
      <path
        d="m4 15 4-8 4 6 3-4 5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/reviews",
    labelKey: "nav.reviewInsight",
    icon: (
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/recommendations",
    labelKey: "nav.aiRecommendation",
    icon: (
      <path
        d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4l1.4-1.4m10-10 1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

/** Secondary nav items, shown below a divider at the bottom of the nav list. */
const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: (
      <path
        d="M10.3 3.4a1.7 1.7 0 0 1 3.4 0l.1.5a1.7 1.7 0 0 0 2.5 1.1l.4-.3a1.7 1.7 0 0 1 2.4 2.4l-.3.4a1.7 1.7 0 0 0 1.1 2.5l.5.1a1.7 1.7 0 0 1 0 3.4l-.5.1a1.7 1.7 0 0 0-1.1 2.5l.3.4a1.7 1.7 0 0 1-2.4 2.4l-.4-.3a1.7 1.7 0 0 0-2.5 1.1l-.1.5a1.7 1.7 0 0 1-3.4 0l-.1-.5a1.7 1.7 0 0 0-2.5-1.1l-.4.3a1.7 1.7 0 0 1-2.4-2.4l.3-.4a1.7 1.7 0 0 0-1.1-2.5l-.5-.1a1.7 1.7 0 0 1 0-3.4l.5-.1a1.7 1.7 0 0 0 1.1-2.5l-.3-.4a1.7 1.7 0 0 1 2.4-2.4l.4.3a1.7 1.7 0 0 0 2.5-1.1l.1-.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }): JSX.Element {
  const { t } = useLanguage();
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-accent-light text-accent"
          : "text-muted hover:bg-slate-100 hover:text-foreground"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
        {item.icon}
      </svg>
      {t(item.labelKey)}
    </Link>
  );
}

/** Primary left-hand navigation for the enterprise shell. */
export default function Sidebar(): JSX.Element {
  const pathname = usePathname();
  const { t } = useLanguage();

  function isActive(href: string): boolean {
    return pathname === href || pathname?.startsWith(`${href}/`) === true;
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
          F
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {t("app.brand")}
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
        <div className="mt-2 border-t border-border pt-2">
          {SECONDARY_NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted">
        {t("app.footer")}
      </div>
    </aside>
  );
}
