// src/custom/prefs.ts
const K_THEME = 'custom:theme';              // id del tema (string)
const K_TRACK = 'custom:music:track';        // índice de pista (number) o -1 (silencio)
const K_VOL   = 'custom:music:volume';       // 0..1
const K_MUTED = 'custom:music:muted';        // '1'/'0'

export type ThemeId = 'classic'|'neon'|'vapor'|'earth'|'space'|'matrix';

export function getTheme(): ThemeId {
  const v = localStorage.getItem(K_THEME) as ThemeId | null;
  return (v as ThemeId) || 'classic';
}
export function setTheme(id: ThemeId) {
  localStorage.setItem(K_THEME, id);
  document.documentElement.dataset.theme = id; // <html data-theme="...">
}

export function getTrackIndex(): number {
  const v = Number(localStorage.getItem(K_TRACK));
  return Number.isFinite(v) ? v : -1; // -1 = silencio
}
export function setTrackIndex(i: number) {
  localStorage.setItem(K_TRACK, String(i));
}

export function getVolume(): number {
  const v = Number(localStorage.getItem(K_VOL));
  if (!Number.isFinite(v)) return 0.5;
  return Math.max(0, Math.min(1, v));
}
export function setVolume(n: number) {
  const vol = Math.max(0, Math.min(1, n));
  localStorage.setItem(K_VOL, String(vol));
}

export function isMuted(): boolean {
  return localStorage.getItem(K_MUTED) === '1';
}
export function setMuted(m: boolean) {
  localStorage.setItem(K_MUTED, m ? '1' : '0');
}

/** Aplica el tema guardado al cargar la app */
export function applyThemeFromStorage() {
  setTheme(getTheme());
}
