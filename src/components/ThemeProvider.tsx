"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Silently intercept rogue third-party Chrome extension errors on client without affecting SSR hydration
  useEffect(() => {
    function handleWindowError(event: ErrorEvent) {
      if (
        (event.filename && event.filename.includes("chrome-extension://")) ||
        (event.message && (
          event.message.includes("chrome: call method") ||
          event.message.includes("chrome-extension") ||
          event.message.includes("ddgilliopjknmglnpkegbjpoilgachlm")
        ))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const msg = reason && (reason.message || String(reason));
      const stack = reason && reason.stack;
      if (
        (msg && (msg.includes("chrome: call method") || msg.includes("chrome-extension") || msg.includes("ddgilliopjknmglnpkegbjpoilgachlm"))) ||
        (stack && stack.includes("chrome-extension://"))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    }

    window.addEventListener("error", handleWindowError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);

    return () => {
      window.removeEventListener("error", handleWindowError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
    };
  }, []);

  // On mount, read persisted preference
  useEffect(() => {
    const stored = localStorage.getItem("invensmart-theme") as Theme | null;
    const preferred = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
    setMounted(true);
  }, []);

  // Apply attribute whenever theme changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("invensmart-theme", theme);
  }, [theme, mounted]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
