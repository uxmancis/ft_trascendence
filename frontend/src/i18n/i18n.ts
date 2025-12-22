import { dict, LANGS, type Lang } from './dictionaries';

const K_LANG = 'i18n:lang';
let current: Lang = (localStorage.getItem(K_LANG) as Lang) || 'es';

type Listener = (lang: Lang) => void;
const listeners = new Set<Listener>();

export function getLang(): Lang { return current; }

export function setLang(lang: Lang) {
  if (current === lang) return;
  current = lang;
  localStorage.setItem(K_LANG, lang);
  document.documentElement.lang = lang;
  listeners.forEach(fn => fn(lang));
}

export function onLangChange(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key: string, vars?: Record<string, string|number>): string {
  const table = dict[current] || {};
  let s = table[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}

export function initI18n() {
  // normaliza idioma al cargar
  if (!['es','eu','en'].includes(current)) current = 'es';
  document.documentElement.lang = current;
}

/** Traduce nodos con data-i18n y data-i18n-attr="attr:key;attr2:key2" */
export function bindI18n(container: ParentNode = document) {
  // Texto
  container.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')!;
    el.textContent = t(key);
  });
  // Atributos
  container.querySelectorAll<HTMLElement>('[data-i18n-attr]').forEach(el => {
    const spec = el.getAttribute('data-i18n-attr')!;
    spec.split(';').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}
