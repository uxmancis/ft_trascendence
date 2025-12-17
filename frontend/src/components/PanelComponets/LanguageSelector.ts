// src/components/LanguageSelector.ts
import { LANGS, type Lang } from '../../i18n/dictionaries';
import { getLang, setLang, onLangChange, t } from '../../i18n/i18n';

export function LanguageSelector(): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center';
  btn.type = 'button';

  let idx = Math.max(0, LANGS.findIndex(l => l.id === getLang()));

  const apply = (i: number) => {
    idx = (i + LANGS.length) % LANGS.length;
    setLang(LANGS[idx].id as Lang);
    update();
  };

  const update = () => {
    const next = LANGS[(idx + 1) % LANGS.length].label;
    btn.textContent = LANGS[idx].id.toUpperCase();
    btn.title = t('lang.change_to', { lang: next });
    btn.setAttribute('aria-label', btn.title);
  };

  btn.onclick = () => apply(idx + 1);

  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      btn.click();
    }
  });

  const off = onLangChange(() => {
    idx = Math.max(0, LANGS.findIndex(l => l.id === getLang()));
    update();
  });

  update();
  (btn as any)._cleanup = () => off();
  return btn;
}
