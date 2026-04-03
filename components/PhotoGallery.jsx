"use client";

import { useState, useEffect, useCallback } from "react";

function thumbUrl(name) {
  return `/api/photo?name=${encodeURIComponent(name)}&maxWidth=200`;
}

function fullUrl(name) {
  return `/api/photo?name=${encodeURIComponent(name)}&maxWidth=1200`;
}

export default function PhotoGallery({ photos }) {
  const [lightbox, setLightbox] = useState(null); // index or null

  const open = (i) => setLightbox(i);
  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(
    () => setLightbox((i) => (i > 0 ? i - 1 : photos.length - 1)),
    [photos.length]
  );
  const next = useCallback(
    () => setLightbox((i) => (i < photos.length - 1 ? i + 1 : 0)),
    [photos.length]
  );

  // Keyboard nav + body scroll lock
  useEffect(() => {
    if (lightbox === null) return;

    document.body.style.overflow = "hidden";

    const handleKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [lightbox, close, prev, next]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      {/* Thumbnail strip */}
      <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1 scrollbar-thin">
        {photos.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open(i);
            }}
            className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 hover:ring-2 ring-amber-400 transition-all"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbUrl(name)}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 z-10 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Previous photo"
            >
              ‹
            </button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullUrl(photos[lightbox])}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 z-10 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center hover:bg-black/70 transition-colors"
              aria-label="Next photo"
            >
              ›
            </button>
          )}

          {/* Counter + dots */}
          <div className="absolute bottom-6 flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightbox(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === lightbox ? "bg-white" : "bg-white/40"
                  }`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
            <span className="text-white/70 text-xs">
              {lightbox + 1} / {photos.length}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
