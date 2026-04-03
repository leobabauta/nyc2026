"use client";

import { useEffect, useRef, useCallback } from "react";
import { markerColors } from "@/data/itinerary";

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

export default function TripMap({ day, filteredStops, selectedStop, onSelectStop }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Initialize map
  useEffect(() => {
    let cancelled = false;
    loadMapsApi().then(() => {
      if (cancelled || !mapRef.current) return;
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: day.center,
        zoom: day.zoom,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8888aa" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e2a" }] },
          { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2e1a" }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });
      infoWindowRef.current = new google.maps.InfoWindow();
      updateMarkers();
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMarkers = useCallback(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    filteredStops.forEach((stop) => {
      const color = markerColors[stop.type] || "#888";
      const isSelected = selectedStop === stop.id;
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: mapInstance.current,
        icon: createMarkerIcon(color, isSelected),
        title: stop.name,
        zIndex: isSelected ? 999 : 1,
        label: {
          text: String(stop.id),
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

  // Update markers when day or selection changes
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.setCenter(day.center);
    mapInstance.current.setZoom(day.zoom);
    updateMarkers();
  }, [day, filteredStops, selectedStop, updateMarkers]);

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

  return <div ref={mapRef} className="w-full h-full min-h-[400px]" />;
}
