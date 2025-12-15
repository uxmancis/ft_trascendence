import { renderFileExplorer } from '../components/FileExplorer';
import { getCurrentUser, clearAppStorage } from '../session';
import { UnifiedControlPanel } from '../components/UnifiedControlPanel';
import { bindI18n } from '../i18n/i18n';

/**
 * Monta el layout principal tipo VSCode.
 * Este layout actúa como "shell" fijo de la aplicación.
 * El router debe renderizar dentro de #router-view
 */
export function getIntoIDE(): void {
  const app = document.getElementById('app');

  if (!app) {
    throw new Error('getIntoIDE: #app not found');
  }

  app.innerHTML = `
    <div id="whole-content"
      class="h-screen grid grid-cols-[3.5rem_15rem_1fr] grid-rows-[3rem_1fr_1.5rem]
             bg-neutral-900 border-[0.5px] border-gray-400 border-opacity-15">

      <!-- HEADER -->
      <header id="header"
        class="col-span-3 p-2.5 border border-gray-400 border-opacity-15 flex items-center">
        <img src="/assets/customization/VsCodeLogo.png" class="h-full w-auto" />
      </header>

      <!-- MAIN -->
      <div id="main-content" class="flex col-span-3">

        <!-- LEFT ICON BAR -->
        <aside id="left-icons"
          class="w-[3.5rem] p-1 flex flex-col border border-gray-400 border-opacity-15">

          <!-- FILES BUTTON -->
          <div class="mb-12 flex justify-center">
            <button id="files-left-icon-btn">
              <img src="/assets/customization/files_Icon.png" />
            </button>
          </div>

          <div class="flex-1"></div>

          <!-- USER / SETTINGS -->
          <div class="mb-1 flex flex-col items-center gap-4">

            <!-- USER AVATAR / LOGOUT -->
            <button
              id="user-btn"
              class="relative w-8 h-8 rounded-full overflow-hidden group"
              title="Logout"
            >
              <img
                id="user-avatar"
                src="/assets/customization/UserIcon_Left.png"
                class="w-full h-full object-cover rounded-full"
                alt="User avatar"
              />

              <!-- LOGOUT OVERLAY -->
              <div
                class="absolute inset-0 bg-black/70 flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition">
                <img src="/assets/customization/logout.png" class="w-4 h-4" />
              </div>
            </button>

            <!-- SETTINGS -->
            <button
              id="settings-btn"
              class="w-8 hover:brightness-150"
              title="Settings"
            >
              <img src="/assets/customization/SettingsIcon_Left.png" />
            </button>

          </div>
        </aside>

        <!-- FILE EXPLORER -->
        <aside id="mid-files-sidebar"
          class="hidden w-[17rem] p-4 border border-gray-400 border-opacity-15 text-white">
          <p class="pb-4 text-sm text-white/80">EXPLORER</p>
          <nav id="list-files" class="space-y-1 text-sm"></nav>
        </aside>

        <!-- RIGHT MAIN -->
        <section id="right-main" class="flex-1 grid grid-rows-[1fr_200px]">

          <!-- SCREEN -->
          <div id="up-screen"
            class="flex flex-col w-full bg-neutral-800 text-white">

            <!-- FILE TABS -->
            <div id="row-1-fixed" class="flex border-b border-gray-400/20">
              <div id="opened-file"
                class="hidden items-center space-x-3 pl-4 py-2
                       bg-neutral-800 border-t-2 border-t-blue-500
                       border-r border-gray-400/20">
              </div>
              <div class="flex-1"></div>
            </div>

            <!-- ROUTER VIEW -->
            <div id="router-view"
              class="flex flex-col flex-grow w-full items-center justify-center">
            </div>
          </div>

          <!-- TERMINAL -->
          <div id="down-terminal"
            class="grid grid-rows-2 border border-gray-400 border-opacity-15 text-white">
            <div class="p-4">
              <p class="text-sm text-white/80">TERMINAL</p>
            </div>
            <div></div>
          </div>
        </section>
      </div>

      <!-- FOOTER -->
      <footer class="col-span-3 border-t border-gray-400 border-opacity-15 px-4 py-1">
        <p class="text-xs text-white/60">FT_TRANSCENDENCE</p>
      </footer>
    </div>
  `;

  /* =============================
   * FILE EXPLORER
   * ============================= */
  const fileList = document.getElementById('list-files');
  if (fileList) {
    renderFileExplorer(fileList);
  }

  const filesBtn = document.getElementById('files-left-icon-btn');
  const explorer = document.getElementById('mid-files-sidebar');
  filesBtn?.addEventListener('click', () => {
    explorer?.classList.toggle('hidden');
  });

  /* =============================
   * USER AVATAR
   * ============================= */
  const avatarImg = document.getElementById('user-avatar') as HTMLImageElement | null;
  const userBtn = document.getElementById('user-btn');
  const user = getCurrentUser();

  if (avatarImg) {
    avatarImg.onerror = () => {
      avatarImg.src = '/assets/UserIcon_Left.png';
    };
    if (user?.avatar) {
      avatarImg.src = user.avatar;
    }
  }

  // LOGOUT
  userBtn?.addEventListener('click', () => {
    clearAppStorage();
    location.replace('#/');
    location.reload();
  });

  /* =============================
   * SETTINGS (UnifiedControlPanel)
   * ============================= */
  const settingsBtn = document.getElementById('settings-btn');

  settingsBtn?.addEventListener('click', () => {
    if (document.getElementById('unified-control-panel')) return;

    UnifiedControlPanel();

    const panel = document.getElementById('unified-control-panel');
    if (panel) {
      bindI18n(panel);
    }
  });
}
