import { useState, useEffect, useCallback } from 'react';

const NOTES_STORAGE_KEY = 'system-notes';

interface SystemNotes {
  [systemId: string]: string;
}

function getStoredNotes(): SystemNotes {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveNotesToStorage(notes: SystemNotes) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export function useSystemNotes(systemId: string | null) {
  const [notes, setNotesState] = useState<string>('');
  const [, setAllNotes] = useState<SystemNotes>({});

  // Load notes on mount and when systemId changes
  useEffect(() => {
    const stored = getStoredNotes();
    setAllNotes(stored);
    if (systemId) {
      setNotesState(stored[systemId] || '');
    }
  }, [systemId]);

  const setNotes = useCallback((newNotes: string) => {
    if (!systemId) return;

    setNotesState(newNotes);
    setAllNotes((prev) => {
      const updated = { ...prev, [systemId]: newNotes };
      // Remove empty notes
      if (!newNotes.trim()) {
        delete updated[systemId];
      }
      saveNotesToStorage(updated);
      return updated;
    });
  }, [systemId]);

  const clearNotes = useCallback(() => {
    if (!systemId) return;

    setNotesState('');
    setAllNotes((prev) => {
      const updated = { ...prev };
      delete updated[systemId];
      saveNotesToStorage(updated);
      return updated;
    });
  }, [systemId]);

  return {
    notes,
    setNotes,
    clearNotes,
    hasNotes: notes.trim().length > 0,
  };
}

export function useAllSystemNotes() {
  const [allNotes, setAllNotes] = useState<SystemNotes>({});

  useEffect(() => {
    setAllNotes(getStoredNotes());
  }, []);

  return allNotes;
}
