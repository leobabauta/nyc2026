"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const LOCAL_KEY = "tripSyncState";
const DEFAULT = { checked: [], notes: {}, customStops: {} };

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

  const addCustomStop = useCallback((dayIndex, name) => {
    const id = `custom-${Date.now()}`;
    setState((prev) => {
      const dayStops = prev.customStops[dayIndex] || [];
      const next = {
        ...prev,
        customStops: {
          ...prev.customStops,
          [dayIndex]: [...dayStops, { id, name }],
        },
      };
      pushToServer(next);
      return next;
    });
    return id;
  }, [pushToServer]);

  const removeCustomStop = useCallback((dayIndex, stopId) => {
    setState((prev) => {
      const dayStops = (prev.customStops[dayIndex] || []).filter((s) => s.id !== stopId);
      const next = {
        ...prev,
        customStops: { ...prev.customStops, [dayIndex]: dayStops },
        checked: prev.checked.filter((id) => id !== stopId),
      };
      delete next.notes[stopId];
      pushToServer(next);
      return next;
    });
  }, [pushToServer]);

  return {
    checked: state.checked,
    notes: state.notes,
    customStops: state.customStops || {},
    toggleChecked,
    setNote,
    addCustomStop,
    removeCustomStop,
  };
}
