"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function PostcardModal({ day, userPhotos, onClose }) {
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(() =>
    userPhotos.slice(0, 4).map((p) => p.id)
  );
  const [exporting, setExporting] = useState(false);
  const postcardRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const togglePhoto = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const selectedPhotos = selected
    .map((id) => userPhotos.find((p) => p.id === id))
    .filter(Boolean);

  const exportPostcard = useCallback(async (mode) => {
    if (!postcardRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(postcardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.92));
      const file = new File([blob], `day-${day.label.split(" ")[1]}-postcard.jpg`, {
        type: "image/jpeg",
      });

      if (mode === "share" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${day.label} Postcard` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [day]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Create Postcard — {day.label}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Postcard preview */}
        <div className="overflow-x-auto">
          <div
            ref={postcardRef}
            style={{
              width: 1200,
              height: 800,
              display: "flex",
              position: "relative",
              fontFamily: "Georgia, serif",
              background: "#fff",
              border: "6px solid transparent",
              borderImage: "repeating-linear-gradient(90deg, #dc2626 0 12px, #2563eb 12px 24px, #dc2626 24px 36px) 6",
              flexShrink: 0,
            }}
          >
            {/* Left: Photo collage (60%) */}
            <div style={{ width: "60%", height: "100%", overflow: "hidden", display: "flex", flexWrap: "wrap" }}>
              {selectedPhotos.length === 0 && (
                <div style={{ width: "100%", height: "100%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 18 }}>
                  Select photos below
                </div>
              )}
              {selectedPhotos.length === 1 && (
                <img src={selectedPhotos[0].fullSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {selectedPhotos.length === 2 && selectedPhotos.map((p, i) => (
                <img key={i} src={p.fullSrc} alt="" style={{ width: "50%", height: "100%", objectFit: "cover" }} />
              ))}
              {selectedPhotos.length === 3 && (
                <>
                  <img src={selectedPhotos[0].fullSrc} alt="" style={{ width: "50%", height: "100%", objectFit: "cover" }} />
                  <div style={{ width: "50%", height: "100%", display: "flex", flexDirection: "column" }}>
                    <img src={selectedPhotos[1].fullSrc} alt="" style={{ width: "100%", height: "50%", objectFit: "cover" }} />
                    <img src={selectedPhotos[2].fullSrc} alt="" style={{ width: "100%", height: "50%", objectFit: "cover" }} />
                  </div>
                </>
              )}
              {selectedPhotos.length === 4 && selectedPhotos.map((p, i) => (
                <img key={i} src={p.fullSrc} alt="" style={{ width: "50%", height: "50%", objectFit: "cover" }} />
              ))}
            </div>

            {/* Right: Message area (40%) */}
            <div style={{
              width: "40%",
              height: "100%",
              background: "#faf7f0",
              padding: "32px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderLeft: "2px dashed #d1d5db",
            }}>
              {/* Top: POST CARD header */}
              <div>
                <div style={{
                  textAlign: "center",
                  fontSize: 14,
                  letterSpacing: 6,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #d1d5db",
                  paddingBottom: 8,
                  marginBottom: 20,
                }}>
                  Post Card
                </div>

                <div style={{ fontSize: 22, fontWeight: "bold", color: "#1f2937", marginBottom: 4 }}>
                  {day.label} — {day.date}
                </div>
                <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
                  {day.title}
                </div>

                {/* Message lines */}
                <div style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontSize: 24,
                  lineHeight: 1.6,
                  color: "#374151",
                  minHeight: 120,
                  backgroundImage: "repeating-linear-gradient(transparent, transparent 37px, #e5e7eb 37px, #e5e7eb 38px)",
                  backgroundPosition: "0 2px",
                }}>
                  {message || "Wish you were here!"}
                </div>
              </div>

              {/* Bottom: stamp */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{
                  width: 100,
                  height: 120,
                  border: "2px dashed #d1d5db",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                }}>
                  <span style={{ fontSize: 36 }}>🗽</span>
                  <span style={{ fontSize: 10, color: "#6b7280", textAlign: "center", marginTop: 4, fontWeight: "bold" }}>
                    New York<br />2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Personal message ({message.length}/150)
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 150))}
            placeholder="Wish you were here!"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Photo selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Select photos (max 4) — {selected.length} selected
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {userPhotos.map((photo) => {
              const isOn = selected.includes(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => togglePhoto(photo.id)}
                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    isOn
                      ? "border-amber-400 ring-2 ring-amber-400/50"
                      : "border-gray-200 dark:border-gray-700 opacity-50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbSrc}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => exportPostcard("download")}
            disabled={exporting || selectedPhotos.length === 0}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? "Exporting..." : "Download"}
          </button>
          <button
            onClick={() => exportPostcard("share")}
            disabled={exporting || selectedPhotos.length === 0}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
