"use client";

import { useState, useEffect, useRef } from "react";
import { markerColors } from "@/data/itinerary";
import PhotoGallery from "./PhotoGallery";

export default function StopCard({ stop, displayNum, isSelected, onSelect, emoji }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flightStatus, setFlightStatus] = useState(null);
  const cardRef = useRef(null);
  const color = markerColors[stop.type] || "#888";

  useEffect(() => {
    if (!isSelected || !stop.placeId || details) return;

    setLoading(true);
    fetch(`/api/place/${stop.placeId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setDetails(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isSelected, stop.placeId, details]);

  // Fetch flight status for flight stops (only when within 1 day of flight)
  useEffect(() => {
    if (!isSelected || !stop.flightIata || !stop.flightDate || flightStatus) return;

    const flightDay = new Date(stop.flightDate + "T00:00:00");
    const now = new Date();
    const diffMs = flightDay - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 1 || diffDays < -1) return; // only check within ±1 day

    fetch(`/api/flight?flight=${stop.flightIata}&date=${stop.flightDate}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setFlightStatus(d); })
      .catch(() => {});
  }, [isSelected, stop.flightIata, stop.flightDate, flightStatus]);

  // Auto-scroll into view when selected
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: stop.name, url });
      } catch {
        // user cancelled
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <button
      ref={cardRef}
      data-stop-id={stop.id}
      onClick={onSelect}
      className={`w-full text-left rounded-xl p-3 transition-all border ${
        isSelected
          ? "bg-amber-50 dark:bg-[#1e293b] border-amber-400 dark:border-amber-500/50 shadow-lg shadow-amber-500/5"
          : "bg-white dark:bg-[#1e293b] border-gray-200 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Number badge */}
        <span
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {displayNum}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{emoji}</span>
            <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-[#f1f5f9]">{stop.name}</h3>
            {stop.time && (
              <span className="shrink-0 text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                ⏰ {stop.time}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-[#94a3b8] mt-1 leading-relaxed">
            {stop.notes}
          </p>

          {/* Expanded details */}
          {isSelected && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#334155] space-y-1.5">
              {/* Photo at top */}
              {details?.photos?.length > 0 && (
                <PhotoGallery photos={details.photos} />
              )}

              {loading && (
                <p className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">
                  Loading details...
                </p>
              )}
              {details && (
                <>
                  {details.rating && (
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      ⭐ {details.rating} ({details.totalRatings} reviews)
                    </p>
                  )}
                  {details.openNow !== undefined && (
                    <p
                      className={`text-xs ${
                        details.openNow ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {details.openNow ? "✅ Open now" : "🚫 Closed now"}
                    </p>
                  )}
                  {details.weekdayText && (
                    <details className="text-xs text-gray-500 dark:text-gray-400">
                      <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                        Hours
                      </summary>
                      <ul className="mt-1 ml-2 space-y-0.5">
                        {details.weekdayText.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {details.website && (
                    <a
                      href={details.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline"
                    >
                      Website ↗
                    </a>
                  )}
                  {details.phone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">📞 {details.phone}</p>
                  )}
                </>
              )}
              {!loading && !details && !stop.placeId && !stop.flightIata && (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                  No details available
                </p>
              )}

              {/* Flight status */}
              {flightStatus && (
                <div className="text-xs space-y-0.5">
                  <p className={`font-medium ${
                    flightStatus.status === "landed" ? "text-green-600 dark:text-green-400" :
                    flightStatus.status === "active" ? "text-blue-600 dark:text-blue-400" :
                    flightStatus.status === "cancelled" ? "text-red-600 dark:text-red-400" :
                    flightStatus.status === "delayed" || flightStatus.departure?.delay ? "text-amber-600 dark:text-amber-400" :
                    "text-gray-500 dark:text-gray-400"
                  }`}>
                    ✈️ Status: {flightStatus.status?.charAt(0).toUpperCase() + flightStatus.status?.slice(1)}
                    {flightStatus.departure?.delay ? ` (${flightStatus.departure.delay}min delay)` : ""}
                  </p>
                  {flightStatus.departure?.gate && (
                    <p className="text-gray-500 dark:text-gray-400">Gate: {flightStatus.departure.gate}{flightStatus.departure.terminal ? ` · Terminal ${flightStatus.departure.terminal}` : ""}</p>
                  )}
                </div>
              )}
              {stop.flightIata && !flightStatus && isSelected && (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                  ✈️ Flight status available starting the day before departure
                </p>
              )}

              {/* Share / Copy link button */}
              <div className="pt-1.5 relative">
                <button
                  type="button"
                  onClick={handleShare}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                >
                  🔗 Copy link
                </button>
                {copied && (
                  <span className="absolute left-16 -top-0.5 text-xs bg-green-600 text-white px-2 py-0.5 rounded shadow">
                    Copied!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
