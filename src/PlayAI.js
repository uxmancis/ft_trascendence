// src/views/PlayAI.ts
import { t, bindI18n, onLangChange } from '../i18n/i18n.js';
import { navigate } from './router.js';
const LIVE_ROUTE = '#/live/ai';
// export async function renderPlayAI()
export async function renderPlayAI(root) {
    // contentHtml = `<div class="h-full w-full bg-red-500"></div>`;
    const difficulties = [
        { id: 'easy', label: t('ai.easy') },
        { id: 'normal', label: t('ai.normal') },
        { id: 'hard', label: t('ai.hard') },
    ];
    const htmlTemplateString = `
    <div class="h-full w-full">
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
    </div>
  `;
    /*********************************PENDING TO SOLVE (from now on) **************************/
    root.innerHTML = htmlTemplateString;
    // Traducción inicial
    bindI18n(root);
    // 🔁 Re-traducir en caliente al cambiar idioma
    const off = onLangChange(() => {
        bindI18n(root);
    });
    root._cleanup = () => off();
    // Lógica de selección
    const cards = Array.from(root.querySelectorAll('[data-diff]'));
    const startArea = root.querySelector('#start-area');
    const startBtn = root.querySelector('#startBtn');
    let selected = null; /* state management: variable called 'selected' holds the
    value of the currently chosen difficulty/option (the Diff type or null if nothing was selected) */
    /* setSelected function executes every time the user clicks a
    * card or whenever the selection needs to change.*/
    function setSelected(id) {
        selected = id; /* #1 state is updated */
        /* #2 Loop: */
        cards.forEach(updateCardAppearance);
        // cards.forEach(
        //   c => {
        //   const on = c.dataset.diff === selected;
        //   c.classList.toggle('ring-4', on);
        //   c.classList.toggle('ring-emerald-400', on);
        //   c.setAttribute('aria-pressed', on ? 'true' : 'false'); /* This is for accessibility */
        //   const mark = c.querySelector('.mark');
        //   if (mark) mark.textContent = on ? '✅' : ''; 
        //   }
        // );
        const enabled = !!selected;
        startArea.classList.toggle('opacity-50', !enabled);
        startArea.classList.toggle('pointer-events-none', !enabled);
        startBtn.toggleAttribute('disabled', !enabled);
    }
    function updateCardAppearance(c) {
        const on = c.dataset.diff === selected;
        c.classList.toggle('ring-4', on);
        c.classList.toggle('ring-emerald-400', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false'); /* This is for accessibility */
        const mark = c.querySelector('.mark');
        if (mark)
            mark.textContent = on ? '✅' : '';
    }
    /* Loop */
    cards.forEach(c => {
        c.addEventListener('click', () => setSelected(c.dataset.diff));
        // Accesible: Enter/Espacio
        c.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelected(c.dataset.diff);
            }
        });
    });
    // Atajo: 1/2/3 eligen easy/normal/hard
    // window.addEventListener('keydown', (e) => {
    //   if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
    //   if (e.key === '1') setSelected('easy');
    //   if (e.key === '2') setSelected('normal');
    //   if (e.key === '3') setSelected('hard');
    // });
    // // Start → guarda settings, dibuja la pantalla de juego y arranca Babylon
    // startBtn.onclick = () => {
    //   if (!selected) return;
    //   const settings = {
    //     difficulty: selected,
    //     seed: Math.floor(Math.random() * 1e9),
    //     ts: Date.now(),
    //   };
    //   sessionStorage.setItem('ai:settings', JSON.stringify(settings));
    // root.innerHTML = `
    // <!-- Contenedor principal -->
    // <section class="mx-auto max-w-6xl p-6 grow space-y-6 text-white">
    //   <!-- Barra superior translúcida -->
    //   <div class="flex justify-between items-center mb-6 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-lg">
    //     <span>${t("ai.difficulty")}: ${selected.toUpperCase()}</span>
    //     <span> Pong 1 vs AI 🤖</span>
    //     <button id="backBtn"
    //       class="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-white transition-all">Salir</button>
    //   </div>
    //   <!-- Contenedor del juego (sin fondo negro) -->
    //   <div class="flex flex-col items-center justify-center p-4">
    //     <canvas id="pong_AI" width="800" height="500"
    //       class="shadow-xl border-4 border-white rounded-2xl backdrop-blur-md"></canvas>
    //   </div>
    // </section>
    // `;
    // Botón salir vuelve al home
    document.getElementById('backBtn')?.addEventListener('click', () => {
        navigate('#');
    });
    //   // Arranca el juego 3D
    //   setupPong();
    //   navigate(LIVE_ROUTE);
    // };
    /******************************* SOLVE TIL HERE pending ************** */
    console.log("renderPlayAI: we've made it! :)");
    return (htmlTemplateString);
}
/* ---------- UI helpers ---------- */
function cardHTML(id, label) {
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
function hintFor(id) {
    if (id === 'easy')
        return 'Bot lento, ideal para empezar.';
    if (id === 'hard')
        return 'Reacción rápida y precisión alta.';
    return 'Equilibrado para una partida estándar.';
}
