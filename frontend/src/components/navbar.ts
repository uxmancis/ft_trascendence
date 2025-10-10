import { navigate } from '../router';
import {
  getCurrentUser,
  clearAppStorage, // limpia pong:user, pong:local:p2, pong:local:tournament, etc.
} from '../session';

type LinkItem = { label: string; hash: string };

const LINKS: LinkItem[] = [
  { label: 'Inicio',         hash: '#/' },
  { label: 'Partido vs IA',  hash: '#/play/ai' },
  { label: '1 vs 1',         hash: '#/play/1v1' },
  { label: 'Torneo 4J',      hash: '#/play/tournament' },
  { label: 'Estadísticas',   hash: '#/stats' },
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
                    <span class="text-sm md:text-[0.95rem] font-medium">${l.label}</span>
                  </a>
                </li>
              `).join('')}
              <!-- Indicador animado -->
              <div id="nav-indicator"
                   class="absolute bottom-0 h-[2px] bg-white/80 rounded transition-all duration-300"
                   style="left:0;width:0"></div>
            </ul>
          </div>

          <!-- Usuario / Logout -->
          <div class="shrink-0 flex items-center gap-3 pl-3 border-l border-white/10">
            <img src="${user.avatar}" alt="${user.nick}" class="w-8 h-8 rounded-full" />
            <span class="hidden sm:inline opacity-90 text-sm">${user.nick}</span>
            <button id="logout"
                    class="text-xs px-2.5 py-1.5 rounded bg-black/30 hover:bg-black/50 transition">
              Salir
            </button>
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
  };
}
