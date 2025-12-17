// src/components/AccessibilityControls.ts
import { getTextScale, setTextScale } from '../../a11y/prefs';
import { isHighContrast, setHighContrast } from '../../a11y/prefs';
import { t, onLangChange } from '../../i18n/i18n';

export function AccessibilityControls(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'flex items-center gap-1';

  /* ---------- helper botón ---------- */
  const mkBtn = (svg: string, label: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center';
    b.innerHTML = svg;
    b.setAttribute('aria-label', label);
    b.title = label;
    return b;
  };

  /* ---------- TEXT SIZE ---------- */
  let scale = getTextScale();

const dec = mkBtn(
  `<span class="text-xs font-semibold">A</span>`,
  t('a11y.textSmaller')
);

const reset = mkBtn(
  `<span class="text-sm font-semibold">A</span>`,
  t('a11y.textReset')
);

const inc = mkBtn(
  `<span class="text-base font-semibold">A</span>`,
  t('a11y.textLarger')
);

  const applyScale = (v: number) => {
    scale = v;
    setTextScale(scale);
  };

  dec.onclick   = () => applyScale(Number((scale - 0.0625).toFixed(3)));
  reset.onclick = () => applyScale(1);
  inc.onclick   = () => applyScale(Number((scale + 0.0625).toFixed(3)));

  /* ---------- HIGH CONTRAST ---------- */
  const contrast = document.createElement('button');
  contrast.type = 'button';
  contrast.className = 'w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center';

  let high = isHighContrast();

  const updateContrastIcon = () => {
    contrast.innerHTML = high
      ? `<svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
           <path d="M12 3a9 9 0 100 18V3z"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" class="w-4 h-4 fill-current opacity-60">
           <path d="M12 3a9 9 0 100 18V3z"/>
         </svg>`;
    contrast.setAttribute('aria-pressed', high ? 'true' : 'false');
  };

  updateContrastIcon();

  contrast.onclick = () => {
    high = !high;
    setHighContrast(high);
    updateContrastIcon();
  };

  /* ---------- KEYBOARD SHORTCUTS ---------- */
  window.addEventListener('keydown', (e) => {
    if (!e.altKey || !e.shiftKey) return;

    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault(); inc.click(); break;
      case '-':
        e.preventDefault(); dec.click(); break;
      case '0':
        e.preventDefault(); reset.click(); break;
      case 'h':
      case 'H':
        e.preventDefault(); contrast.click(); break;
    }
  });

  /* ---------- I18N ---------- */
  const syncLabels = () => {
    dec.title = dec.ariaLabel = t('a11y.textSmaller');
    reset.title = reset.ariaLabel = t('a11y.textReset');
    inc.title = inc.ariaLabel = t('a11y.textLarger');
    contrast.title = contrast.ariaLabel = t('a11y.toggleHighContrast');
  };

  syncLabels();
  const off = onLangChange(syncLabels);

  wrap.append(dec, reset, inc, contrast);
  (wrap as any)._cleanup = () => off();

  return wrap;
}
