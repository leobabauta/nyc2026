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
  onRemovePhoto,
  weather,
  syncState,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showPostcard, setShowPostcard] = useState(false);
  const [addingStop, setAddingStop] = useState(false);
  const [newStopName, setNewStopName] = useState("");
  const [newStopLocation, setNewStopLocation] = useState("");

  const addAndGeocode = (name, location) => {
    const id = syncState?.addCustomStop(dayIndex, name, location, day.stops.length);
    if (location && id) {
      fetch(`/api/geocode?address=${encodeURIComponent(location)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.lat) syncState?.updateCustomStop(dayIndex, id, { lat: d.lat, lng: d.lng });
        })
        .catch(() => {});
    }
  };

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
          <PhotoUploadButton dayIndex={dayIndex} onPhotosAdded={onPhotosAdded} syncState={syncState} />
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
              <div key={photo.id} className="shrink-0 relative">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 hover:ring-2 ring-amber-400 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbSrc}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center shadow hover:bg-red-600"
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
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

      {/* Merged stops list */}
      <div className="space-y-2">
        {(() => {
          // Build merged list: itinerary stops + custom stops interleaved by position
          const customArr = (syncState?.customStops?.[dayIndex] || []).map((cs) => ({
            ...cs, _custom: true, position: cs.position ?? filteredStops.length,
          }));
          const merged = [];
          let stopIdx = 0;
          // Insert itinerary stops and custom stops in position order
          const totalLen = filteredStops.length + customArr.length;
          const sortedCustom = [...customArr].sort((a, b) => a.position - b.position);
          let customIdx = 0;

          for (let pos = 0; pos < totalLen; pos++) {
            // Check if any custom stop belongs at this position
            while (customIdx < sortedCustom.length && sortedCustom[customIdx].position <= pos) {
              merged.push(sortedCustom[customIdx]);
              customIdx++;
              pos++;
            }
            if (stopIdx < filteredStops.length) {
              merged.push(filteredStops[stopIdx]);
              stopIdx++;
            }
          }
          // Append remaining custom stops
          while (customIdx < sortedCustom.length) {
            merged.push(sortedCustom[customIdx]);
            customIdx++;
          }

          return merged.map((item, mergedIdx) => {
            if (item._custom) {
              const cs = item;
              return (
                <div
                  key={cs.id}
                  className="w-full text-left rounded-xl p-3 transition-all border bg-white dark:bg-[#1e293b] border-dashed border-amber-300 dark:border-amber-500/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs bg-amber-400 text-white font-bold">+</span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <input type="text" value={cs.name}
                        onChange={(e) => syncState?.updateCustomStop(dayIndex, cs.id, { name: e.target.value })}
                        onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}
                        className="w-full font-semibold text-sm text-gray-900 dark:text-[#f1f5f9] bg-transparent focus:outline-none focus:border-b focus:border-amber-400"
                      />
                      <input type="text" value={cs.location || ""}
                        onChange={(e) => syncState?.updateCustomStop(dayIndex, cs.id, { location: e.target.value })}
                        onBlur={(e) => {
                          const addr = e.target.value.trim();
                          if (addr) {
                            fetch(`/api/geocode?address=${encodeURIComponent(addr)}`)
                              .then((r) => r.json())
                              .then((d) => { if (d.lat) syncState?.updateCustomStop(dayIndex, cs.id, { lat: d.lat, lng: d.lng }); })
                              .catch(() => {});
                          }
                        }}
                        onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}
                        placeholder="Location / address..."
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <textarea value={syncState?.notes?.[cs.id] || ""}
                        onChange={(e) => { syncState?.setNote(cs.id, e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                        onFocus={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                        onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}
                        placeholder="Add a note..." rows={1}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none overflow-hidden"
                      />
                      <div className="flex items-center gap-2 pt-0.5">
                        <button onClick={() => syncState?.moveCustomStop(dayIndex, cs.id, -1)}
                          className={`text-xs hover:text-gray-600 dark:hover:text-gray-200 ${mergedIdx === 0 ? "text-gray-200 dark:text-gray-700" : "text-gray-400"}`} title="Move up">▲</button>
                        <button onClick={() => syncState?.moveCustomStop(dayIndex, cs.id, 1)}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Move down">▼</button>
                        <button onClick={() => syncState?.removeCustomStop(dayIndex, cs.id)}
                          className="text-[10px] text-red-400 hover:text-red-600 ml-auto">Remove</button>
                      </div>
                    </div>
                    <button type="button" onClick={() => syncState?.toggleChecked(cs.id)}
                      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-1 ${
                        syncState?.checked?.includes(cs.id) ? "bg-green-500 border-green-500 text-white" : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                      }`}>
                      {syncState?.checked?.includes(cs.id) && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            }
            // Regular itinerary stop
            const stop = item;
            return (
              <StopCard
                key={stop.id}
                stop={stop}
                displayNum={dayIndexMap[stop.id]}
                isSelected={selectedStop === stop.id}
                onSelect={() => onSelectStop(stop.id)}
                emoji={typeEmoji[stop.type] || "📍"}
                syncState={syncState}
              />
            );
          });
        })()}

        {filteredStops.length === 0 && (syncState?.customStops?.[dayIndex] || []).length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-4 text-center">
            No stops match this filter.
          </p>
        )}

        {/* Add stop */}
        {addingStop ? (
          <div className="space-y-2 p-3 rounded-xl border border-dashed border-amber-400 bg-amber-50/50 dark:bg-amber-500/5">
            <input type="text" value={newStopName} onChange={(e) => setNewStopName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newStopName.trim()) { addAndGeocode(newStopName.trim(), newStopLocation.trim()); setNewStopName(""); setNewStopLocation(""); setAddingStop(false); } }}
              placeholder="Stop name..." autoFocus
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <input type="text" value={newStopLocation} onChange={(e) => setNewStopLocation(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newStopName.trim()) { addAndGeocode(newStopName.trim(), newStopLocation.trim()); setNewStopName(""); setNewStopLocation(""); setAddingStop(false); } }}
              placeholder="Location / address (optional)..."
              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <div className="flex gap-2">
              <button onClick={() => { if (newStopName.trim()) { addAndGeocode(newStopName.trim(), newStopLocation.trim()); setNewStopName(""); setNewStopLocation(""); } setAddingStop(false); }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium">Add</button>
              <button onClick={() => { setAddingStop(false); setNewStopName(""); setNewStopLocation(""); }}
                className="px-2 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingStop(true)}
            className="w-full py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-400 dark:text-gray-500 hover:border-amber-400 hover:text-amber-500 transition-colors">
            + Add a stop
          </button>
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
