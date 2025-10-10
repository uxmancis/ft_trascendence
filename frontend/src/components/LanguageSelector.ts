import { LANGS, type Lang } from '../i18n/dictionaries';
import { getLang, setLang, onLangChange, t } from '../i18n/i18n';

export function LanguageSelector(compact = true): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = compact ? 'inline-flex items-center gap-2' : 'flex items-center gap-3';

  const label = document.createElement('span');
  label.className = 'hidden sm:inline text-xs opacity-80 mr-1';
  label.textContent = t('panel.lang');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-xs font-medium';
  btn.setAttribute('aria-label', 'Change language');
  wrap.append(label, btn);

  let idx = Math.max(0, LANGS.findIndex(l => l.id === getLang()));
  const apply = (i: number) => {
    idx = (i + LANGS.length) % LANGS.length;
    const lang = LANGS[idx].id as Lang;
    setLang(lang);
    btn.textContent = LANGS[idx].label;
  };

  btn.addEventListener('click', () => apply(idx + 1));

  // actualizar label si cambia idioma desde otro sitio
  const off = onLangChange(() => {
    label.textContent = t('panel.lang');
  });

  // init
  apply(idx);

  // atajo de teclado Alt+Shift+L
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      btn.click();
    }
  });

  // cleanup opcional si lo desmontas
  (wrap as any)._cleanup = () => off();

  return wrap;
}
