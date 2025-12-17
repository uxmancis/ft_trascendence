import './styles.css';

import { register, startRouter } from './router';
import { getCurrentUser } from './session';
import { renderLogin } from './views/Login';
import { getIntoIDE } from './GetIntoIDE';

// Views
import { renderHome } from './views/Home';
import { renderStats } from './views/Stats';
import { renderPlayAI } from './views/PlayAI';
import { renderPlay1v1 } from './views/Play1v1';
import { setupLivePong3D } from './play//Live1v1';
import { setupPong } from './play/LiveAI';
import { renderTournament } from './views/Tournament';
import { setupTournamentPong } from './play/LiveTournament';
import { setupThreeInRow, renderPlayThreeInRow } from './views/threeinrow';
import { renderPlay4v4 } from './views/Play4v4';
import { setupLive4v4 } from './play/Live4v4';

// 🧩 Accesibilidad
import { applyA11yFromStorage } from './a11y/prefs';

// 🎨 Tema
import { applyThemeFromStorage } from './custom/prefs';

// 🌐 i18n
import { initI18n, bindI18n, onLangChange } from './i18n/i18n';

// ======================================================
// 1️⃣ INIT GLOBAL (antes de renderizar nada)
// ======================================================
initI18n();
applyA11yFromStorage();
applyThemeFromStorage();

// ======================================================
// 2️⃣ ROOT APP
// ======================================================
const app = document.getElementById('app')!;
app.innerHTML = '';

// ======================================================
// 3️⃣ ROUTER HELPERS
// ======================================================
let page: HTMLElement;

const wrap =
  (renderFn: (c: HTMLElement) => void | Promise<void>) =>
  async () => {
    await renderFn(page);
    bindI18n(page);
  };

function bootRoutes() {
  register('#/',                wrap(renderHome));
  register('#/stats',           wrap(renderStats));
  register('#/play/ai',         wrap(renderPlayAI));
  register('#/play/1v1',        wrap(renderPlay1v1));
  register('#/live/1v1',        wrap(setupLivePong3D));
  register('#/live/ai',         wrap(setupPong));
  register('#/live/threeinrow', wrap(setupThreeInRow));
  register('#/play/threeinrow', wrap(renderPlayThreeInRow));
  register('#/play/tournament', wrap(renderTournament));
  register('#/game/live',       wrap(setupTournamentPong));
  register('#/play/4v4',        wrap(renderPlay4v4));
  register('#/live/4v4',        wrap(setupLive4v4));

  register('#/404', async () => {
    page.innerHTML = `
      <div class="p-6">
        <h1 class="text-2xl font-bold" data-i18n="common.notfound"></h1>
      </div>
    `;
    bindI18n(page);
  });
}

// ======================================================
// 4️⃣ SESSION FLOW
// ======================================================
const user = getCurrentUser();

if (!user) {
  // ====================================================
  // ❌ NO USER → LOGIN ONLY (NO IDE)
  // ====================================================
  const loginContainer = document.createElement('div');
  loginContainer.id = 'login-root';
  app.appendChild(loginContainer);

  renderLogin(loginContainer, () => {
    // tras login correcto → recargamos app
    location.replace('#/');
    location.reload();
  });

  bindI18n(loginContainer);

} else {
  // ====================================================
  // ✅ USER → IDE + ROUTER
  // ====================================================
  getIntoIDE();

  page = document.getElementById('router-view')!;
  bootRoutes();
  startRouter();
}

// ======================================================
// 5️⃣ LANGUAGE CHANGE (re-bind content only)
// ======================================================
onLangChange(() => {
  if (page) {
    bindI18n(page);
  }
});
