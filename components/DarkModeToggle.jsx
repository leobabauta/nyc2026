"use client";

export default function DarkModeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="px-2 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
