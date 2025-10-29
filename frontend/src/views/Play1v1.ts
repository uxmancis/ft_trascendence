// src/views/Play1v1.ts
import { createUser, NewUser } from '../api';
import { getCurrentUser, getLocalP2, setLocalP2 } from '../session';
import { navigate } from '../router';
import { t, bindI18n } from '../i18n/i18n';
import { setupLivePong3D } from './Live1v1'; // ← mantiene tu import/estructura

const LIVE_ROUTE = '#/live/1v1';

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomColorHex(): string {
  const h = randInt(0, 359), s = 80, l = 45;
  const s1 = s / 100, l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; } else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
  const toHex = (n:number)=>Math.round((n+m)*255).toString(16).padStart(2,'0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function renderPlay1v1(root: HTMLElement) {
  const me = getCurrentUser();
  const p2 = getLocalP2();

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <h1 class="text-2xl font-bold" data-i18n="pvp.title">${t('pvp.title')}</h1>

      <div class="rounded-2xl bg-white/10 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${me ? youCard(me.nick, me.id, me.avatar) : waitingCard()}
          ${p2 ? readyCard(p2.nick, p2.id, p2.avatar) : loginCard()}
        </div>
      </div>

      <div id="start-area" class="rounded-2xl bg-white/10 p-4 ${p2 ? '' : 'opacity-50 pointer-events-none'}">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="common.readyToPlay">${t('common.readyToPlay')}</h3>
            <p class="opacity-80 text-sm" data-i18n="common.whenBothReady">${t('common.whenBothReady')}</p>
          </div>
          <button id="startBtn" class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white"
            data-i18n="common.startMatch">${t('common.startMatch')}</button>
        </div>
      </div>
    </section>
  `;

  bindI18n(root);

  const change = root.querySelector<HTMLButtonElement>('#changeP2');
  if (change) change.onclick = () => { localStorage.removeItem('pong:local:p2'); renderPlay1v1(root); };

  const form = root.querySelector<HTMLFormElement>('#p2-form');
  if (form) {
    const errBox = form.querySelector<HTMLDivElement>('#err')!;
    form.onsubmit = async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');
      const nick = (form.querySelector('#p2-nick') as HTMLInputElement).value.trim();
      const initial = encodeURIComponent((nick.charAt(0) || 'P').toUpperCase());
      const bg = randomColorHex();
      const avatar = `https://dummyimage.com/96x96/${bg}/ffffff&text=${initial}`;
      const payload: NewUser = { nick, avatar };
      try {
        const created = await createUser(payload);
        setLocalP2({ id: created.id, nick: created.nick, avatar: created.avatar });
        renderPlay1v1(root);
      } catch (err: any) {
        errBox.textContent = err?.message || t('pvp.err.createP2');
        errBox.classList.remove('hidden');
      }
    };
  }

  const startBtn = root.querySelector<HTMLButtonElement>('#startBtn')!;
  startBtn.onclick = () => {
    const p2Now = getLocalP2();
    if (!me || !p2Now) return;
    sessionStorage.setItem('pvp:players', JSON.stringify([me, p2Now]));

    root.innerHTML = `
      <section class="mx-auto max-w-6xl p-6 grow space-y-6 text-white">
        <div class="flex justify-between items-center mb-6 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-lg">
          <span class="font-semibold">${t('pvp.title')}</span>
          <span class="text-lg font-bold">🎮 Pong 1 VS 1 (3D)</span>
          <button id="backBtn" class="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-white transition-all">Salir</button>
        </div>
        <div class="flex flex-col items-center justify-center p-4">
          <canvas id="live_pong" width="800" height="500" class="shadow-xl border-4 border-white rounded-2xl backdrop-blur-md"></canvas>
        </div>
      </section>
    `;

    document.getElementById("backBtn")?.addEventListener("click", () => { navigate("#"); });

    requestAnimationFrame(() => {
      const c = document.getElementById('live_pong') as HTMLCanvasElement | null;
      if (c) {
        if (!c.style.width)  c.style.width  = `${c.width}px`;
        if (!c.style.height) c.style.height = `${c.height}px`;
        setupLivePong3D();
      }
    });

    navigate(LIVE_ROUTE);
  };
}

/* ---------- UI helpers ---------- */
function baseCard(inner: string) {
  return `
    <div class="group relative rounded-2xl bg-white/10 p-4 aspect-video flex items-center justify-center text-center
                hover:bg-white/20 focus-within:ring-4 focus-within:ring-sky-400 transition ring-0">
      <div class="absolute top-2 right-3 text-2xl mark" aria-hidden="true"></div>
      ${inner}
    </div>
  `;
}
function youCard(nick: string, id: number, avatar: string) {
  return baseCard(`
    <div class="text-center">
      <div class="text-6xl mb-2">✅</div>
      <div class="flex items-center gap-3 justify-center">
        <img src="${avatar}" class="w-10 h-10 rounded-full"/>
        <div>
          <div class="font-semibold">${nick}</div>
          <div class="text-xs opacity-80">${id}</div>
        </div>
      </div>
    </div>
  `);
}
function readyCard(nick: string, id: number, avatar: string) {
  return baseCard(`
    <div class="text-center">
      <div class="text-6xl mb-2">✅</div>
      <div class="flex items-center gap-3 justify-center">
        <img src="${avatar}" class="w-10 h-10 rounded-full"/>
        <div>
          <div class="font-semibold">${nick}</div>
          <div class="text-xs opacity-80">${id}</div>
        </div>
      </div>
      <button id="changeP2" class="mt-3 text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50" data-i18n="pvp.changePlayer">
        Cambiar jugador
      </button>
    </div>
  `);
}
function waitingCard() {
  return baseCard(`
    <div class="text-center opacity-80">
      <div class="text-4xl mb-2">⏳</div>
      <div class="px-2 py-1 rounded bg-red-600/80 text-white text-xs font-semibold">LOGIN</div>
    </div>
  `);
}
function loginCard() {
  return baseCard(`
    <form id="p2-form" class="w-60 bg-white/90 rounded-xl p-4 shadow flex flex-col gap-2">
      <div class="text-center text-black font-semibold mb-1">Iniciar jugador 2</div>
      <input id="p2-nick" class="px-3 py-2 rounded border text-black" placeholder="Nick" minlength="2" maxlength="20" required />
      <button class="px-3 py-2 rounded bg-black/80 hover:bg-black text-white text-sm">Crear</button>
      <div id="err" class="text-red-600 text-xs hidden"></div>
    </form>
  `);
}
