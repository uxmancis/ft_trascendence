// src/views/PlayAI.ts

import { t, bindI18n, onLangChange } from '../i18n/i18n';
import { navigate } from '../router';
import { setupPong } from '../play/LiveAI';
import { logTerminal } from '../components/IDEComponets/Terminal';

const LIVE_ROUTE = '#/live/ai';

export type Diff = 'easy' | 'normal' | 'hard';

/* ============================================================
** View
** ============================================================ */

export async function renderPlayAI(root: HTMLElement): Promise<void>
{
  logTerminal('View: Play AI');

  const difficulties: { id: Diff; label: string }[] = 
  [
    { id: 'easy',   label: t('ai.easy') },
    { id: 'normal', label: t('ai.normal') },
    { id: 'hard',   label: t('ai.hard') },
  ];

  /* ---------------- RENDER ---------------- */

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">

      <h1 class="text-2xl font-bold" data-i18n="ai.title">
        ${t('ai.title')}
      </h1>

      <!-- Difficulty cards -->
      <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        ${difficulties.map(d => cardHTML(d.id, d.label)).join('')}
      </div>

      <!-- Start area -->
      <div id="start-area"
           class="rounded-2xl bg-white/10 p-4
                  opacity-50 pointer-events-none">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="common.readyToPlay">
              ${t('common.readyToPlay')}
            </h3>
            <p class="opacity-80 text-sm" data-i18n="ai.difficulty">
              ${t('ai.difficulty')}
            </p>
          </div>

          <button id="startBtn"
                  class="px-4 py-2 rounded
                         bg-emerald-500/80 hover:bg-emerald-600
                         text-white disabled:opacity-50
                         disabled:cursor-not-allowed"
                  disabled
                  data-i18n="ai.start">
            ${t('ai.start')}
          </button>
        </div>
      </div>
    </section>
  `;

  /* ---------------- I18N ---------------- */

  bindI18n(root);

  const offLang = onLangChange(() => bindI18n(root));
  (root as any)._cleanup = () => offLang();

  /* ---------------- SELECTION LOGIC ---------------- */

  const cards = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-diff]'));

  const startArea = root.querySelector<HTMLDivElement>('#start-area')!;
  const startBtn = root.querySelector<HTMLButtonElement>('#startBtn')!;

  let selected: Diff | null = null;

  function setSelected(id: Diff | null): void
  {
    selected = id;

    cards.forEach(card => 
    {
      const active = card.dataset.diff === selected;
      card.classList.toggle('ring-4', active);
      card.classList.toggle('ring-emerald-400', active);
      card.setAttribute('aria-pressed', active ? 'true' : 'false');

      const mark = card.querySelector('.mark');
      if (mark) 
        mark.textContent = active ? '✅' : '';
    });

    const enabled = !!selected;
    startArea.classList.toggle('opacity-50', !enabled);
    startArea.classList.toggle('pointer-events-none', !enabled);
    startBtn.toggleAttribute('disabled', !enabled);
  }

  cards.forEach(card => 
  {
    card.addEventListener('click', () => setSelected(card.dataset.diff as Diff));

    /* Keyboard accessibility */
    card.addEventListener('keydown', (e) => 
    {
      if (e.key === 'Enter' || e.key === ' ') 
      {
        e.preventDefault();
        setSelected(card.dataset.diff as Diff);
      }
    });
  });

  /* Shortcuts: 1 / 2 / 3 */
  window.addEventListener('keydown', (e) => 
  {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') 
      return;
    if (e.key === '1') 
      setSelected('easy');
    if (e.key === '2') 
      setSelected('normal');
    if (e.key === '3') 
      setSelected('hard');
  });

  /* ---------------- START GAME ---------------- */

  startBtn.onclick = () => 
  {
    if (!selected) 
      return;

    const settings = 
    {
      difficulty: selected,
      seed: Math.floor(Math.random() * 1e9),
      ts: Date.now(),
    };

    sessionStorage.setItem('ai:settings', JSON.stringify(settings));
    logTerminal(`AI start (${selected})`);

    renderLiveAI(root, selected);
    navigate(LIVE_ROUTE);
  };
}

/* ============================================================
** Live AI view
** ============================================================ */

function renderLiveAI(root: HTMLElement, diff: Diff): void
{
  root.innerHTML = `
    <section class="flex flex-col min-h-0 grow p-4 gap-4 text-white">

      <div class="flex justify-between items-center
                  bg-white/10 px-6 py-3 rounded-2xl">
        <span class="font-semibold">${t('ai.difficulty')}: ${diff.toUpperCase()}</span>
        <span class="text-lg font-bold">🤖 Pong AI</span>
        <button id="backBtn"
                class="bg-red-500 hover:bg-red-600
                       px-4 py-1 rounded">
          ${t('common.exit')}
        </button>
      </div>

      <div class="flex-1 min-h-0 flex items-center justify-center">
        <div class="w-full h-full max-w-6xl max-h-[70vh]">
          <canvas id="pong_AI"
                  class="w-full h-full block
                         border-4 border-white
                         rounded-2xl shadow-xl">
          </canvas>
        </div>
      </div>
    </section>
  `;

  document.getElementById('backBtn')?.addEventListener('click', () => 
  {
    logTerminal('Exit AI match');
    navigate('#');
  });

  setupPong();
}

/* ============================================================
** UI helpers
** ============================================================ */

function cardHTML(id: Diff, label: string): string
{
  return `
    <button type="button"
            data-diff="${id}"
            class="group relative rounded-2xl bg-white/10 p-4
                   aspect-video flex items-center justify-center
                   text-center hover:bg-white/20
                   focus-visible:ring-4 focus-visible:ring-sky-400
                   transition"
            aria-pressed="false">

      <div class="absolute top-2 right-3 text-2xl mark"
           aria-hidden="true"></div>

      <div class="space-y-1">
        <div class="text-lg font-semibold"
             data-i18n="ai.${id}">
          ${label}
        </div>
        <div class="text-xs opacity-75">
          ${hintFor(id)}
        </div>
      </div>
    </button>
  `;
}

function hintFor(id: Diff): string
{
  if (id === 'easy')
    return 'Bot lento, ideal para empezar.';
  if (id === 'hard')
    return 'Reacción rápida y alta precisión.';
  return 'Equilibrado para una partida estándar.';
}
