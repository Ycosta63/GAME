"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "shelfie-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
      aria-label="Changer de thème"
      className="text-shelf-muted hover:text-shelf-text transition-colors text-sm"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
