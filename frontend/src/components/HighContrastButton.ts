// src/components/HighContrastButton.ts
import { isHighContrast, setHighContrast } from '../a11y/prefs';

export function HighContrastButton(compact = false): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = compact
    ? 'px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-xs font-medium'
    : 'px-3 py-2 rounded bg-black/30 hover:bg-black/50 text-sm font-medium';

  const updateVisual = (on: boolean) => {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'Contraste: ALTO' : 'Contraste: normal';
  };

  let on = isHighContrast();
  updateVisual(on);

  btn.addEventListener('click', () => {
    on = !on;
    setHighContrast(on);
    updateVisual(on);
  });

  // Atajo teclado (Alt+Shift+H)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key.toLowerCase() === 'h')) {
      e.preventDefault();
      btn.click();
    }
  });

  btn.setAttribute('aria-label', 'Alternar alto contraste');
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  return btn;
}
