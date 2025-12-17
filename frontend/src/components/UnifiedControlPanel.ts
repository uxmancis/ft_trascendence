// src/components/UnifiedControlPanel.ts
import { AccessibilityControls } from './PanelComponets/AccessibilityControls';
import { ThemeSelector } from './PanelComponets/ThemeSelector';
import { MusicButton } from './PanelComponets/MusicButton';
import { LanguageSelector } from './PanelComponets/LanguageSelector';
import { t, onLangChange } from '../i18n/i18n';

export type ControlPanelMode = 'ide' | 'login';

const PANEL_WIDTH = 'w-80'; // 320px
const ROW_HEIGHT  = 'h-9';
const CTRL_WIDTH  = 'w-40';

export function UnifiedControlPanel(mode: ControlPanelMode = 'ide') {
  if (document.getElementById('unified-control-panel')) return;

  const isLogin = mode === 'login';

  /* ================= PANEL ================= */
  const panel = document.createElement('div');
  panel.id = 'unified-control-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', t('panel.title'));

  panel.className = isLogin
    ? [
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-black/50 backdrop-blur',
        'border-t border-white/10',
        'px-4 py-2',
        'text-white text-xs'
      ].join(' ')
    : [
        'fixed z-50 bottom-10 left-16',
        PANEL_WIDTH,
        'rounded-md',
        'bg-neutral-900',
        'border border-white/15',
        'shadow-2xl',
        'text-white text-xs'
      ].join(' ');

  /* ================= HEADER (IDE only) ================= */
  let header: HTMLDivElement | null = null;

  if (!isLogin) {
    header = document.createElement('div');
    header.className = [
      'px-3 py-2',
      'border-b border-white/10',
      'uppercase tracking-wide',
      'text-white/70'
    ].join(' ');
    header.textContent = t('panel.title');
    panel.appendChild(header);
  }

  /* ================= CONTENT ================= */
  const content = document.createElement('div');

  content.className = isLogin
    ? 'flex items-center justify-center gap-4'
    : 'p-2 space-y-1';

  /* ---------- helper fila IDE ---------- */
  const row = (titleKey: string, controls: HTMLElement[]) => {
    const r = document.createElement('div');
    r.className = [
      'grid grid-cols-[112px_1fr]',
      ROW_HEIGHT,
      'items-center',
      'px-2 rounded',
      'hover:bg-white/5'
    ].join(' ');

    const label = document.createElement('span');
    label.className = 'text-white/70 truncate';
    label.textContent = t(titleKey);
    label.setAttribute('data-i18n', titleKey);

    const ctrl = document.createElement('div');
    ctrl.className = [
      'flex items-center justify-end gap-1',
      CTRL_WIDTH
    ].join(' ');
    ctrl.append(...controls);

    r.append(label, ctrl);
    return r;
  };

  /* ================= CONTROLS ================= */
  if (isLogin) {
    // Horizontal, icon-only, stable
    content.append(
      AccessibilityControls(),
      ThemeSelector(),
      MusicButton(),
      LanguageSelector()
    );
  } else {
    // IDE layout
    content.append(
      row('panel.access', [AccessibilityControls()]),
      row('panel.theme',  [ThemeSelector()]),
      row('panel.music',  [MusicButton()]),
      row('panel.lang',   [LanguageSelector()])
    );
  }

  panel.appendChild(content);
  document.body.appendChild(panel);

  /* ================= I18N ================= */
  const off = onLangChange(() => {
    panel.setAttribute('aria-label', t('panel.title'));
    if (header) header.textContent = t('panel.title');
  });

  (panel as any)._cleanup = () => off();
}
