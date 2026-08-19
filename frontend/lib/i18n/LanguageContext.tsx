"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Locale, dictionaries } from "@/lib/i18n/dictionaries";

const STORAGE_KEY = "furniture-insight-locale";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Looks up a static UI-chrome string for the current locale. */
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "zh";
}

/**
 * Provides the current UI language (English / Chinese) to the whole app.
 * Persists the choice to localStorage so it survives reloads, and updates
 * `<html lang>` client-side (the root layout is a server component and can't
 * react to client-only locale state, so we patch the attribute here instead).
 */
export function LanguageProvider({ children }: { children: ReactNode }): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate from localStorage once on mount (client-only — SSR has no access).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) {
        setLocaleState(stored);
      }
    } catch {
      // localStorage may be unavailable (e.g. privacy mode) — default stands.
    }
  }, []);

  // Keep <html lang> and localStorage in sync whenever the locale changes.
  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Ignore write failures (e.g. storage disabled) — in-memory state still works.
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const value = dictionaries[locale][key];
      if (value === undefined) {
        console.warn(`[i18n] Missing translation for key "${key}" (locale: ${locale})`);
        return key;
      }
      return value;
    },
    [locale]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Access the current locale, a setter, and the `t()` translation helper. */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() must be used within a <LanguageProvider>.");
  }
  return ctx;
}
