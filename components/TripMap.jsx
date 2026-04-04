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

function createCustomStopIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="13" fill="#f59e0b" stroke="white" stroke-width="2"/>
    <text x="14" y="19" text-anchor="middle" font-size="16" fill="white">+</text>
  </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(28, 28),
    anchor: new google.maps.Point(14, 14),
  };
}

export default function TripMap({ day, filteredStops, selectedStop, onSelectStop, isDark, userPhotos, customStops }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const customMarkersRef = useRef([]);
  const photoMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [photoLightbox, setPhotoLightbox] = useState(null); // index into geoPhotos

  // Initialize map — read theme from DOM directly to avoid race with state
  useEffect(() => {
    let cancelled = false;
    loadMapsApi().then(() => {
      if (cancelled || !mapRef.current) return;
      const dark = document.documentElement.classList.contains("dark");
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: day.center,
        zoom: day.zoom,
        styles: dark ? darkStyles : lightStyles,
        disableDefaultUI: true,
        zoomControl: true,
      });
      infoWindowRef.current = new google.maps.InfoWindow();
      updateMarkers();
      updatePhotoMarkers();
      updateCustomMarkers();
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

  const updateCustomMarkers = useCallback(() => {
    if (!mapInstance.current) return;

    customMarkersRef.current.forEach((m) => m.setMap(null));
    customMarkersRef.current = [];

    (customStops || []).filter((s) => s.lat && s.lng).forEach((cs) => {
      const marker = new google.maps.Marker({
        position: { lat: cs.lat, lng: cs.lng },
        map: mapInstance.current,
        icon: createCustomStopIcon(),
        title: cs.name,
        zIndex: 2,
      });

      marker.addListener("click", () => {
        infoWindowRef.current.setContent(
          `<div style="color:#333;max-width:220px">
            <strong>${cs.name}</strong>
            ${cs.location ? `<p style="margin:4px 0 0;font-size:12px;color:#666">📍 ${cs.location}</p>` : ""}
          </div>`
        );
        infoWindowRef.current.setPosition({ lat: cs.lat, lng: cs.lng });
        infoWindowRef.current.open(mapInstance.current);
      });

      customMarkersRef.current.push(marker);
    });
  }, [customStops]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update custom stop markers
  useEffect(() => {
    if (!mapInstance.current) return;
    updateCustomMarkers();
  }, [customStops, updateCustomMarkers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cache for place details (photo names) per placeId
  const placeCache = useRef({});

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

    const buildPhotoCarousel = (photos) => {
      if (!photos || photos.length === 0) return "";
      const urls = photos.map((n) => `/api/photo?name=${encodeURIComponent(n)}&maxWidth=400`);
      const id = "iw-carousel-" + stop.id;
      const btnStyle = "position:absolute;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.5);color:#fff;border:none;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;";
      const counterStyle = "position:absolute;bottom:6px;right:8px;font-size:10px;background:rgba(0,0,0,0.5);color:#fff;padding:1px 6px;border-radius:4px;";
      return `
        <div id="${id}" style="position:relative;width:100%;border-radius:8px;overflow:hidden;aspect-ratio:16/10;background:#e5e7eb">
          <img id="${id}-img" src="${urls[0]}" style="width:100%;height:100%;object-fit:cover" alt="" />
          ${photos.length > 1 ? `
            <button onclick="(function(){var d=document.getElementById('${id}');var c=+(d.dataset.idx||0);c=(c-1+${urls.length})%${urls.length};d.dataset.idx=c;document.getElementById('${id}-img').src=${JSON.stringify(urls)}[c];document.getElementById('${id}-ctr').textContent=(c+1)+'/${urls.length}'})()" style="${btnStyle}left:6px" aria-label="Previous">‹</button>
            <button onclick="(function(){var d=document.getElementById('${id}');var c=+(d.dataset.idx||0);c=(c+1)%${urls.length};d.dataset.idx=c;document.getElementById('${id}-img').src=${JSON.stringify(urls)}[c];document.getElementById('${id}-ctr').textContent=(c+1)+'/${urls.length}'})()" style="${btnStyle}right:6px" aria-label="Next">›</button>
            <span id="${id}-ctr" style="${counterStyle}">1/${urls.length}</span>
          ` : ""}
        </div>`;
    };

    const showInfoWindow = (photos = []) => {
      infoWindowRef.current.setContent(
        `<div style="color:#333;max-width:260px">
          ${buildPhotoCarousel(photos)}
          <div style="padding:${photos.length ? '8px 4px 4px' : '0'}">
            <strong>${stop.name}</strong>
            <p style="margin:4px 0 0;font-size:13px">${stop.notes}</p>
            ${stop.time ? `<p style="margin:4px 0 0;font-size:12px;color:#b45309">⏰ ${stop.time}</p>` : ""}
          </div>
        </div>`
      );
      infoWindowRef.current.setPosition({ lat: stop.lat, lng: stop.lng });
      infoWindowRef.current.open(mapInstance.current);
      mapInstance.current.panTo({ lat: stop.lat, lng: stop.lng });
    };

    if (stop.placeId && placeCache.current[stop.placeId]) {
      showInfoWindow(placeCache.current[stop.placeId]);
    } else if (stop.placeId) {
      showInfoWindow();
      fetch(`/api/place/${stop.placeId}`)
        .then((r) => r.json())
        .then((d) => {
          const photos = d.photos || [];
          placeCache.current[stop.placeId] = photos;
          if (photos.length > 0) showInfoWindow(photos);
        })
        .catch(() => {});
    } else {
      showInfoWindow();
    }
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
