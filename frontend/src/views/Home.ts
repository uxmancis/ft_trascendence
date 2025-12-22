// src/views/Home.ts

import { navigate } from '../router';
import { t, bindI18n, onLangChange } from '../i18n/i18n';

/*
** createCard
**
** Small helper to render a VSCode-like action card.
** - id: DOM id for click binding
** - titleKey / descKey: i18n keys
*/
function createCard(id: string, titleKey: string, descKey: string): string 
{
  return `
    <button
      id="${id}"
      class="
        rounded-lg
        bg-white/5 hover:bg-white/10
        border border-white/10
        p-4 text-left
        transition
      ">
      <div class="text-lg font-medium mb-1" data-i18n="${titleKey}">
        ${t(titleKey)}
      </div>
      <p class="text-sm opacity-70" data-i18n="${descKey}">
        ${t(descKey)}
      </p>
    </button>
  `;
}

/*
** renderHome
**
** Home view of the application.
** - Shows main navigation cards
** - Binds navigation actions
** - Logs user actions to terminal
*/

export async function renderHome(root: HTMLElement): Promise<void> 
{
  /* Render layout */
  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 w-full">
      <h1
        class="text-2xl font-semibold mb-1"
        data-i18n="home.title">
        ${t('home.title')}
      </h1>

      <p
        class="text-sm opacity-70 mb-6"
        data-i18n="home.subtitle">
        ${t('home.subtitle')}
      </p>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        ${createCard('btn-ai', 'home.ai', 'home.ai.desc')}
        ${createCard('btn-1v1', 'home.1v1', 'home.1v1.desc')}
        ${createCard('btn-tournament', 'home.tournament', 'home.tournament.desc')}
        ${createCard('btn-threeinrow', 'home.threeinrow', 'home.threeinrow.desc')}
        ${createCard('btn-4v4', 'home.4v4', 'home.4v4.desc')}
      </div>
    </section>
  `;

  /* Bind navigation buttons */
  const bind = (id: string, route: string) => 
  {
    const btn = root.querySelector<HTMLButtonElement>(`#${id}`);
    if (!btn) 
        return;
    btn.onclick = () => navigate(route);
  };

  bind('btn-ai', '#/play/ai');
  bind('btn-1v1', '#/play/1v1');
  bind('btn-tournament', '#/play/tournament');
  bind('btn-threeinrow', '#/play/threeinrow');
  bind('btn-4v4', '#/play/4v4');

  /* i18n reactivity */
  bindI18n(root);
  const offLang = onLangChange(() => bindI18n(root));
  (root as any)._cleanup = () => offLang();
}
