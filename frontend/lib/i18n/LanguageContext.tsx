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

  // Mirror the locale onto <html lang> for a11y/SEO. Read-only side effect —
  // deliberately does NOT persist here (see setLocale below).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Persistence happens ONLY on an explicit user change, never in an effect
  // keyed on `locale`.
  //
  // An earlier version wrote localStorage from a [locale] effect, which
  // silently broke persistence: on mount that effect fires while `locale` is
  // still the pre-hydration default ("en", required to match the server
  // render), overwriting a stored "zh" before the hydrate effect's state
  // update is committed. React 18 StrictMode's double-invoked effects then
  // made the clobber stick, because the second hydrate read the value the
  // first sync had just overwritten. Net result: choosing 中文 and reloading
  // put you back in English.
  //
  // Writing only in response to the user's action removes that whole class of
  // ordering bug - the default value is never a thing we persist.
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore write failures (e.g. storage disabled) — in-memory state still works.
    }
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
