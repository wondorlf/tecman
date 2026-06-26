'use client';

import { useState, useEffect, useCallback } from 'react';

interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: number;
}

const STORAGE_KEY_PREFIX = 'tecman_filter_presets_';

export function useFilterPresets(pageKey: string) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${pageKey}`);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch {}
  }, [pageKey]);

  // Save current filters as a named preset
  const savePreset = useCallback(
    (name: string, currentFilters: Record<string, string>) => {
      const newPreset: FilterPreset = {
        id: `preset_${Date.now()}`,
        name,
        filters: { ...currentFilters },
        createdAt: Date.now(),
      };
      const updated = [...presets, newPreset];
      setPresets(updated);
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${pageKey}`, JSON.stringify(updated));
      } catch {}
      setShowSaveDialog(false);
      setPresetName('');
    },
    [presets, pageKey],
  );

  // Load a preset's filters
  const loadPreset = useCallback(
    (preset: FilterPreset, setFilters: (filters: Record<string, string>) => void) => {
      setFilters(preset.filters);
    },
    [],
  );

  // Delete a preset
  const deletePreset = useCallback(
    (presetId: string) => {
      const updated = presets.filter((p) => p.id !== presetId);
      setPresets(updated);
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${pageKey}`, JSON.stringify(updated));
      } catch {}
    },
    [presets, pageKey],
  );

  return {
    presets,
    presetName,
    setPresetName,
    showSaveDialog,
    setShowSaveDialog,
    savePreset,
    loadPreset,
    deletePreset,
  };
}
