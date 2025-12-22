// src/components/ThemeSelector.ts
import { getTheme, setTheme, type ThemeId } from '../../custom/prefs';
import { t, onLangChange } from '../../i18n/i18n';

type ThemeDef = {
  id: ThemeId;
  name: string;
  preview: string;
};

export const THEMES: ThemeDef[] = [
  { id: 'classic', name: 'theme.classic', preview: 'linear-gradient(135deg,#0f172a,#1f2937)' },
  { id: 'vscode',  name: 'theme.vscode',  preview: 'linear-gradient(135deg,#1e1e1e,#252526)' },
  { id: 'neon',    name: 'theme.neon',    preview: 'linear-gradient(135deg,#22c55e,#06b6d4)' },
  { id: 'vapor',   name: 'theme.vapor',   preview: 'linear-gradient(135deg,#ff7ab6,#8b5cf6)' },
  { id: 'earth',   name: 'theme.earth',   preview: 'linear-gradient(135deg,#166534,#4d7c0f)' },
  { id: 'space',   name: 'theme.space',   preview: 'linear-gradient(135deg,#0ea5e9,#312e81)' },
  { id: 'matrix',  name: 'theme.matrix',  preview: 'linear-gradient(135deg,#16a34a,#052e16)' },
];

export function ThemeSelector(): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'w-8 h-8 rounded hover:bg-white/10';
  btn.type = 'button';

  let idx = Math.max(0, THEMES.findIndex(t => t.id === getTheme()));

  const apply = (i: number) => {
    idx = (i + THEMES.length) % THEMES.length;
    const th = THEMES[idx];
    setTheme(th.id);
    btn.style.backgroundImage = th.preview;
    btn.style.backgroundSize = '200%';
    btn.title = t(th.name);
    btn.setAttribute('aria-label', t('theme.change'));
  };

  apply(idx);

  btn.onclick = () => apply(idx + 1);

  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      btn.click();
    }
  });

  const off = onLangChange(() => apply(idx));
  (btn as any)._cleanup = () => off();

  return btn;
}
