"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { markerColors } from "@/data/itinerary";
import UserPhotoLightbox from "./UserPhotoLightbox";

let mapsLoaded = false;
let mapsLoadPromise = null;

function loadMapsApi() {
  if (mapsLoaded) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.warn("No Google Maps API key found");
      reject(new Error("No API key"));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      mapsLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

const darkStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8888aa" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e2a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2e1a" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on", color: "#1a2e1a" }] },
];

const lightStyles = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }] },
];

function createMarkerIcon(color, isSelected) {
  const size = isSelected ? 16 : 12;
  const stroke = isSelected ? 3 : 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 2 + stroke * 2}" height="${size * 2 + stroke * 2}">
    <circle cx="${size + stroke}" cy="${size + stroke}" r="${size}" fill="${color}" stroke="white" stroke-width="${stroke}" />
  </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(size * 2 + stroke * 2, size * 2 + stroke * 2),
    anchor: new google.maps.Point(size + stroke, size + stroke),
  };
}

function createCameraIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="13" fill="#ec4899" stroke="white" stroke-width="2"/>
    <text x="14" y="18" text-anchor="middle" font-size="14" fill="white">📷</text>
  </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(28, 28),
    anchor: new google.maps.Point(14, 14),
  };
}

export default function TripMap({ day, filteredStops, selectedStop, onSelectStop, isDark, userPhotos }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const photoMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [photoLightbox, setPhotoLightbox] = useState(null); // index into geoPhotos

  // Initialize map
  useEffect(() => {
    let cancelled = false;
    loadMapsApi().then(() => {
      if (cancelled || !mapRef.current) return;
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: day.center,
        zoom: day.zoom,
        styles: isDark ? darkStyles : lightStyles,
        disableDefaultUI: true,
        zoomControl: true,
      });
      infoWindowRef.current = new google.maps.InfoWindow();
      updateMarkers();
      updatePhotoMarkers();
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update map styles when dark mode changes
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setOptions({ styles: isDark ? darkStyles : lightStyles });
  }, [isDark]);

  const updateMarkers = useCallback(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const dayIndexMap = {};
    day.stops.forEach((s, i) => { dayIndexMap[s.id] = i + 1; });

    filteredStops.forEach((stop) => {
      const color = markerColors[stop.type] || "#888";
      const isSelected = selectedStop === stop.id;
      const displayNum = dayIndexMap[stop.id] || stop.id;
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: mapInstance.current,
        icon: createMarkerIcon(color, isSelected),
        title: stop.name,
        zIndex: isSelected ? 999 : 1,
        label: {
          text: String(displayNum),
          color: "white",
          fontSize: isSelected ? "12px" : "10px",
          fontWeight: "bold",
        },
      });

      marker.addListener("click", () => {
        onSelectStop(stop.id);
      });

      markersRef.current.push(marker);
    });
  }, [day, filteredStops, selectedStop, onSelectStop]);

  const geoPhotos = (userPhotos || []).filter((p) => p.lat && p.lng);

  const updatePhotoMarkers = useCallback(() => {
    if (!mapInstance.current) return;

    photoMarkersRef.current.forEach((m) => m.setMap(null));
    photoMarkersRef.current = [];

    geoPhotos.forEach((photo, idx) => {
      const marker = new google.maps.Marker({
        position: { lat: photo.lat, lng: photo.lng },
        map: mapInstance.current,
        icon: createCameraIcon(),
        title: photo.filename,
        zIndex: 0,
      });

      marker.addListener("click", () => {
        setPhotoLightbox(idx);
      });

      photoMarkersRef.current.push(marker);
    });
  }, [geoPhotos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update stop markers
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setCenter(day.center);
    mapInstance.current.setZoom(day.zoom);
    updateMarkers();
  }, [day, filteredStops, selectedStop, updateMarkers]);

  // Update photo markers
  useEffect(() => {
    if (!mapInstance.current) return;
    updatePhotoMarkers();
  }, [userPhotos, updatePhotoMarkers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show info window for selected stop
  useEffect(() => {
    if (!mapInstance.current || !infoWindowRef.current) return;

    if (!selectedStop) {
      infoWindowRef.current.close();
      return;
    }

    const stop = day.stops.find((s) => s.id === selectedStop);
    if (!stop) {
      infoWindowRef.current.close();
      return;
    }

    infoWindowRef.current.setContent(
      `<div style="color:#333;max-width:220px">
        <strong>${stop.name}</strong>
        <p style="margin:4px 0 0;font-size:13px">${stop.notes}</p>
        ${stop.time ? `<p style="margin:4px 0 0;font-size:12px;color:#b45309">⏰ ${stop.time}</p>` : ""}
      </div>`
    );
    infoWindowRef.current.setPosition({ lat: stop.lat, lng: stop.lng });
    infoWindowRef.current.open(mapInstance.current);
    mapInstance.current.panTo({ lat: stop.lat, lng: stop.lng });
  }, [selectedStop, day]);

  return (
    <>
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
      {photoLightbox !== null && geoPhotos.length > 0 && (
        <UserPhotoLightbox
          photos={geoPhotos.map((p) => ({
            src: p.fullSrc,
            filename: p.filename,
          }))}
          initialIndex={photoLightbox}
          onClose={() => setPhotoLightbox(null)}
        />
      )}
    </>
  );
}
