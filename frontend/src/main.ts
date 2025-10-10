import './styles.css';
import { renderNavbar } from './components/Navbar';
import { register, startRouter } from './router';
import { renderHome } from './views/Home';
import { renderStats } from './views/Stats';
import { renderPlayAI } from './views/PlayAI';
import { renderPlay1v1 } from './views/Play1v1';
import { renderTournament } from './views/Tournament';
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

// Monta el panel unificado (evita duplicados internamente) y tradúcelo
UnifiedControlPanel();
{
  const panel = document.getElementById('unified-control-panel');
  if (panel) bindI18n(panel);
}

// Helper: crea un handler 0-args que pinta y luego traduce `page`
const wrap = (renderFn: (c: HTMLElement) => void | Promise<void>) =>
  async () => {
    await renderFn(page);
    bindI18n(page);
  };

function bootRoutes(){
  register('#/',                wrap(renderHome));
  register('#/stats',           wrap(renderStats));
  register('#/play/ai',         wrap(renderPlayAI));
  register('#/play/1v1',        wrap(renderPlay1v1));
  register('#/play/tournament', wrap(renderTournament));
  register('#/404', async () => {
    page.innerHTML = `<div class="p-6">
      <h1 class="text-2xl font-bold" data-i18n="common.notfound"></h1>
    </div>`;
    bindI18n(page);
  });
}

// Re-traducir la UI cuando cambie el idioma
onLangChange(() => {
  bindI18n(header);
  bindI18n(page);
  const panel = document.getElementById('unified-control-panel');
  if (panel) bindI18n(panel);
});

const user = getCurrentUser();

if (!user) {
  // ⛔️ sin navbar en login
  header.innerHTML = '';

  // Render de login + traducción inicial
  renderLogin(page, () => {
    // tras login
    header.innerHTML = '';
    page.innerHTML = '';
    renderNavbar(header);
    bindI18n(header); // traducir navbar
    bootRoutes();
    location.hash = '#/'; // a Inicio
    startRouter();
  });
  bindI18n(page);
} else {
  // ✅ con navbar persistente
  renderNavbar(header);
  bindI18n(header); // traducir navbar
  bootRoutes();
  startRouter();
}
