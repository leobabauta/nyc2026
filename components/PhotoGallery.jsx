"use client";

import { useState } from "react";

function photoUrl(name, maxWidth) {
  return `/api/photo?name=${encodeURIComponent(name)}&maxWidth=${maxWidth}`;
}

export default function PhotoGallery({ photos }) {
  const [index, setIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const prev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  };
  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700" style={{ aspectRatio: "16/10" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl(photos[index], 600)}
        alt=""
        className="w-full h-full object-cover"
      />

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white text-sm flex items-center justify-center hover:bg-black/70 transition-colors"
            aria-label="Next photo"
          >
            ›
          </button>
          <span className="absolute bottom-1.5 right-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
            {index + 1}/{photos.length}
          </span>
        </>
      )}
    </div>
  );
}
