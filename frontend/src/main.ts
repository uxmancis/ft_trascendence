import './styles.css';
import { renderNavbar } from './components/navbar';
import { register, startRouter } from './router';
import { renderHome } from './views/Home';
import { renderStats } from './views/Stats';
import { renderPlayAI } from './views/PlayAI';
import { renderPlay1v1 } from './views/Play1v1';
import { setupLivePong3D } from './views/Live1v1';
import { setupPong } from './views/LiveAI';
import { renderTournament } from './views/Tournament';
import { setupTournamentPong } from './views/LiveTournament';
import { setupThreeInRow } from './views/threeinrow';
import { renderPlayThreeInRow } from './views/threeinrow';
import { renderPlay4v4 } from './views/Play4v4';
import { setupLive4v4 } from './views/Live4v4';
import { getCurrentUser } from './session';
import { renderLogin } from './views/Login';

// 🧩 Accesibilidad
import { applyA11yFromStorage } from './a11y/prefs';

// 🎨 Tema (personalización)
import { applyThemeFromStorage } from './custom/prefs';

// 🌐 i18n
import { initI18n, bindI18n, onLangChange } from './i18n/i18n';

// 🧰 Panel unificado (accesibilidad + personalización + selector idioma)
import { UnifiedControlPanel } from './components/UnifiedControlPanel';

// 1) Inicializa i18n y aplica preferencias ANTES de montar la UI
initI18n();
applyA11yFromStorage();
applyThemeFromStorage();

const app = document.getElementById('app')!;

// 🔧 Limpia el splash inicial del index.html
app.innerHTML = '';

const header = document.createElement('div');
const page = document.createElement('main');
page.className = 'flex-1';
app.appendChild(header);
app.appendChild(page);

// Helper para (re)montar el navbar y traducirlo
function renderNavbarAndBind() {
  header.innerHTML = '';
  renderNavbar(header);
  bindI18n(header);
}

// Helper: crea un handler 0-args que pinta y luego traduce `page`
const wrap = (renderFn: (c: HTMLElement) => void | Promise<void>) =>
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
  register('#/play/tournament', wrap(renderTournament));
  register('#/play/threeinrow', wrap(renderPlayThreeInRow));
  register('#/game/live',       wrap(setupTournamentPong));
  register('#/play/4v4',        wrap(renderPlay4v4));
  register('#/live/4v4',        wrap(setupLive4v4));

  register('#/404', async () => {
    page.innerHTML = `<div class="p-6">
      <h1 class="text-2xl font-bold" data-i18n="common.notfound"></h1>
    </div>`;
    bindI18n(page);
  });
}

// Re-traducir/re-renderizar cuando cambie el idioma
onLangChange(() => {
  // retraducir el contenido actual de la página
  bindI18n(page);

  // si hay sesión, re-render del navbar (textos dinámicos/sin data-i18n)
  if (getCurrentUser()) {
    renderNavbarAndBind();
  }

  // si existe el panel suelto (en login), retradúcelo
  const panel = document.getElementById('unified-control-panel');
  if (panel) bindI18n(panel);
});

const user = getCurrentUser();

if (!user) {
  // ⛔️ sin navbar en login
  header.innerHTML = '';
  // Panel inferior disponible en login
  UnifiedControlPanel();
  {
    const panel = document.getElementById('unified-control-panel');
    if (panel) bindI18n(panel);
  }
  // Render de login + traducción inicial
  renderLogin(page, () => {
    // tras login
    header.innerHTML = '';
    page.innerHTML = '';
    // elimina panel inferior si existe
    document.getElementById('unified-control-panel')?.remove();
    renderNavbarAndBind();         // <— reusamos helper
    bootRoutes();
    location.hash = '#/';          // a Inicio
    startRouter();
  });
  bindI18n(page);
} else {
  // ✅ con navbar persistente
  renderNavbarAndBind();           // <— reusamos helper
  bootRoutes();
  startRouter();
}
