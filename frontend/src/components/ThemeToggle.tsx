"use client";

// TKT-0043: cycle Light -> Dark -> System -> Light. Persists in
// localStorage under `watify.theme`. Applies the `dark` class on
// <html> based on the stored preference. Initial render reads the
// inline-set class so there is no flash (the inline script in
// layout.tsx sets the class before React hydrates).

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "watify.theme";

function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

function apply(theme: Theme) {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    // While in system mode, re-apply when the OS preference flips.
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [theme]);

  function cycle() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, next);
    }
  }

  const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
      className="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
    >
      {label}
    </button>
  );
}
