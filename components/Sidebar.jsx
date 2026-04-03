"use client";

import StopCard from "./StopCard";
import { markerColors } from "@/data/itinerary";

function buildDirectionsUrl(stops) {
  if (stops.length < 2) return null;
  const origin = `${stops[0].lat},${stops[0].lng}`;
  const dest = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
  const middle = stops.slice(1, -1);

  let waypoints;
  if (middle.length <= 8) {
    waypoints = middle;
  } else {
    // Pick every other stop to stay within Google's 8-waypoint limit
    waypoints = middle.filter((_, i) => i % Math.ceil(middle.length / 8) === 0).slice(0, 8);
  }

  const waypointStr = waypoints.map((s) => `${s.lat},${s.lng}`).join("|");
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`;
  if (waypointStr) url += `&waypoints=${waypointStr}`;
  return url;
}

const filters = [
  { key: "all", label: "All", color: "#6b7280" },
  { key: "food", label: "Food", color: markerColors.food },
  { key: "books", label: "Books", color: markerColors.books },
  { key: "museum", label: "Museum", color: markerColors.museum },
  { key: "park", label: "Park", color: markerColors.park },
  { key: "shopping", label: "Shopping", color: markerColors.shopping },
  { key: "anchor", label: "Booked", color: markerColors.anchor },
];

export default function Sidebar({
  day,
  filteredStops,
  selectedStop,
  onSelectStop,
  typeEmoji,
  activeFilter,
  onFilterChange,
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Day header */}
      <div>
        <h2 className="text-lg font-bold text-amber-500 dark:text-amber-400">
          {day.label} — {day.date}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{day.title}</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
          {day.narrative}
        </p>
        {buildDirectionsUrl(day.stops) && (
          <a
            href={buildDirectionsUrl(day.stops)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            🧭 Route this day
          </a>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                isActive ? "" : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
              }`}
              style={
                isActive
                  ? { backgroundColor: f.color, borderColor: f.color, color: "#fff" }
                  : {}
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Stops */}
      <div className="space-y-2">
        {filteredStops.map((stop) => (
          <StopCard
            key={stop.id}
            stop={stop}
            isSelected={selectedStop === stop.id}
            onSelect={() => onSelectStop(stop.id)}
            emoji={typeEmoji[stop.type] || "📍"}
          />
        ))}
        {filteredStops.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
            No stops match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
