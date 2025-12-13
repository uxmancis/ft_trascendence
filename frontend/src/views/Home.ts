import { navigate } from '../router';
import { t } from '../i18n/i18n';

export async function renderHome(root: HTMLElement){
  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow">
      <h1 class="text-3xl font-bold mb-2" data-i18n="home.title">${t('home.title')}</h1>
      <p class="opacity-80 mb-6" data-i18n="home.subtitle">${t('home.subtitle')}</p>

      <div class="grid gap-4 md:grid-cols-3">
        <!-- AI -->
        <button id="btn-ai"
          class="rounded-2xl bg-white/10 hover:bg-white/20 transition p-6 text-left shadow-lg">
          <div class="text-2xl mb-2" data-i18n="home.ai">${t('home.ai')}</div>
          <p class="opacity-80 text-sm" data-i18n="home.ai.desc">${t('home.ai.desc')}</p>
        </button>

        <!-- 1v1 -->
        <button id="btn-1v1"
          class="rounded-2xl bg-white/10 hover:bg-white/20 transition p-6 text-left shadow-lg">
          <div class="text-2xl mb-2" data-i18n="home.1v1">${t('home.1v1')}</div>
          <p class="opacity-80 text-sm" data-i18n="home.1v1.desc">${t('home.1v1.desc')}</p>
        </button>

        <!-- Torneo -->
        <button id="btn-tournament"
          class="rounded-2xl bg-white/10 hover:bg-white/20 transition p-6 text-left shadow-lg">
          <div class="text-2xl mb-2" data-i18n="home.tournament">${t('home.tournament')}</div>
          <p class="opacity-80 text-sm" data-i18n="home.tournament.desc">${t('home.tournament.desc')}</p>
        </button>

        <!-- Tres en raya -->
        <button id="btn-threeinrow"
          class="rounded-2xl bg-white/10 hover:bg-white/20 transition p-6 text-left shadow-lg">
          <div class="text-2xl mb-2" data-i18n="home.threeinrow">${t('home.threeinrow')}</div>
          <p class="opacity-80 text-sm" data-i18n="home.threeinrow.desc">${t('home.threeinrow.desc')}</p>
        </button>

        <!-- 4v4 -->
        <button id="btn-4v4"
          class="rounded-2xl bg-white/10 hover:bg-white/20 transition p-6 text-left shadow-lg">
          <div class="text-2xl mb-2" data-i18n="home.4v4">${t('home.4v4')}</div>
          <p class="opacity-80 text-sm" data-i18n="home.4v4.desc">${t('home.4v4.desc')}</p>
        </button>
      </div>
    </section>
  `;

  root.querySelector<HTMLButtonElement>('#btn-ai')!.onclick = () => navigate('#/play/ai');
  root.querySelector<HTMLButtonElement>('#btn-1v1')!.onclick = () => navigate('#/play/1v1');
  root.querySelector<HTMLButtonElement>('#btn-tournament')!.onclick = () => navigate('#/play/tournament');
  root.querySelector<HTMLButtonElement>('#btn-threeinrow')!.onclick = () => navigate('#/play/threeinrow');
  root.querySelector<HTMLButtonElement>('#btn-4v4')!.onclick = () => navigate('#/play/4v4');
}
