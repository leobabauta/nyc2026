"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { days } from "@/data/itinerary";
import { getPhotosByDay } from "@/lib/photoDB";
import Sidebar from "./Sidebar";
import TripMap from "./TripMap";
import DarkModeToggle from "./DarkModeToggle";
import { useSyncState } from "@/lib/useSyncState";

const typeEmoji = {
  anchor: "📌",
  food: "🍽️",
  books: "📚",
  museum: "🏛️",
  park: "🌿",
  shopping: "🛍️",
  flight: "✈️",
  hotel: "🏨",
  transport: "🚕",
};

function getInitialState() {
  if (typeof window === "undefined") return { day: 0, stop: null };
  const params = new URLSearchParams(window.location.search);
  const dayParam = parseInt(params.get("day"), 10);
  const stopParam = parseInt(params.get("stop"), 10);
  const dayIndex = !isNaN(dayParam) && dayParam >= 0 && dayParam < days.length ? dayParam : 1;
  const stop = stopParam && days[dayIndex]?.stops.some((s) => s.id === stopParam) ? stopParam : null;
  return { day: dayIndex, stop };
}

export default function TripApp() {
  const [selectedDay, setSelectedDay] = useState(() => getInitialState().day);
  const [selectedStop, setSelectedStop] = useState(() => getInitialState().stop);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isDark, setIsDark] = useState(true);
  const [userPhotos, setUserPhotos] = useState([]);
  const [weather, setWeather] = useState({});
  const syncState = useSyncState();
  const objectUrlsRef = useRef([]);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Fetch weather forecast once
  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((data) => {
        if (data.forecasts) {
          const map = {};
          data.forecasts.forEach((f) => { map[f.date] = f; });
          setWeather(map);
        }
      })
      .catch(() => {});
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  const day = days[selectedDay];

  const loadPhotos = useCallback(async () => {
    // Revoke old object URLs
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];

    try {
      const raw = await getPhotosByDay(selectedDay);
      const mapped = raw.map((p) => {
        const thumbSrc = p.thumbnail
          ? URL.createObjectURL(p.thumbnail)
          : URL.createObjectURL(p.blob);
        const fullSrc = URL.createObjectURL(p.blob);
        objectUrlsRef.current.push(thumbSrc, fullSrc);
        return {
          id: p.id,
          lat: p.lat,
          lng: p.lng,
          thumbSrc,
          fullSrc,
          filename: p.filename,
        };
      });
      setUserPhotos(mapped);
    } catch {
      setUserPhotos([]);
    }
  }, [selectedDay]);

  useEffect(() => {
    loadPhotos();
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [loadPhotos]);

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
    params.set("day", String(selectedDay));
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
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
            <span className="text-amber-500 dark:text-amber-400">Eva &amp; Leo&apos;s</span> NYC 2026 Trip
          </h1>
          <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
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
                  ? d.travel
                    ? "bg-slate-500 text-white"
                    : "bg-amber-500 text-white dark:text-gray-950"
                  : d.travel
                    ? "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-400 dark:hover:bg-slate-500"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {({ Sunday: "Sun", Monday: "Mon", Tuesday: "Tues", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat" })[d.date.split(" ")[0]]}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Map — top half on mobile, right panel on desktop */}
        <div className="h-[50vh] shrink-0 md:h-auto md:flex-1 md:order-2">
          <TripMap
            day={day}
            filteredStops={filteredStops}
            selectedStop={selectedStop}
            onSelectStop={handleSelectStop}
            isDark={isDark}
            userPhotos={userPhotos}
          />
        </div>

        {/* Sidebar — bottom half on mobile, left panel on desktop */}
        <div className="flex-1 md:flex-none md:w-[420px] md:order-1 overflow-y-auto scrollbar-thin bg-gray-50 dark:bg-[#0f172a]">
          <Sidebar
            day={day}
            dayIndex={selectedDay}
            filteredStops={filteredStops}
            selectedStop={selectedStop}
            onSelectStop={handleSelectStop}
            typeEmoji={typeEmoji}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            userPhotos={userPhotos}
            onPhotosAdded={loadPhotos}
            weather={weather[day.isoDate]}
            syncState={syncState}
          />
        </div>
      </main>
    </div>
  );
}
