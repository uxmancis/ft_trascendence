import { navigate } from '../router';
import {
  getCurrentUser,
  clearAppStorage, // limpia pong:user, pong:local:p2, pong:local:tournament, etc.
} from '../session';
import { t, onLangChange } from '../i18n/i18n';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSelector } from './ThemeSelector';
import { TextSizeButtons } from './TextSizeButtons';
import { HighContrastButton } from './HighContrastButton';
import { MusicButton } from './MusicButton';

type LinkItem = { labelKey: string; hash: string };

const LINKS: LinkItem[] = [
  { labelKey: 'nav.home',       hash: '#/' },
  { labelKey: 'nav.ai',         hash: '#/play/ai' },
  { labelKey: 'nav.1v1',        hash: '#/play/1v1' },
  { labelKey: 'nav.tournament', hash: '#/play/tournament' },
  { labelKey: 'nav.threeinrow', hash: '#/play/threeinrow' },
  { labelKey: 'nav.4v4',        hash: '#/play/4v4' },
  { labelKey: 'nav.stats',      hash: '#/stats' },
];

export function renderNavbar(container: HTMLElement) {
  // evitar duplicar listeners si re-renderizas
  (container as any)._navCleanup?.();

  const user = getCurrentUser();
  if (!user) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <header class="sticky top-0 z-50 backdrop-blur bg-white/10 border-b border-white/10">
      <nav class="max-w-screen-2xl mx-auto px-4">
        <div class="h-14 flex items-stretch gap-4">
          <!-- Logo -->
          <a data-link="#/" class="shrink-0 flex items-center font-semibold text-lg hover:opacity-90">
            🏓 PONG
          </a>

          <!-- Links (scroll horizontal en móvil) -->
          <div class="relative flex-1 overflow-x-auto no-scrollbar">
            <ul id="nav-links"
                class="relative flex h-full items-stretch gap-1 sm:gap-2 md:gap-3
                       whitespace-nowrap snap-x snap-mandatory">
              ${LINKS.map(l => `
                <li class="snap-start">
                  <a data-link="${l.hash}"
                     class="group h-full px-3 sm:px-4 md:px-5 flex items-center rounded-md
                            text-white/80 hover:text-white transition
                            hover:-translate-y-[1px]">
                    <span class="text-sm md:text-[0.95rem] font-medium" data-i18n="${l.labelKey}">${t(l.labelKey)}</span>
                  </a>
                </li>
              `).join('')}
              <!-- Indicador animado -->
              <div id="nav-indicator"
                   class="absolute bottom-0 h-[2px] bg-white/80 rounded transition-all duration-300"
                   style="left:0;width:0"></div>
            </ul>
          </div>

          <!-- Usuario / Logout / Accesibilidad -->
          <div class="shrink-0 flex items-center gap-3 pl-3 border-l border-white/10">
            <img src="${user.avatar}" alt="${user.nick}" class="w-8 h-8 rounded-full" />
            <span class="hidden sm:inline opacity-90 text-sm">${user.nick}</span>

            <!-- Dropdown Accesibilidad -->
            <div class="relative" id="access-menu">
              <button id="access-btn" type="button"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-black/30 hover:bg-black/50"
                      aria-haspopup="true" aria-expanded="false"
                      title="${t('nav.accessMenu')}"
                      data-i18n-attr="title:nav.accessMenu;aria-label:nav.accessMenu.open"
                      aria-label="${t('nav.accessMenu.open')}">
                <span aria-hidden="true">⚙️</span>
              </button>
              <div id="access-panel" class="hidden absolute right-0 mt-2 w-72 sm:w-80 rounded-xl border border-white/10 bg-black/70 backdrop-blur shadow-xl p-3">
                <div class="text-xs opacity-80 mb-2" data-i18n="panel.title">${t('panel.title')}</div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    <span class="hidden sm:inline text-xs opacity-80" data-i18n="panel.lang">${t('panel.lang')}</span>
                    <div id="slot-lang"></div>
                  </div>
                  <div class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    <span class="hidden sm:inline text-xs opacity-80" data-i18n="panel.theme">${t('panel.theme')}</span>
                    <div id="slot-theme"></div>
                  </div>
                  <div class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    <span class="hidden sm:inline text-xs opacity-80" data-i18n="panel.access">${t('panel.access')}</span>
                    <div class="flex items-center gap-2" id="slot-a11y"></div>
                  </div>
                  <div class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    <span class="hidden sm:inline text-xs opacity-80" data-i18n="panel.music">${t('panel.music')}</span>
                    <div id="slot-music"></div>
                  </div>
                </div>
              </div>
            </div>

            <button id="logout"
                    class="text-xs px-2.5 py-1.5 rounded bg-black/30 hover:bg-black/50 transition"
                    data-i18n="nav.logout">${t('nav.logout')}</button>
          </div>
        </div>
      </nav>
    </header>
  `;

  // navegación
  container.querySelectorAll<HTMLAnchorElement>('[data-link]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.dataset.link!);
    });
  });

  // logout: limpia TODO lo local y vuelve al login
  const logout = container.querySelector<HTMLButtonElement>('#logout')!;
  logout.onclick = () => {
    clearAppStorage();        // 🔥 limpia todas las claves 'pong:*'
    location.replace('#/');   // evita volver a “estado anterior” con el back
    location.reload();        // fuerza re-render para mostrar login sin navbar
  };

  // Wire dropdown content
  const panel = container.querySelector<HTMLDivElement>('#access-panel')!;
  const btn   = container.querySelector<HTMLButtonElement>('#access-btn')!;
  const slotLang  = container.querySelector<HTMLDivElement>('#slot-lang')!;
  const slotTheme = container.querySelector<HTMLDivElement>('#slot-theme')!;
  const slotA11y  = container.querySelector<HTMLDivElement>('#slot-a11y')!;
  const slotMusic = container.querySelector<HTMLDivElement>('#slot-music')!;

  // mount controls (compact styles from components)
  slotLang.appendChild(LanguageSelector(true));
  slotTheme.appendChild(ThemeSelector(true));
  slotA11y.appendChild(TextSizeButtons(true));
  slotA11y.appendChild(HighContrastButton(true));
  slotMusic.appendChild(MusicButton(true));

  const closePanel = () => {
    panel.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', t('nav.accessMenu.open'));
  };
  const openPanel = () => {
    panel.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', t('nav.accessMenu.close'));
  };
  const togglePanel = () => {
    const isHidden = panel.classList.contains('hidden');
    isHidden ? openPanel() : closePanel();
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target as Node) && (e.target as Node) !== btn) {
      closePanel();
    }
  });
  // Keyboard a11y: Esc to close, focus trap light
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePanel(); btn.focus(); }
  });

  // Update translatable attributes on language change
  const offLang = onLangChange(() => {
    btn.title = t('nav.accessMenu');
    btn.setAttribute('aria-label', panel.classList.contains('hidden') ? t('nav.accessMenu.open') : t('nav.accessMenu.close'));
    container.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
      // navbar uses main bind elsewhere; keep minimal refresh here
      // labels in panel header are data-i18n already and will be rebound globally
    });
  });

  // indicador activo
  const ul = container.querySelector<HTMLUListElement>('#nav-links')!;
  const indicator = container.querySelector<HTMLDivElement>('#nav-indicator')!;
  const anchors = Array.from(ul.querySelectorAll<HTMLAnchorElement>('a[data-link]'));

  function bestMatch(hash: string) {
    let winner: HTMLAnchorElement | null = null;
    let score = -1;
    for (const a of anchors) {
      const h = a.dataset.link!;
      if (hash === h || hash.startsWith(h)) {
        if (h.length > score) { score = h.length; winner = a; }
      }
    }
    return winner ?? anchors[0];
  }

  function setActiveVisual() {
    const current = bestMatch(location.hash || '#/');
    anchors.forEach(a => {
      a.classList.toggle('text-white', a === current);
      a.classList.toggle('text-white/80', a !== current);
    });
    const parentRect = ul.getBoundingClientRect();
    const r = current.getBoundingClientRect();
    const left = r.left - parentRect.left + ul.scrollLeft;
    const pad = 12;
    const width = Math.max(r.width - pad * 2, 24);
    indicator.style.left = `${left + pad}px`;
    indicator.style.width = `${width}px`;
  }

  // espera a layout antes de medir
  requestAnimationFrame(setActiveVisual);

  // sombra suave en scroll
  const headerEl = container.querySelector('header')!;
  const onWinScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (y > 2) headerEl.classList.add('shadow-[0_1px_8px_rgba(0,0,0,0.25)]');
    else headerEl.classList.remove('shadow-[0_1px_8px_rgba(0,0,0,0.25)]');
  };
  onWinScroll();

  // listeners
  const onHash = () => requestAnimationFrame(setActiveVisual);
  const onResize = () => requestAnimationFrame(setActiveVisual);
  const onUlScroll = () => requestAnimationFrame(setActiveVisual);
  const onWinScrollWrap = () => onWinScroll();

  window.addEventListener('hashchange', onHash);
  window.addEventListener('resize', onResize);
  ul.addEventListener('scroll', onUlScroll);
  window.addEventListener('scroll', onWinScrollWrap, { passive: true });

  // cleanup
  (container as any)._navCleanup = () => {
    window.removeEventListener('hashchange', onHash);
    window.removeEventListener('resize', onResize);
    ul.removeEventListener('scroll', onUlScroll);
    window.removeEventListener('scroll', onWinScrollWrap);
    offLang?.();
  };
}
