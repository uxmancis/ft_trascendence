// src/views/Play1v1.ts

import { createUser, NewUser } from '../api';
import { getCurrentUser, getLocalP2, setLocalP2, clearLocalP2 } from '../session';
import { navigate } from '../router';
import { t, bindI18n } from '../i18n/i18n';
import { setupLivePong3D } from '../play/Live1v1';
import { logTerminal } from '../components/IDEComponets/Terminal';

const LIVE_ROUTE = '#/live/1v1';

/* ============================================================
** Utils
** ============================================================ */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomColorHex(): string {
  const h = randInt(0, 359);
  const s = 80;
  const l = 45;

  const s1 = s / 100;
  const l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;

  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; }

  const toHex = (n: number) =>
    Math.round((n + m) * 255).toString(16).padStart(2, '0');

  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/* ============================================================
** View
** ============================================================ */

export async function renderPlay1v1(root: HTMLElement): Promise<void> {
  logTerminal('View: Play 1v1');

  const me = getCurrentUser();
  const p2 = getLocalP2();

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <h1 class="text-2xl font-bold" data-i18n="pvp.title">
        ${t('pvp.title')}
      </h1>

      <div class="rounded-2xl bg-white/10 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${me ? youCard(me.nick, me.id, me.avatar) : waitingCard()}
          ${p2 ? readyCard(p2.nick, p2.id, p2.avatar) : loginCard()}
        </div>
      </div>

      <div id="start-area"
           class="rounded-2xl bg-white/10 p-4
                  ${p2 ? '' : 'opacity-50 pointer-events-none'}">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="common.readyToPlay">
              ${t('common.readyToPlay')}
            </h3>
            <p class="opacity-80 text-sm" data-i18n="common.whenBothReady">
              ${t('common.whenBothReady')}
            </p>
          </div>
          <button id="startBtn"
                  class="px-4 py-2 rounded
                         bg-emerald-500/80 hover:bg-emerald-600 text-white"
                  data-i18n="common.startMatch">
            ${t('common.startMatch')}
          </button>
        </div>
      </div>
    </section>
  `;

  bindI18n(root);

  const changeBtn = root.querySelector<HTMLButtonElement>('#changeP2');
  if (changeBtn) {
    changeBtn.onclick = () => {
      clearLocalP2();
      logTerminal('P2 cleared');
      renderPlay1v1(root);
    };
  }

  const form = root.querySelector<HTMLFormElement>('#p2-form');
  if (form) {
    const errBox = form.querySelector<HTMLDivElement>('#err')!;

    form.onsubmit = async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');

      const nick = (form.querySelector('#p2-nick') as HTMLInputElement).value.trim();
      const initial = encodeURIComponent(nick[0]?.toUpperCase() || 'P');
      const bg = randomColorHex();
      const avatar = `https://dummyimage.com/96x96/${bg}/ffffff&text=${initial}`;

      try {
        const created = await createUser({ nick, avatar });
        setLocalP2(created);
        logTerminal(`P2 created: ${created.nick}`);
        renderPlay1v1(root);
      } catch (err: any) {
        errBox.textContent = err?.message || t('pvp.err.createP2');
        errBox.classList.remove('hidden');
      }
    };
  }

  root.querySelector('#startBtn')?.addEventListener('click', () => {
    if (!me || !getLocalP2()) return;

    logTerminal('Starting 1v1 match');
    renderLiveMatch(root);
    navigate(LIVE_ROUTE);
  });
}

/* ============================================================
** Live match
** ============================================================ */

function renderLiveMatch(root: HTMLElement): void {
  root.innerHTML = `
    <section class="flex flex-col min-h-0 grow p-4 gap-4 text-white">
      <div class="flex justify-between items-center
                  bg-white/10 px-6 py-3 rounded-2xl">
        <span class="font-semibold">1v1</span>
        <span class="text-lg font-bold">🎮 Pong 3D</span>
        <button id="backBtn"
                class="bg-red-500 hover:bg-red-600
                       px-4 py-1 rounded">
          Salir
        </button>
      </div>

      <div class="flex-1 min-h-0 flex items-center justify-center">
        <div class="w-full h-full max-w-6xl max-h-[70vh]">
          <canvas
            id="live_pong"
            class="w-full h-full block
                   border-4 border-white
                   rounded-2xl shadow-xl">
          </canvas>
        </div>
      </div>
    </section>
  `;

  document.getElementById('backBtn')?.addEventListener('click', () => {
    logTerminal('Exit live match');
    navigate('#');
  });

  requestAnimationFrame(() => setupLivePong3D());
}

/* ============================================================
** UI helpers
** ============================================================ */

function baseCard(inner: string): string {
  return `
    <div class="relative rounded-2xl bg-white/10 p-4 aspect-video
                flex items-center justify-center text-center">
      ${inner}
    </div>
  `;
}

function youCard(nick: string, id: number, avatar: string): string {
  return baseCard(`
    <div>
      <div class="text-5xl mb-2">✅</div>
      <div class="flex items-center gap-3 justify-center">
        <img src="${avatar}" class="w-10 h-10 rounded-full"/>
        <div>
          <div class="font-semibold">${nick}</div>
          <div class="text-xs opacity-70">${id}</div>
        </div>
      </div>
    </div>
  `);
}

function readyCard(nick: string, id: number, avatar: string): string {
  return baseCard(`
    <div>
      <div class="text-5xl mb-2">✅</div>
      <div class="flex items-center gap-3 justify-center">
        <img src="${avatar}" class="w-10 h-10 rounded-full"/>
        <div>
          <div class="font-semibold">${nick}</div>
          <div class="text-xs opacity-70">${id}</div>
        </div>
      </div>
      <button id="changeP2"
              class="mt-3 text-xs px-2 py-1 rounded
                     bg-black/40 hover:bg-black/60">
        Cambiar jugador
      </button>
    </div>
  `);
}

function waitingCard(): string {
  return baseCard(`
    <div class="opacity-80">
      <div class="text-4xl mb-2">⏳</div>
      <div class="px-2 py-1 rounded bg-red-600/80 text-xs font-semibold">
        LOGIN
      </div>
    </div>
  `);
}

function loginCard(): string {
  return baseCard(`
    <form id="p2-form"
          class="w-60 bg-white/90 rounded-xl p-4 shadow
                 flex flex-col gap-2">
      <div class="text-black font-semibold text-center">Jugador 2</div>
      <input id="p2-nick"
             class="px-3 py-2 rounded border text-black"
             placeholder="Nick"
             minlength="2" maxlength="20" required />
      <button class="px-3 py-2 rounded
                     bg-black/80 hover:bg-black text-white">
        Crear
      </button>
      <div id="err" class="text-red-600 text-xs hidden"></div>
    </form>
  `);
}
