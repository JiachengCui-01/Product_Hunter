import type { Config } from "tailwindcss";

/**
 * Tailwind theme for the "Furniture Market Insight AI" enterprise shell.
 *
 * Palette is intentionally restrained (Notion/Linear/Apple-dashboard style):
 * neutral zinc grays for almost everything, a single indigo accent for
 * primary actions/links, and semantic success/danger/warning colors reserved
 * for score & growth badges only.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        border: "var(--border)",
        muted: "var(--muted)",
        accent: {
          DEFAULT: "#4f46e5", // indigo-600 — primary actions
          hover: "#4338ca", // indigo-700
          light: "#eef2ff", // indigo-50
        },
        success: {
          DEFAULT: "#16a34a",
          light: "#f0fdf4",
        },
        danger: {
          DEFAULT: "#dc2626",
          light: "#fef2f2",
        },
        warning: {
          DEFAULT: "#d97706",
          light: "#fffbeb",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.625rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
