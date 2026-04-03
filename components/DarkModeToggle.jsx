"use client";

import { useState, useEffect } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="px-2 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
