"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const LOCAL_KEY = "tripSyncState";

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || { checked: [], notes: {} };
  } catch {
    return { checked: [], notes: {} };
  }
}

function saveLocal(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch {}
}

export function useSyncState() {
  const [state, setState] = useState({ checked: [], notes: {} });
  const debounceRef = useRef(null);

  // Load from server on mount, fall back to localStorage
  useEffect(() => {
    const local = loadLocal();
    setState(local);

    fetch("/api/sync")
      .then((r) => r.json())
      .then((remote) => {
        if (remote && !remote.error) {
          // Merge: union of checked, merge notes (remote wins on conflict)
          const merged = {
            checked: [...new Set([...local.checked, ...(remote.checked || [])])],
            notes: { ...local.notes, ...(remote.notes || {}) },
          };
          setState(merged);
          saveLocal(merged);
        }
      })
      .catch(() => {});
  }, []);

  const pushToServer = useCallback((newState) => {
    saveLocal(newState);
    // Debounce server writes
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

  return {
    checked: state.checked,
    notes: state.notes,
    toggleChecked,
    setNote,
  };
}
