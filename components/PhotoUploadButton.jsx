"use client";

import { useRef, useState } from "react";
import { addPhoto } from "@/lib/photoDB";

export default function PhotoUploadButton({ dayIndex, onPhotosAdded, syncState }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const exifr = (await import("exifr")).default;

      for (const file of files) {
        let gps = null;
        try {
          gps = await exifr.gps(file);
        } catch {
          // No GPS data
        }

        // Save to local IndexedDB
        await addPhoto(dayIndex, file, gps);

        // Upload to Vercel Blob for syncing
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("dayIndex", String(dayIndex));
          if (gps?.latitude) formData.append("lat", String(gps.latitude));
          if (gps?.longitude) formData.append("lng", String(gps.longitude));

          const res = await fetch("/api/photos", { method: "POST", body: formData });
          const data = await res.json();
          if (data.url) {
            syncState?.addSyncedPhoto(dayIndex, {
              url: data.url,
              lat: data.lat,
              lng: data.lng,
              filename: data.filename,
              timestamp: Date.now(),
            });
          }
        } catch {
          // Blob upload failed — local copy still works
        }
      }
      onPhotosAdded();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
      <span>{uploading ? "Uploading..." : "📷 Add photos"}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
        disabled={uploading}
      />
    </label>
  );
}
