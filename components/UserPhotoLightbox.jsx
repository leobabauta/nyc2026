"use client";

import { useState, useEffect, useCallback } from "react";

export default function UserPhotoLightbox({ photos, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);

  const prev = useCallback(
    () => setIndex((i) => (i > 0 ? i - 1 : photos.length - 1)),
    [photos.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i < photos.length - 1 ? i + 1 : 0)),
    [photos.length]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, prev, next]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center hover:bg-black/70 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-3 z-10 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.filename || ""}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
      />

      {photos.length > 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-3 z-10 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Next photo"
        >
          ›
        </button>
      )}

      <div className="absolute bottom-6 flex flex-col items-center gap-2">
        {photos.length > 1 && (
          <div className="flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === index ? "bg-white" : "bg-white/40"
                }`}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}
        <span className="text-white/70 text-xs">
          {index + 1} / {photos.length}
        </span>
      </div>
    </div>
  );
}
