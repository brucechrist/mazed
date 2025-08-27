import palette from '../palette.json';

export const COLOR_STORAGE_KEY = 'tagColors';
export const DEFAULT_COLORS = palette;

export async function loadPalette() {
  if (typeof window === 'undefined') {
    return DEFAULT_COLORS;
  }
  try {
    const stored = JSON.parse(localStorage.getItem(COLOR_STORAGE_KEY));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {}
  try {
    if (window.electronAPI?.readPalette) {
      const file = await window.electronAPI.readPalette();
      if (Array.isArray(file) && file.length) return file;
    }
  } catch {}
  try {
    const res = await fetch('/palette.json', { cache: 'no-store' });
    const data = await res.json();
    if (Array.isArray(data) && data.length) return data;
  } catch {}
  return DEFAULT_COLORS;
}

export function savePalette(colors) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors));
  } catch {}
  if (window.electronAPI?.writePalette) {
    window.electronAPI.writePalette(colors);
  }
  window.dispatchEvent(new Event('palette-change'));
}
