"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { days } from "@/data/itinerary";
import Sidebar from "./Sidebar";
import TripMap from "./TripMap";
import DarkModeToggle from "./DarkModeToggle";

const typeEmoji = {
  anchor: "📌",
  food: "🍽️",
  books: "📚",
  museum: "🏛️",
  park: "🌿",
  shopping: "🛍️",
};

function getInitialState() {
  if (typeof window === "undefined") return { day: 0, stop: null };
  const params = new URLSearchParams(window.location.search);
  const dayParam = parseInt(params.get("day"), 10);
  const stopParam = parseInt(params.get("stop"), 10);
  const dayIndex = dayParam >= 1 && dayParam <= 6 ? dayParam - 1 : 0;
  const stop = stopParam && days[dayIndex]?.stops.some((s) => s.id === stopParam) ? stopParam : null;
  return { day: dayIndex, stop };
}

export default function TripApp() {
  const [selectedDay, setSelectedDay] = useState(() => getInitialState().day);
  const [selectedStop, setSelectedStop] = useState(() => getInitialState().stop);
  const [mobileView, setMobileView] = useState("list");
  const [activeFilter, setActiveFilter] = useState("all");

  const day = days[selectedDay];

  const filteredStops = useMemo(
    () =>
      activeFilter === "all"
        ? day.stops
        : day.stops.filter((s) => s.type === activeFilter),
    [day, activeFilter]
  );

  // Update URL when day or stop changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("day", String(selectedDay + 1));
    if (selectedStop) params.set("stop", String(selectedStop));
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [selectedDay, selectedStop]);

  const handleSelectStop = useCallback((stopId) => {
    setSelectedStop((prev) => (prev === stopId ? null : stopId));
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-amber-500 dark:text-amber-400">Leo&apos;s</span> NYC Trip
            </h1>
            <a
              href="/print"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              🖨️ Print / Save PDF
            </a>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            {/* Mobile toggle */}
            <button
              onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
              className="md:hidden px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {mobileView === "list" ? "🗺️ Map" : "📋 List"}
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex overflow-x-auto px-2 pb-2 gap-1 scrollbar-thin">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedDay(i);
                setSelectedStop(null);
                setActiveFilter("all");
              }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                i === selectedDay
                  ? "bg-amber-500 text-white dark:text-gray-950"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {d.label}
              <span className="hidden sm:inline text-xs ml-1 opacity-75">
                {d.date}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`w-full md:w-[420px] md:shrink-0 md:block overflow-y-auto scrollbar-thin bg-gray-50 dark:bg-[#0f172a] ${
            mobileView === "list" ? "block" : "hidden"
          }`}
        >
          <Sidebar
            day={day}
            filteredStops={filteredStops}
            selectedStop={selectedStop}
            onSelectStop={handleSelectStop}
            typeEmoji={typeEmoji}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Map */}
        <div
          className={`flex-1 md:block ${
            mobileView === "map" ? "block" : "hidden"
          }`}
        >
          <TripMap
            day={day}
            filteredStops={filteredStops}
            selectedStop={selectedStop}
            onSelectStop={handleSelectStop}
          />
        </div>
      </main>
    </div>
  );
}
