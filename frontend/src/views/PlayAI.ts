// src/views/PlayAI.ts
import { t, bindI18n, onLangChange } from '../i18n/i18n';
import { navigate } from '../router';

const LIVE_ROUTE = '#/live/ai'; // cambia si usas otra ruta (p.ej. '#/game/live')

type Diff = 'easy' | 'normal' | 'hard';

export async function renderPlayAI(root: HTMLElement) {
  const difficulties: { id: Diff; label: string }[] = [
    { id: 'easy',   label: t('ai.easy') },
    { id: 'normal', label: t('ai.normal') },
    { id: 'hard',   label: t('ai.hard') },
  ];

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <h1 class="text-2xl font-bold" data-i18n="ai.title">${t('ai.title')}</h1>

      <!-- Tarjetas de dificultad -->
      <div id="cards" class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        ${difficulties.map(d => cardHTML(d.id, d.label)).join('')}
      </div>

      <!-- CTA -->
      <div id="start-area" class="rounded-2xl bg-white/10 p-4 opacity-50 pointer-events-none">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="common.readyToPlay">${t('common.readyToPlay')}</h3>
            <p class="opacity-80 text-sm" data-i18n="ai.difficulty">${t('ai.difficulty')}</p>
          </div>
          <button id="startBtn"
            class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            data-i18n="ai.start">${t('ai.start')}</button>
        </div>
      </div>
    </section>
  `;

  // Traducción inicial
  bindI18n(root);

  // 🔁 Re-traducir en caliente al cambiar idioma
  const off = onLangChange(() => {
    bindI18n(root);
  });
  (root as any)._cleanup = () => off();

  // Lógica de selección
  const cards = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-diff]'));
  const startArea = root.querySelector<HTMLDivElement>('#start-area')!;
  const startBtn = root.querySelector<HTMLButtonElement>('#startBtn')!;

  let selected: Diff | null = null;

  function setSelected(id: Diff | null) {
    selected = id;
    cards.forEach(c => {
      const on = c.dataset.diff === selected;
      c.classList.toggle('ring-4', on);
      c.classList.toggle('ring-emerald-400', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
      const mark = c.querySelector('.mark');
      if (mark) mark.textContent = on ? '✅' : '';
    });
    const enabled = !!selected;
    startArea.classList.toggle('opacity-50', !enabled);
    startArea.classList.toggle('pointer-events-none', !enabled);
    startBtn.toggleAttribute('disabled', !enabled);
  }

  cards.forEach(c => {
    c.addEventListener('click', () => setSelected(c.dataset.diff as Diff));
    // Accesible: Enter/Espacio
    c.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setSelected(c.dataset.diff as Diff);
      }
    });
  });

  // Atajo: 1/2/3 eligen easy/normal/hard
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === '1') setSelected('easy');
    if (e.key === '2') setSelected('normal');
    if (e.key === '3') setSelected('hard');
  });

  // Start → guarda settings y navega
  startBtn.onclick = () => {
    if (!selected) return;
    const settings = {
      difficulty: selected,
      seed: Math.floor(Math.random() * 1e9),
      ts: Date.now(),
    };
    sessionStorage.setItem('ai:settings', JSON.stringify(settings));
    root.innerHTML = `
    <div class="flex flex-col items-center justify-center h-screen bg-black">
      <div id="player-names" class="text-white text-2xl font-bold mb-4">
        ¡Ready to play! 1 VS AI
      </div>
      <canvas id="pong_AI" width="800" height="500" class="shadow-lg border-4 border-white rounded-lg"></canvas>
    </div>
    `;
    navigate(LIVE_ROUTE);
  };
}

/* ---------- UI helpers ---------- */
function cardHTML(id: Diff, label: string) {
  return `
    <button
      type="button"
      data-diff="${id}"
      class="group relative rounded-2xl bg-white/10 p-4 aspect-video flex items-center justify-center text-center
             hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 transition ring-0"
      aria-pressed="false"
    >
      <div class="absolute top-2 right-3 text-2xl mark" aria-hidden="true"></div>
      <div class="space-y-1">
        <div class="text-lg font-semibold" data-i18n="ai.${id}">${t(`ai.${id}`)}</div>
        <div class="text-xs opacity-75">${hintFor(id)}</div>
      </div>
    </button>
  `;
}

function hintFor(id: Diff) {
  if (id === 'easy') return 'Bot lento, ideal para empezar.';
  if (id === 'hard') return 'Reacción rápida y precisión alta.';
  return 'Equilibrado para una partida estándar.';
}
