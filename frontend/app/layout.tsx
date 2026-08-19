import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

// Inter is the closest system-adjacent font to the Notion/Linear aesthetic.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Furniture Market Insight AI",
  description:
    "Enterprise market intelligence dashboard for furniture category trends, product opportunity scoring, and AI-generated product recommendations.",
};

/**
 * Root layout: renders the persistent app shell (left Sidebar + top TopBar)
 * around every route's page content. Individual pages only need to render
 * their own body content — the chrome is handled here once.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  // `lang` starts as "en" on the server; LanguageProvider patches
  // `document.documentElement.lang` client-side once the persisted locale is
  // known, since this layout must stay a server component (it exports
  // `metadata`) and can't read the client-only locale state itself.
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex h-screen overflow-hidden bg-background font-sans text-foreground antialiased">
        <LanguageProvider>
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
