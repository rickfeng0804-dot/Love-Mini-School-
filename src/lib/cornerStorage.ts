import { CornerAreaDef } from '../types';
import { CORNER_AREAS } from '../data/initialData';

const STORAGE_KEY = 'kindergarten_corner_areas';

/**
 * Retrieves the currently saved corner areas and items from LocalStorage,
 * or falls back to the default 8 corner areas.
 */
export function getStoredCornerAreas(): CornerAreaDef[] {
  if (typeof window === 'undefined') return CORNER_AREAS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading corner areas from storage:', e);
  }
  return CORNER_AREAS;
}

/**
 * Saves corner areas definition to LocalStorage.
 */
export function saveStoredCornerAreas(areas: CornerAreaDef[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(areas));
  } catch (e) {
    console.error('Error saving corner areas to storage:', e);
  }
}

/**
 * Resets corner areas to default 8 areas from initialData.ts.
 */
export function resetStoredCornerAreas(): CornerAreaDef[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error resetting corner areas in storage:', e);
    }
  }
  return CORNER_AREAS;
}
