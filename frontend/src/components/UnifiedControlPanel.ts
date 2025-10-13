// src/components/UnifiedControlPanel.ts
import { TextSizeButtons } from './TextSizeButtons';
import { HighContrastButton } from './HighContrastButton';
import { ThemeSelector } from './ThemeSelector';
import { MusicButton } from './MusicButton';
import { LanguageSelector } from './LanguageSelector'; // � NEW
import { t, onLangChange } from '../i18n/i18n';

export function UnifiedControlPanel() {
  if (document.getElementById('unified-control-panel')) return;

  // Barra inferior full-width
  const bar = document.createElement('div');
  bar.id = 'unified-control-panel';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', t('panel.title'));

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

  const group = (titleKey: string, ...els: HTMLElement[]) => {
    const g = document.createElement('div');
    g.className = [
      'flex items-center gap-2',
      'px-2 py-1 rounded-xl bg-white/5',
      'border border-white/10'
    ].join(' ');
    const label = document.createElement('span');
    label.className = 'hidden sm:inline text-xs opacity-80 mr-1';
    label.textContent = t(titleKey);
    label.setAttribute('data-i18n', titleKey);
    g.append(label, ...els);
    return g;
  };

  const gA11y  = group('panel.access', TextSizeButtons(true), HighContrastButton(true));
  const gTheme = group('panel.theme', ThemeSelector(true));
  const gMusic = group('panel.music', MusicButton(true));
  const gLang  = group('panel.lang', LanguageSelector(true)); // � NEW

  inner.append(gA11y, gTheme, gMusic, gLang);
  bar.appendChild(inner);
  document.body.appendChild(bar);

  const off = onLangChange(() => {
    bar.setAttribute('aria-label', t('panel.title'));
    // labels have data-i18n and will be rebound elsewhere if needed
  });
  (bar as any)._cleanup = () => off();
}
