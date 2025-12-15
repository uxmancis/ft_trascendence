import { createUser, NewUser } from '../api';
import {
  getCurrentUser,
  getTournamentPlayers,
  setTournamentPlayers,
  clearTournamentPlayers
} from '../session';
import { t, bindI18n } from '../i18n/i18n';
import { navigate } from '../router';

const LIVE_ROUTE = '#/live/4v4';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomColorHex(): string {
  const h = randInt(0, 359), s = 80, l = 45;
  const s1 = s/100, l1 = l/100;
  const c = (1 - Math.abs(2*l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h/60) % 2) - 1));
  const m = l1 - c/2;
  let r=0,g=0,b=0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (n:number)=>Math.round((n+m)*255).toString(16).padStart(2,'0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export async function renderPlay4v4(root: HTMLElement){
  const me = getCurrentUser();
  let locals = getTournamentPlayers().slice(0, 3); // 3 plazas locales

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold" data-i18n="tour.title">${t('tour.title')}</h1>
        <div class="flex items-center gap-2">
          <button id="reset" class="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50" data-i18n="tour.reset">${t('tour.reset')}</button>
        </div>
      </div>

      <!-- GRID 2x2, estilo tarjetas AI -->
      <div class="rounded-2xl bg-white/10 p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4">
          <!-- TL: YOU -->
          ${me ? youCard(me.nick, me.id, me.avatar) : waitingCard('LOGIN')}

          <!-- TR / BL / BR: asientos locales -->
          ${seatCard(0, locals[0])}
          ${seatCard(1, locals[1])}
          ${seatCard(2, locals[2])}
        </div>
      </div>

      <div class="rounded-2xl bg-white/10 p-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="game.4v4">${t('game.4v4')}</h3>
            <p class="opacity-80 text-sm" data-i18n="tour.schema">${t('tour.schema')}</p>
          </div>
          <button id="startBtn"
            class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            data-i18n="common.startTournament">${t('common.startTournament')}
          </button>
        </div>
      </div>
    </section>
  `;

  bindI18n(root);

  // RESET
  root.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
    clearTournamentPlayers();
    renderPlay4v4(root);
  };

  // Formularios (3 asientos)
  for (let seat = 0; seat < 3; seat++) {
    const form = root.querySelector<HTMLFormElement>(`#seat-form-${seat}`);
    if (!form) continue;

    const errBox = form.querySelector<HTMLDivElement>('.err')!;
    form.onsubmit = async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');

      const nick = (form.querySelector('.nick') as HTMLInputElement).value.trim();
      if (!nick) return;
      const initial = encodeURIComponent((nick.charAt(0) || 'P').toUpperCase());
      const bg = randomColorHex();
      const avatar = `https://dummyimage.com/96x96/${bg}/ffffff&text=${initial}`;
      const payload: NewUser = { nick, avatar };

      try {
        const created = await createUser(payload);
        const players = getTournamentPlayers();
        while (players.length < 3) players.push(undefined as any);
        players[seat] = { id: created.id, nick: created.nick, avatar: created.avatar };
        setTournamentPlayers(players.slice(0,3));
        renderPlay4v4(root);
      } catch (err: any) {
        errBox.textContent = err?.message || t('tour.err.create');
        errBox.classList.remove('hidden');
      }
    };
  }

  // Botones "Change player"
  for (let seat = 0; seat < 3; seat++) {
    const btn = root.querySelector<HTMLButtonElement>(`#change-seat-${seat}`);
    if (!btn) continue;
    btn.onclick = () => {
      const players = getTournamentPlayers();
      players.splice(seat, 1); // compacta
      setTournamentPlayers(players);
      renderPlay4v4(root);
    };
  }

  // START
  const startBtn = root.querySelector<HTMLButtonElement>('#startBtn')!;
  const localsNow = getTournamentPlayers();
  const allReady = !!me && localsNow.filter(Boolean).length === 3;
  startBtn.disabled = !allReady;

  startBtn.onclick = () => {
    const localsNow2 = getTournamentPlayers();
    if (!me || localsNow2.filter(Boolean).length !== 3) return;
    
    const players = [me, ...localsNow2]; // [J1, J2, J3, J4]
    sessionStorage.setItem('tournament:players', JSON.stringify(players));
    location.hash = LIVE_ROUTE;
    root.innerHTML = `
      <!-- Contenedor principal -->
      <section class="mx-auto max-w-6xl p-6 grow space-y-6 text-white">

        <!-- Barra superior translúcida -->
        <div class="flex justify-between items-center mb-6 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-lg">
          <span class="font-semibold" data-i18n="game.4v4"></span>
          <span class="text-lg font-bold">🏆 Pong 4</span>
          <button id="backBtn"
            class="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-white transition-all">Salir</button>
        </div>

        <!-- Contenedor del juego -->
        <div class="flex flex-col items-center justify-center p-4 gap-3">
          <!-- 👇 INFO DE JUGADORES -->
          <div id="turn-info" class="text-sm opacity-90">
            <span class="font-semibold">${players[0]?.nick}</span> = <b>W / S</b>  ·  
            <span class="font-semibold">${players[1]?.nick}</span> = <b>↑ / ↓</b>  ·  
            <span class="font-semibold">${players[2]?.nick}</span> = <b>C / V</b>  ·  
            <span class="font-semibold">${players[3]?.nick}</span> = <b>L / Ñ</b>
        </div>
        <canvas id="Play4v4" width="550" height="550"
            class="shadow-xl border-4 border-white rounded-2xl backdrop-blur-md"></canvas>
        </div>

      </section>
    `;

    // Botón de volver
    document.getElementById("backBtn")?.addEventListener("click", () => {
      navigate("#");
    });

    navigate(LIVE_ROUTE);
  };
}

