"use client";

// TKT-0057: two themes only -- light and dark. Dark is the default
// when no preference is stored. The choice is persisted in
// localStorage under `watify.theme`. The inline script in layout.tsx
// sets the class on <html> before React hydrates, so there is no
// flash of light theme on first paint.

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "watify.theme";

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = window.localStorage.getItem(KEY);
  return v === "light" ? "light" : "dark";
}

function apply(theme: Theme) {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(KEY, next);
    }
  }

  const label = theme === "light" ? "Light" : "Dark";
  const nextLabel = theme === "light" ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Theme: ${label}. Click to switch to ${nextLabel}.`}
      title={`Theme: ${label}. Click to switch to ${nextLabel}.`}
      className="p-2 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
    >
      {theme === "light" ? <SunIcon /> : <MoonIcon />}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
