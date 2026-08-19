"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Primary left-hand navigation for the enterprise shell. */
const NAV_ITEMS: { href: string; label: string; icon: JSX.Element }[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
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
    label: "Categories",
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
    label: "Market Analysis",
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
    label: "Product Ranking",
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
    label: "Review Insight",
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
    label: "AI Recommendation",
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

export default function Sidebar(): JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
          F
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Furniture Insight AI
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-light text-accent"
                  : "text-muted hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted">
        Furniture Market Insight AI · MVP
      </div>
    </aside>
  );
}
