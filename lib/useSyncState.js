"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const LOCAL_KEY = "tripSyncState";
const DEFAULT = { checked: [], notes: {}, customStops: {}, syncedPhotos: {} };

function loadLocal() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(LOCAL_KEY)) };
  } catch {
    return { ...DEFAULT };
  }
}

function saveLocal(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {}
}

export function useSyncState() {
  const [state, setState] = useState(DEFAULT);
  const debounceRef = useRef(null);

  // Load from server on mount, fall back to localStorage
  useEffect(() => {
    const local = loadLocal();
    setState(local);

    fetch("/api/sync")
      .then((r) => r.json())
      .then((remote) => {
        if (remote && !remote.error) {
          const merged = {
            checked: [...new Set([...local.checked, ...(remote.checked || [])])],
            notes: { ...local.notes, ...(remote.notes || {}) },
            customStops: { ...local.customStops, ...(remote.customStops || {}) },
          };
          setState(merged);
          saveLocal(merged);
        }
      })
      .catch(() => {});
  }, []);

  const pushToServer = useCallback((newState) => {
    saveLocal(newState);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      }).catch(() => {});
    }, 500);
  }, []);

  const toggleChecked = useCallback((stopId) => {
    setState((prev) => {
      const isChecked = prev.checked.includes(stopId);
      const next = {
        ...prev,
        checked: isChecked
          ? prev.checked.filter((id) => id !== stopId)
          : [...prev.checked, stopId],
      };
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  const setNote = useCallback((stopId, text) => {
    setState((prev) => {
      const next = {
        ...prev,
        notes: { ...prev.notes, [stopId]: text },
      };
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  const addCustomStop = useCallback((dayIndex, name, location, totalStops) => {
    const id = `custom-${Date.now()}`;
    setState((prev) => {
      const dayStops = prev.customStops[dayIndex] || [];
      // Position at end of merged list
      const position = totalStops + dayStops.length;
      const next = {
        ...prev,
        customStops: {
          ...prev.customStops,
          [dayIndex]: [...dayStops, { id, name, location: location || "", position }],
        },
      };
      pushToServer(next);
      return next;
    });
    return id;
  }, [pushToServer]);

  const updateCustomStop = useCallback((dayIndex, stopId, fields) => {
    setState((prev) => {
      const dayStops = (prev.customStops[dayIndex] || []).map((s) =>
        s.id === stopId ? { ...s, ...fields } : s
      );
      const next = {
        ...prev,
        customStops: { ...prev.customStops, [dayIndex]: dayStops },
      };
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  const moveCustomStop = useCallback((dayIndex, stopId, direction) => {
    setState((prev) => {
      const key = Object.keys(prev.customStops).find((k) => String(k) === String(dayIndex));
      if (!key) return prev;
      const dayStops = (prev.customStops[key] || []).map((s) => {
        if (s.id !== stopId) return s;
        const newPos = Math.max(0, (s.position ?? 0) + direction);
        return { ...s, position: newPos };
      });
      const next = {
        ...prev,
        customStops: { ...prev.customStops, [key]: dayStops },
      };
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  const removeCustomStop = useCallback((dayIndex, stopId) => {
    setState((prev) => {
      const dayStops = (prev.customStops[dayIndex] || []).filter((s) => s.id !== stopId);
      const next = {
        ...prev,
        customStops: { ...prev.customStops, [dayIndex]: dayStops },
        checked: prev.checked.filter((id) => id !== stopId),
      };
      const newNotes = { ...next.notes };
      delete newNotes[stopId];
      next.notes = newNotes;
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  const addSyncedPhoto = useCallback((dayIndex, photo) => {
    setState((prev) => {
      const dayPhotos = prev.syncedPhotos?.[dayIndex] || [];
      const next = {
        ...prev,
        syncedPhotos: {
          ...prev.syncedPhotos,
          [dayIndex]: [...dayPhotos, photo],
        },
      };
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  const removeSyncedPhoto = useCallback((dayIndex, filename) => {
    setState((prev) => {
      const key = Object.keys(prev.syncedPhotos || {}).find((k) => String(k) === String(dayIndex));
      if (!key) return prev;
      const dayPhotos = (prev.syncedPhotos[key] || []).filter((p) => p.filename !== filename);
      const next = {
        ...prev,
        syncedPhotos: { ...prev.syncedPhotos, [key]: dayPhotos },
      };
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  return {
    checked: state.checked,
    notes: state.notes,
    customStops: state.customStops || {},
    syncedPhotos: state.syncedPhotos || {},
    toggleChecked,
    setNote,
    addSyncedPhoto,
    addCustomStop,
    updateCustomStop,
    moveCustomStop,
    removeCustomStop,
    removeSyncedPhoto,
  };
}
