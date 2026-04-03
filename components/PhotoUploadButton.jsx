"use client";

import { useRef, useState } from "react";
import { addPhoto } from "@/lib/photoDB";

export default function PhotoUploadButton({ dayIndex, onPhotosAdded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Dynamic import to keep bundle small for non-upload paths
      const exifr = (await import("exifr")).default;

      for (const file of files) {
        let gps = null;
        try {
          gps = await exifr.gps(file);
        } catch {
          // No GPS data — that's fine
        }
        await addPhoto(dayIndex, file, gps);
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
