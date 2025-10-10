// src/components/TextSizeButtons.ts
import { getTextScale, setTextScale } from '../a11y/prefs';

export function TextSizeButtons(compact = false): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = compact
    ? 'inline-flex items-center gap-1'
    : 'flex items-center gap-2';

  const mkBtn = (label: string, title: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-xs font-medium';
    b.setAttribute('aria-label', title);
    b.textContent = label;
    return b;
  };

  const dec = mkBtn('A-', 'Disminuir tamaño de texto');
  const reset = mkBtn('A', 'Tamaño por defecto');
  const inc = mkBtn('A+', 'Aumentar tamaño de texto');

  // aria-live para anunciar cambios (screen readers)
  const live = document.createElement('span');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');

  const announce = (scale: number) => {
    live.textContent = `Tamaño de texto ${Math.round(scale * 100)}%`;
  };

  let scale = getTextScale();
  announce(scale);

  const apply = (n: number) => {
    scale = n;
    setTextScale(scale);
    announce(scale);
  };

  dec.addEventListener('click', () => apply(Number((scale - 0.0625).toFixed(3))));
  reset.addEventListener('click', () => apply(1));
  inc.addEventListener('click', () => apply(Number((scale + 0.0625).toFixed(3))));

  // Atajos de teclado (Alt+Shift+= / Alt+Shift+- / Alt+Shift+0)
  window.addEventListener('keydown', (e) => {
    if (!e.altKey || !e.shiftKey) return;
    if (e.key === '=' || e.key === '+') { e.preventDefault(); inc.click(); }
    if (e.key === '-') { e.preventDefault(); dec.click(); }
    if (e.key === '0') { e.preventDefault(); reset.click(); }
  });

  wrap.append(dec, reset, inc, live);
  return wrap;
}
