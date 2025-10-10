// src/a11y/prefs.ts
const KEY_SCALE = 'a11y:textScale';   // número (ej. 1, 1.125, 1.25)
const KEY_HC    = 'a11y:highContrast';// "1" o "0"

export function getTextScale(): number {
  const v = localStorage.getItem(KEY_SCALE);
  const n = v ? Number(v) : 1;
  // clamp
  return isFinite(n) ? Math.min(1.6, Math.max(0.8, n)) : 1;
}
export function setTextScale(n: number) {
  const clamped = Math.min(1.6, Math.max(0.8, n));
  localStorage.setItem(KEY_SCALE, String(clamped));
  document.documentElement.style.setProperty('--ts', String(clamped));
}

export function isHighContrast(): boolean {
  return localStorage.getItem(KEY_HC) === '1';
}
export function setHighContrast(on: boolean) {
  localStorage.setItem(KEY_HC, on ? '1' : '0');
  document.documentElement.classList.toggle('hc', on);
}

/** Aplicar las preferencias al arrancar la app */
export function applyA11yFromStorage() {
  setTextScale(getTextScale());
  setHighContrast(isHighContrast());
}
