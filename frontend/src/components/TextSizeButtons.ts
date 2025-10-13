// src/components/TextSizeButtons.ts
import { getTextScale, setTextScale } from '../a11y/prefs';
import { t, onLangChange } from '../i18n/i18n';

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

  const dec = mkBtn('A-', t('a11y.textSmaller'));
  const reset = mkBtn('A', t('a11y.textReset'));
  const inc = mkBtn('A+', t('a11y.textLarger'));

  // aria-live para anunciar cambios (screen readers)
  const live = document.createElement('span');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');

  const announce = (scale: number) => {
    live.textContent = t('a11y.textSizeAnnounce', { pct: Math.round(scale * 100) });
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

  const off = onLangChange(() => {
    dec.setAttribute('aria-label', t('a11y.textSmaller'));
    reset.setAttribute('aria-label', t('a11y.textReset'));
    inc.setAttribute('aria-label', t('a11y.textLarger'));
    announce(scale);
  });

  wrap.append(dec, reset, inc, live);
  (wrap as any)._cleanup = () => off();
  return wrap;
}
