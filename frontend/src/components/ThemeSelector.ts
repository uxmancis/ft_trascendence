// src/components/ThemeSelector.ts
import { getTheme, setTheme, type ThemeId } from '../custom/prefs';

type ThemeDef = {
  id: ThemeId;
  name: string;
  // vista previa (gradiente) para el botón
  preview: string;
};

export const THEMES: ThemeDef[] = [
  { id: 'classic', name: 'Clásico', preview: 'linear-gradient(135deg,#0f172a,#1f2937)' }, // slate
  { id: 'neon',    name: 'Neón',    preview: 'linear-gradient(135deg,#22c55e,#06b6d4)' },
  { id: 'vapor',   name: 'Vaporwave', preview: 'linear-gradient(135deg,#ff7ab6,#8b5cf6)' },
  { id: 'earth',   name: 'Tierra',  preview: 'linear-gradient(135deg,#166534,#4d7c0f)' },
  { id: 'space',   name: 'Espacio', preview: 'linear-gradient(135deg,#0ea5e9,#312e81)' },
  { id: 'matrix',  name: 'Matrix',  preview: 'linear-gradient(135deg,#16a34a,#052e16)' },
];

export function ThemeSelector(compact = true): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = compact
    ? 'inline-flex items-center gap-1'
    : 'flex items-center gap-2';

  const label = document.createElement('span');
  label.className = 'hidden sm:inline text-xs opacity-80 mr-1';
  label.textContent;
  wrap.appendChild(label);

  // Botón que cicla temas
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'theme-switcher-btn';
  btn.className = 'px-2 py-1 rounded bg-black/30 hover:bg-black/50 text-xs font-medium';
  btn.setAttribute('aria-label', 'Cambiar tema visual');
  wrap.appendChild(btn);

  let idx = Math.max(0, THEMES.findIndex(t => t.id === getTheme()));
  if (idx < 0) idx = 0;

  const apply = (i: number) => {
    idx = (i + THEMES.length) % THEMES.length;
    const th = THEMES[idx];
    setTheme(th.id);
    btn.textContent = th.name;
    btn.style.backgroundImage = th.preview;
    btn.style.backgroundSize = '200%';
    btn.style.color = '#fff';
  };
  apply(idx);

  btn.addEventListener('click', () => apply(idx + 1));

  // Atajo (Alt+Shift+T)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      btn.click();
    }
  });

  return wrap;
}
