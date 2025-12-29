// src/getIntoIDE.ts
import { renderFileExplorer } from './components/IDEComponets/FileExplorer';
import { getCurrentUser, clearAppStorage } from './session';
import { UnifiedControlPanel } from './components/UnifiedControlPanel';
import { bindI18n, t } from './i18n/i18n';
import { getTheme } from './custom/prefs';
import { initTerminal, logTerminal } from './components/IDEComponets/Terminal';

/* ================= THEME INIT ================= */

function applyTheme() {
  const theme = getTheme() || 'classic';
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Layout principal tipo IDE (VSCode-like).
 */
export function getIntoIDE(): void {
  applyTheme(); // 👈 AQUI ESTÁ LA CLAVE

  const app = document.getElementById('app');
  if (!app) throw new Error('getIntoIDE: #app not found');

  /* ================= HTML BASE ================= */

  app.innerHTML = `
    <div
      id="whole-content"
      class="h-screen overflow-hidden
             grid grid-cols-[3.5rem_15rem_1fr]
             grid-rows-[3rem_minmax(0,1fr)_1.5rem]
             border border-gray-400/20">

      <!-- HEADER -->
      <header
        class="col-span-3 flex items-center px-3
               border-b border-gray-400/20"
        style="padding:5px">
        <a href="#/" class="h-full cursor-pointer hover:opacity-80 transition">
          <img
            src="/assets/customization/VsCodeLogo.png"
            class="h-full w-auto"
            alt="FT_TRANSCENDENCE" />
        </a>
      </header>

      <!-- SEARCH MODAL -->
      <div id="search-modal" class="fixed inset-0 bg-black/50 z-50 hidden items-start justify-center pt-20">
        <div class="bg-[#1e1e1e] border border-gray-400/20 rounded-lg w-[600px] max-w-[90vw] overflow-hidden shadow-2xl">
          <input
            id="search-input"
            type="text"
            placeholder="Search routes, games..."
            data-i18n-placeholder="search.placeholder"
            class="w-full px-4 py-3 bg-[#252526] text-white outline-none border-b border-gray-400/20"
          />
          <div id="search-results" class="max-h-[400px] overflow-y-auto">
          </div>
        </div>
      </div>

      <!-- MAIN -->
      <div class="col-span-3 flex min-h-0">

        <!-- LEFT BAR -->
        <aside
          class="w-[3.5rem] flex flex-col items-center
                 border-r border-gray-400/20 p-1">

          <button
            id="files-left-icon-btn"
            class="mb-2 hover:brightness-150 transition text-white/60 hover:text-white/90 text-2xl font-light"
            title="Explorer">
            ≡
          </button>

          <button
            id="threeinrow-left-icon-btn"
            class="mb-2 hover:brightness-150 transition text-white/60 hover:text-white/90 text-2xl font-light"
            title="Three in Row">
            #
          </button>

          <button
            id="search-left-icon-btn"
            class="mb-10 hover:brightness-150 transition text-white/60 hover:text-white/90 text-2xl font-light"
            title="h">
            ⌕
          </button>

          <div class="flex-1"></div>

          <div class="mb-2 flex flex-col items-center gap-4">

            <!-- USER -->
            <button
              id="user-btn"
              class="relative w-8 h-8 rounded-full overflow-hidden group"
              title="Logout">

              <img
                id="user-avatar"
                class="w-full h-full object-cover"
                src="/assets/customization/UserIcon_Left.png" />

              <div
                class="absolute inset-0 bg-black/70
                       flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition">
                <img src="/assets/customization/logout.png" class="w-4 h-4" />
              </div>
            </button>

            <!-- SETTINGS -->
            <button
              id="settings-btn"
              class="w-8 hover:brightness-150 transition"
              title="Settings">
              <img src="/assets/customization/SettingsIcon_Left.png" />
            </button>
          </div>
        </aside>

        <!-- FILE EXPLORER -->
        <aside
          id="mid-files-sidebar"
          class="w-[17rem] p-4
                 border-r border-gray-400/20
                 text-white overflow-auto">

          <p class="pb-4 text-sm text-white/70">EXPLORER</p>
          <nav id="list-files" class="space-y-1 text-sm"></nav>
        </aside>

        <!-- MAIN VIEW -->
        <section class="flex-1 grid grid-rows-[minmax(0,1fr)_200px] min-h-0 ">

          <!-- EDITOR -->
          <div class="overflow-auto flex flex-col min-h-0"> 

            <div class="flex h-9 border-b border-gray-400/20">
              <div id="opened-file"
                   class="hidden items-center px-4
                          border-t-2 border-blue-500
                          border-r border-gray-400/20"></div>
              <div class="flex-1"></div>
            </div>

                  <div id="router-view"class="flex-1 min-h-0 overflow-auto flex"></div>

          </div>

          <!-- TERMINAL -->
          <div
            class="border-t border-gray-400/20
                   text-white grid grid-rows-[auto_minmax(0,1fr)]
                   overflow-hidden">

            <div class="p-3 text-sm text-white/70" style="padding:7px">TERMINAL</div>
            <div id="terminal-container" class="overflow-auto"></div>
          </div>
        </section>
      </div>

      <!-- FOOTER -->
      <footer
        class="col-span-3 border-t border-gray-400/20
               px-4 py-1 text-xs text-white/60">
        FT_TRANSCENDENCE
      </footer>
    </div>
  `;

  /* ================= TERMINAL ================= */

  const terminalContainer = document.getElementById('terminal-container');
  if (terminalContainer) 
  {
    initTerminal(terminalContainer);
  }
  logTerminal(t('log.entered'));

  /* ================= FILE EXPLORER ================= */

  const fileList = document.getElementById('list-files');
  if (fileList) renderFileExplorer(fileList);

  const filesBtn = document.getElementById('files-left-icon-btn');
  const explorer = document.getElementById('mid-files-sidebar');
  filesBtn?.addEventListener('click', () => explorer?.classList.toggle('hidden'));

  /* ================= THREE IN ROW BUTTON ================= */

  const threeInRowBtn = document.getElementById('threeinrow-left-icon-btn');
  threeInRowBtn?.addEventListener('click', () => {
    location.hash = '#/play/threeinrow';
  });

  /* ================= SEARCH MODAL ================= */

  const searchBtn = document.getElementById('search-left-icon-btn');
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const searchResults = document.getElementById('search-results');

  const routes = [
    { name: 'Home', path: '#/', keywords: ['home', 'inicio', 'hasiera'] },
    { name: '1v1', path: '#/play/1v1', keywords: ['1v1', 'pong', 'play', 'game'] },
    { name: '4v4', path: '#/play/4v4', keywords: ['4v4', 'pong', 'team', 'play', 'game'] },
    { name: 'AI', path: '#/play/ai', keywords: ['ai', 'bot', 'ia', 'computer', 'cpu', 'play', 'game'] },
    { name: 'Tournament', path: '#/play/tournament', keywords: ['tournament', 'torneo', 'txapelketa', 'play', 'game'] },
    { name: 'Three in Row', path: '#/play/threeinrow', keywords: ['three', 'row', 'tres', 'raya', 'hiru', 'lerro', 'tic', 'tac', 'toe', 'game'] },
    { name: 'Stats', path: '#/stats', keywords: ['stats', 'statistics', 'estadisticas', 'estatistikak'] },
  ];

  const showSearch = () => {
    searchModal?.classList.remove('hidden');
    searchInput?.focus();
    performSearch('');
  };

  const hideSearch = () => {
    searchModal?.classList.add('hidden');
    if (searchInput) searchInput.value = '';
  };

  const performSearch = (query: string) => {
    if (!searchResults) return;
    const lowerQuery = query.toLowerCase().trim();
    
    const filtered = lowerQuery
      ? routes.filter(r => 
          r.name.toLowerCase().includes(lowerQuery) ||
          r.keywords.some(k => k.includes(lowerQuery))
        )
      : routes;

    searchResults.innerHTML = filtered.length
      ? filtered.map(r => `
          <div class="search-item px-4 py-3 hover:bg-[#2a2d2e] cursor-pointer border-b border-gray-400/10 flex items-center gap-3"
               data-path="${r.path}">
            <span class="text-blue-400 text-sm">→</span>
            <span class="text-white font-medium">${r.name}</span>
            <span class="text-gray-500 text-sm ml-auto">${r.path}</span>
          </div>
        `).join('')
      : '<div class="px-4 py-6 text-center text-gray-500">No results found</div>';

    searchResults.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        const path = item.getAttribute('data-path');
        if (path) {
          location.hash = path;
          hideSearch();
        }
      });
    });
  };

  searchBtn?.addEventListener('click', showSearch);

  searchInput?.addEventListener('input', (e) => {
    performSearch((e.target as HTMLInputElement).value);
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideSearch();
    if (e.key === 'Enter') {
      const firstResult = searchResults?.querySelector('.search-item') as HTMLElement;
      firstResult?.click();
    }
  });

  searchModal?.addEventListener('click', (e) => {
    if (e.target === searchModal) hideSearch();
  });

  /* ================= USER ================= */

  const avatarImg = document.getElementById('user-avatar') as HTMLImageElement;
  const userBtn = document.getElementById('user-btn');
  const user = getCurrentUser();

  if (user?.avatar) avatarImg.src = user.avatar;
  avatarImg.onerror = () => {
    avatarImg.src = '/assets/customization/UserIcon_Left.png';
  };

  userBtn?.addEventListener('click', () => {
    clearAppStorage();
    location.replace('#/');
    location.reload();
  });

  /* ================= SETTINGS PANEL ================= */

  const settingsBtn = document.getElementById('settings-btn');
  let panelVisible = false;

  const ensurePanel = () => {
    let panel = document.getElementById('unified-control-panel');
    if (!panel) {
      UnifiedControlPanel();
      panel = document.getElementById('unified-control-panel')!;
      bindI18n(panel);
      panel.classList.add('hidden');
    }
    return panel;
  };

  const togglePanel = () => {
    const panel = ensurePanel();
    panelVisible = !panelVisible;
    panel.classList.toggle('hidden', !panelVisible);
    settingsBtn?.classList.toggle('brightness-150', panelVisible);
  };

  settingsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('unified-control-panel');
    if (panelVisible && panel && !panel.contains(e.target as Node)) {
      panel.classList.add('hidden');
      panelVisible = false;
      settingsBtn?.classList.remove('brightness-150');
    }
  });
}
