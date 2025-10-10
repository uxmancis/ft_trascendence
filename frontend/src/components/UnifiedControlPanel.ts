// src/components/UnifiedControlPanel.ts
import { TextSizeButtons } from './TextSizeButtons';
import { HighContrastButton } from './HighContrastButton';
import { ThemeSelector } from './ThemeSelector';
import { MusicButton } from './MusicButton';
import { LanguageSelector } from './LanguageSelector'; // 👈 NEW

export function UnifiedControlPanel() {
  if (document.getElementById('unified-control-panel')) return;

  // Barra inferior full-width
  const bar = document.createElement('div');
  bar.id = 'unified-control-panel';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Controles de accesibilidad y personalización');

  bar.className = [
    'fixed bottom-0 left-0 right-0 z-50',
    'border-t border-white/10',
    'bg-black/40 backdrop-blur',
    'px-3 py-2'
  ].join(' ');
  bar.style.paddingBottom = 'calc(env(safe-area-inset-bottom, 0px) + 0.25rem)';

  // Contenedor interno con WRAP
  const inner = document.createElement('div');
  inner.className = [
    'mx-auto w-full max-w-screen-2xl',
    'flex flex-wrap items-center justify-between gap-2'
  ].join(' ');

  const group = (title: string, ...els: HTMLElement[]) => {
    const g = document.createElement('div');
    g.className = [
      'flex items-center gap-2',
      'px-2 py-1 rounded-xl bg-white/5',
      'border border-white/10'
    ].join(' ');
    const label = document.createElement('span');
    label.className = 'hidden sm:inline text-xs opacity-80 mr-1';
    label.textContent = title;
    g.append(label, ...els);
    return g;
  };

  const gA11y  = group('Accesibilidad:', TextSizeButtons(true), HighContrastButton(true));
  const gTheme = group('Tema:', ThemeSelector(true));
  const gMusic = group('Música:', MusicButton(true));
  const gLang  = group('', LanguageSelector(true)); // 👈 NEW

  inner.append(gA11y, gTheme, gMusic, gLang);
  bar.appendChild(inner);
  document.body.appendChild(bar);
}
