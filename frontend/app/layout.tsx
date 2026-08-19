import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

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
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex h-screen overflow-hidden bg-background font-sans text-foreground antialiased">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
