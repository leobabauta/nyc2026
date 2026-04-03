"use client";

import { useState } from "react";
import StopCard from "./StopCard";
import PhotoUploadButton from "./PhotoUploadButton";
import UserPhotoLightbox from "./UserPhotoLightbox";
import PostcardModal from "./PostcardModal";
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
  { key: "flight", label: "Flight", color: markerColors.flight },
  { key: "hotel", label: "Hotel", color: markerColors.hotel },
  { key: "transport", label: "Transport", color: markerColors.transport },
];

export default function Sidebar({
  day,
  dayIndex,
  filteredStops,
  selectedStop,
  onSelectStop,
  typeEmoji,
  activeFilter,
  onFilterChange,
  userPhotos,
  onPhotosAdded,
  weather,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showPostcard, setShowPostcard] = useState(false);

  // Build stop id -> 1-based day index
  const dayIndexMap = {};
  day.stops.forEach((s, i) => { dayIndexMap[s.id] = i + 1; });

  return (
    <div className="p-4 space-y-4">
      {/* Day header */}
      <div>
        <h2 className="text-lg font-bold text-amber-500 dark:text-amber-400">
          {day.label} — {day.date}
        </h2>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{day.title}</p>
          {weather && (
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 ml-2">
              {weather.icon} {weather.high}°/{weather.low}°F
              {weather.precipChance > 0 && (
                <span className="text-blue-500 ml-1">💧{weather.precipChance}%</span>
              )}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
          {day.narrative}
        </p>
        {day.hotel && (
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center gap-1">
            🏨 {day.hotel}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {buildDirectionsUrl(day.stops) && (
            <a
              href={buildDirectionsUrl(day.stops)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              🧭 Route this day
            </a>
          )}
          <PhotoUploadButton dayIndex={dayIndex} onPhotosAdded={onPhotosAdded} />
          {userPhotos.length > 0 && (
            <button
              onClick={() => setShowPostcard(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-pink-700 transition-colors"
            >
              💌 Create postcard
            </button>
          )}
        </div>
      </div>

      {/* User photos strip */}
      {userPhotos.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Your photos ({userPhotos.length})
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {userPhotos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 hover:ring-2 ring-amber-400 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbSrc}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <UserPhotoLightbox
          photos={userPhotos.map((p) => ({
            src: p.fullSrc,
            filename: p.filename,
          }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {showPostcard && (
        <PostcardModal
          day={day}
          userPhotos={userPhotos}
          onClose={() => setShowPostcard(false)}
        />
      )}

      {/* Filter pills — only show types that exist in this day */}
      <div className="flex flex-wrap gap-1.5">
        {filters.filter((f) => f.key === "all" || day.stops.some((s) => s.type === f.key)).map((f) => {
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
            displayNum={dayIndexMap[stop.id]}
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

      {/* Print button at bottom */}
      <div className="pt-2 pb-4">
        <a
          href="/print"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          🖨️ Print / Save PDF
        </a>
      </div>
    </div>
  );
}