/* ============ helpers (tarjetas estilo AI) ============ */
function baseCard(inner: string) {
  return `
    <div
      class="group relative rounded-2xl bg-white/10 p-4 aspect-video flex items-center justify-center text-center
             hover:bg-white/20 focus-within:ring-4 focus-within:ring-sky-400 transition ring-0"
    >
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
          <div class="text-xs opacity-80">${t('common.id')} ${id}</div>
        </div>
      </div>
    </div>
  `);
}

function readySeat(nick: string, id: number, avatar: string, index: number) {
  return baseCard(`
    <div class="text-center">
      <div class="text-6xl mb-2">✅</div>
      <div class="flex items-center gap-3 justify-center">
        <img src="${avatar}" class="w-10 h-10 rounded-full"/>
        <div>
          <div class="font-semibold">${nick}</div>
          <div class="text-xs opacity-80">${t('common.id')} ${id}</div>
        </div>
      </div>
      <button id="change-seat-${index}" class="mt-3 text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50"
              data-i18n="pvp.changePlayer">${t('pvp.changePlayer')}</button>
    </div>
  `);
}

function loginSeat(index: number) {
  return baseCard(`
    <form id="seat-form-${index}" class="w-60 bg-white/90 rounded-xl p-4 shadow flex flex-col gap-2">
      <div class="text-center text-black font-semibold mb-1" data-i18n="login.title">${t('login.title')}</div>
      <input class="nick px-3 py-2 rounded border text-black"
             placeholder="${t('login.nick')}"
             data-i18n-attr="placeholder:login.nick"
             minlength="2" maxlength="20" required />
      <button class="px-3 py-2 rounded bg-black/80 hover:bg-black text-white text-sm"
              data-i18n="login.submit">${t('login.submit')}</button>
      <div class="err text-red-600 text-xs hidden"></div>
    </form>
  `);
}

function waitingCard(text = 'LOGIN') {
  return baseCard(`
    <div class="text-center opacity-80">
      <div class="text-4xl mb-2">⏳</div>
      <div class="px-2 py-1 rounded bg-red-600/80 text-white text-xs font-semibold">${text}</div>
    </div>
  `);
}

function seatCard(index: number, p?: {id:number; nick:string; avatar:string}) {
  if (p) return readySeat(p.nick, p.id, p.avatar, index);
  return loginSeat(index);
}
