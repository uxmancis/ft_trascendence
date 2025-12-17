import { renderFileExplorer } from './components/IDEComponets/FileExplorer';
import { getCurrentUser, clearAppStorage } from './session';
import { UnifiedControlPanel } from './components/UnifiedControlPanel';
import { bindI18n } from './i18n/i18n';

/**
 * Layout principal tipo IDE (VSCode-like).
 * - Layout rígido (NO cambia de tamaño).
 * - Scroll solo en router-view.
 * - Shell persistente.
 */
export function getIntoIDE(): void {
  const app = document.getElementById('app');

  if (!app) {
    throw new Error('getIntoIDE: #app not found');
  }

  /* ======================================================
   * HTML BASE DEL IDE (RÍGIDO)
   * ====================================================== */
  app.innerHTML = `
    <div
      id="whole-content"
      class="h-screen overflow-hidden
             grid grid-cols-[3.5rem_15rem_1fr]
             grid-rows-[3rem_minmax(0,1fr)_1.5rem]
             bg-neutral-900 border border-gray-400/20">

      <!-- ================= HEADER ================= -->
      <header
        class="col-span-3 flex items-center px-3
               border-b border-gray-400/20" style="padding: 5px">
        <img
          src="/assets/customization/VsCodeLogo.png"
          class="h-full w-auto"
          alt="FT_TRANSCENDENCE" />
      </header>

      <!-- ================= MAIN ================= -->
      <div class="col-span-3 flex min-h-0">

        <!-- ===== LEFT ICON BAR ===== -->
        <aside
          class="w-[3.5rem] flex flex-col items-center
                 border-r border-gray-400/20 p-1">

          <!-- FILE EXPLORER -->
          <button
            id="files-left-icon-btn"
            class="mb-10 hover:brightness-150 transition">
            <img src="/assets/customization/files_Icon.png" />
          </button>

          <div class="flex-1"></div>

          <!-- USER + SETTINGS -->
          <div class="mb-2 flex flex-col items-center gap-4">

            <!-- USER / LOGOUT -->
            <button
              id="user-btn"
              class="relative w-8 h-8 rounded-full overflow-hidden group"
              title="Logout">

              <img
                id="user-avatar"
                src="/assets/customization/UserIcon_Left.png"
                class="w-full h-full object-cover"
                alt="User avatar" />

              <div
                class="absolute inset-0 bg-black/70
                       flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition">
                <img
                  src="/assets/customization/logout.png"
                  class="w-4 h-4" />
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

        <!-- ===== FILE EXPLORER ===== -->
        <aside
          id="mid-files-sidebar"
          class="hidden w-[17rem] p-4
                 border-r border-gray-400/20
                 text-white overflow-auto">

          <p class="pb-4 text-sm text-white/70">EXPLORER</p>
          <nav id="list-files" class="space-y-1 text-sm"></nav>
        </aside>

        <!-- ===== MAIN VIEW ===== -->
        <section
          class="flex-1 grid grid-rows-[minmax(0,1fr)_200px] min-h-0">

          <!-- EDITOR -->
          <div class="flex flex-col bg-neutral-800 text-white min-h-0">

            <!-- TABS -->
            <div class="flex h-9 border-b border-gray-400/20">
              <div
                id="opened-file"
                class="hidden items-center px-4
                       border-t-2 border-blue-500
                       border-r border-gray-400/20">
              </div>
              <div class="flex-1"></div>
            </div>

            <!-- ROUTER VIEW (SCROLL AQUÍ) -->
            <div
              id="router-view"
              class="flex-1 overflow-auto p-4
                     flex items-start justify-center">
            </div>
          </div>

          <!-- TERMINAL -->
          <div
            class="border-t border-gray-400/20
                   text-white grid grid-rows-[auto_minmax(0,1fr)]
                   overflow-hidden">

            <div class="p-3 text-sm text-white/70">
              TERMINAL
            </div>
            <div class="overflow-auto"></div>
          </div>
        </section>
      </div>

      <!-- ================= FOOTER ================= -->
      <footer
        class="col-span-3 border-t border-gray-400/20
               px-4 py-1 text-xs text-white/60">
        FT_TRANSCENDENCE
      </footer>
    </div>
  `;

  /* ======================================================
   * FILE EXPLORER
   * ====================================================== */
  const fileList = document.getElementById('list-files');
  if (fileList) renderFileExplorer(fileList);

  const filesBtn = document.getElementById('files-left-icon-btn');
  const explorer = document.getElementById('mid-files-sidebar');

  filesBtn?.addEventListener('click', () => {
    explorer?.classList.toggle('hidden');
  });

  /* ======================================================
   * USER AVATAR + LOGOUT
   * ====================================================== */
  const avatarImg = document.getElementById('user-avatar') as HTMLImageElement;
  const userBtn = document.getElementById('user-btn');
  const user = getCurrentUser();

  avatarImg.onerror = () => {
    avatarImg.src = '/assets/customization/UserIcon_Left.png';
  };

  if (user?.avatar) {
    avatarImg.src = user.avatar;
  }

  userBtn?.addEventListener('click', () => {
    clearAppStorage();
    location.replace('#/');
    location.reload();
  });

  /* ======================================================
   * SETTINGS PANEL (TOGGLE IDE STYLE)
   * ====================================================== */
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

  const showPanel = () => {
    const panel = ensurePanel();
    panel.classList.remove('hidden');
    settingsBtn?.classList.add('brightness-150');
    panelVisible = true;
  };

  const hidePanel = () => {
    const panel = document.getElementById('unified-control-panel');
    if (!panel) return;
    panel.classList.add('hidden');
    settingsBtn?.classList.remove('brightness-150');
    panelVisible = false;
  };

  settingsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    panelVisible ? hidePanel() : showPanel();
  });

  // click fuera → cerrar (UX IDE real)
  document.addEventListener('click', (e) => {
    if (!panelVisible) return;

    const panel = document.getElementById('unified-control-panel');
    if (
      panel &&
      !panel.contains(e.target as Node) &&
      e.target !== settingsBtn
    ) {
      hidePanel();
    }
  });
}
