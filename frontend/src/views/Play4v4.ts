// src/views/Play4v4.ts

import { createUser, NewUser } from '../api';
import { getCurrentUser, getTournamentPlayers, setTournamentPlayers, clearTournamentPlayers } from '../session';
import { t, bindI18n } from '../i18n/i18n';
import { navigate } from '../router';
import { logTerminal } from '../components/IDEComponets/Terminal';
import { setupLive4v4 } from '../play/Live4v4';

const LIVE_ROUTE = '#/live/4v4';

/* ============================================================
** Utils
** ============================================================ */

function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min;}

/*
** randomColorHex
**
** Generates a readable random color for dummy avatars.
*/
function randomColorHex(): string 
{
  const h = randInt(0, 359);
  const s = 80;
  const l = 45;

  const s1 = s / 100;
  const l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;

  let r = 0, g = 0, b = 0;

  if (h < 60)
  { 
    r = c; g = x; 
  }
  else if (h < 120) 
  { 
    r = x; g = c; 
  }
  else if (h < 180) 
  { 
    g = c; b = x; 
  }
  else if (h < 240) 
  { 
    g = x; b = c; 
  }
  else if (h < 300) 
  { 
    r = x; b = c; 
  }
  else              
  { 
    r = c; 
  }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');

  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/* ============================================================
** View
** ============================================================ */

export async function renderPlay4v4(root: HTMLElement): Promise<void> 
{
  logTerminal('View: Play 4v4');

  const me = getCurrentUser();
  const locals = getTournamentPlayers().slice(0, 3); // 3 jugadores locales

  /* ---------------- RENDER ---------------- */

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">

      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold" data-i18n="tour.title">
          ${t('tour.title')}
        </h1>

        <button id="reset"
                class="text-xs px-2 py-1 rounded
                       bg-black/30 hover:bg-black/50"
                data-i18n="tour.reset">
          ${t('tour.reset')}
        </button>
      </div>

      <!-- Grid 1 fila x 4 columnas -->
      <div class="rounded-2xl bg-white/10 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${me ? youCard(me.nick, me.id, me.avatar) : waitingCard('LOGIN')}
          ${seatCard(0, locals[0])}
          ${seatCard(1, locals[1])}
          ${seatCard(2, locals[2])}
        </div>
      </div>

      <!-- Start area -->
      <div class="rounded-2xl bg-white/10 p-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold" data-i18n="game.4v4">
              ${t('game.4v4')}
            </h3>
            <p class="opacity-80 text-sm" data-i18n="tour.schema">
              ${t('tour.schema')}
            </p>
          </div>

          <button id="startBtn"
                  class="px-4 py-2 rounded
                         bg-emerald-500/80 hover:bg-emerald-600
                         text-white disabled:opacity-50
                         disabled:cursor-not-allowed"
                  data-i18n="common.startTournament">
            ${t('common.startTournament')}
          </button>
        </div>
      </div>
    </section>
  `;

  bindI18n(root);

  /* ---------------- RESET ---------------- */

  root.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', () => 
  {
    logTerminal('Tournament reset');
    clearTournamentPlayers();
    renderPlay4v4(root);
  });

  /* ---------------- CREATE LOCAL PLAYERS ---------------- */

  for (let seat = 0; seat < 3; seat++) 
  {
    const form = root.querySelector<HTMLFormElement>(`#seat-form-${seat}`);
    if (!form) 
      continue;

    const errBox = form.querySelector<HTMLDivElement>('.err')!;

    form.onsubmit = async (e) => 
    {
      e.preventDefault();
      errBox.classList.add('hidden');

      const nick = (form.querySelector('.nick') as HTMLInputElement).value.trim();
      if (!nick) 
        return;

      const initial = encodeURIComponent(nick[0]?.toUpperCase() || 'P');
      const avatar = `https://dummyimage.com/96x96/${randomColorHex()}/ffffff&text=${initial}`;

      const payload: NewUser = { nick, avatar };

      try 
      {
        const created = await createUser(payload);
        const players = getTournamentPlayers();

        while (players.length < 3)
          players.push(undefined as any);
        players[seat] = created;

        setTournamentPlayers(players.slice(0, 3));
        logTerminal(`Tournament seat ${seat} set: ${created.nick}`);
        renderPlay4v4(root);
      } 
      catch (err: any) 
      {
        errBox.textContent = err?.message || t('tour.err.create');
        errBox.classList.remove('hidden');
      }
    };
  }

  /* ---------------- CHANGE PLAYER ---------------- */

  for (let seat = 0; seat < 3; seat++) 
  {
    const btn = root.querySelector<HTMLButtonElement>(`#change-seat-${seat}`);
    if (!btn) 
      continue;
    btn.onclick = () => 
    {
      const players = getTournamentPlayers();
      players.splice(seat, 1); // compacta
      setTournamentPlayers(players);
      logTerminal(`Tournament seat ${seat} cleared`);
      renderPlay4v4(root);
    };
  }

  /* ---------------- START TOURNAMENT ---------------- */

  const startBtn = root.querySelector<HTMLButtonElement>('#startBtn');
  const localsNow = getTournamentPlayers();
  const allReady = !!me && localsNow.filter(Boolean).length === 3;

  if (startBtn) 
    startBtn.disabled = !allReady;

  startBtn?.addEventListener('click', () => 
  {
    const localsFinal = getTournamentPlayers();
    if (!me || localsFinal.filter(Boolean).length !== 3) 
      return;

    const players = [me, ...localsFinal]; sessionStorage.setItem('tournament:players', JSON.stringify(players));

    logTerminal('Tournament started');
    renderLiveTournament(root, players);
    navigate(LIVE_ROUTE);
  });
}

/* ============================================================
** Live tournament
** ============================================================ */

function renderLiveTournament(root: HTMLElement, players: { nick: string }[]): void 
{
  root.innerHTML = `
    <section class="flex flex-col min-h-0 grow p-4 gap-4 text-white">

      <div class="flex justify-between items-center
                  bg-white/10 px-6 py-3 rounded-2xl">
        <span class="font-semibold" data-i18n="game.4v4">4v4</span>
        <span class="text-lg font-bold">🏆 Pong 4v4 3D</span>
        <button id="backBtn"
                class="bg-red-500 hover:bg-red-600
                       px-4 py-1 rounded">
          ${t('common.exit')}
        </button>
      </div>

      <div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3">
        <div class="text-sm opacity-90 text-center">
          <span class="font-semibold">${players[0].nick}</span> = W / S ·
          <span class="font-semibold">${players[1].nick}</span> = I / K ·
          <span class="font-semibold">${players[2].nick}</span> = C / V ·
          <span class="font-semibold">${players[3].nick}</span> = L / Ñ
        </div>

        <div class="w-full h-full max-w-6xl max-h-[70vh]">
          <canvas id="Play4v4"
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
    logTerminal('Exit tournament');
    navigate('#');
  });
  
  // CRITICAL: Call the game setup
  requestAnimationFrame(() => setupLive4v4());
}

/* ============================================================
** UI helpers
** ============================================================ */

function baseCard(inner: string): string 
{
  return `
    <div class="relative rounded-2xl bg-white/10 p-6
                flex items-center justify-center text-center
                hover:bg-white/20 transition min-h-[200px]">
      ${inner}
    </div>
  `;
}

function youCard(nick: string, id: number, avatar: string): string 
{
  return baseCard
  (`
    <div class="w-full flex flex-col items-center justify-center">
      <div class="text-6xl mb-3">✅</div>
      <div class="flex flex-col items-center gap-3">
        <img src="${avatar}" class="w-16 h-16 rounded-full"/>
        <div class="text-center">
          <div class="font-semibold text-lg">${nick}</div>
          <div class="text-sm opacity-70">${t('common.id')} ${id}</div>
        </div>
      </div>
      <!-- Espacio invisible para alinear con las otras cartas -->
      <div class="mt-4 h-[32px]"></div>
    </div>
  `);
}

function readySeat(nick: string, id: number, avatar: string, index: number): string 
{
  return baseCard
  (`
    <div class="w-full flex flex-col items-center justify-center">
      <div class="text-6xl mb-3">✅</div>
      <div class="flex flex-col items-center gap-3">
        <img src="${avatar}" class="w-16 h-16 rounded-full"/>
        <div class="text-center">
          <div class="font-semibold text-lg">${nick}</div>
          <div class="text-sm opacity-70">${t('common.id')} ${id}</div>
        </div>
      </div>
      <button id="change-seat-${index}"
              class="mt-4 text-sm px-3 py-2 rounded
                     bg-black/40 hover:bg-black/60"
              data-i18n="pvp.changePlayer">
        ${t('pvp.changePlayer')}
      </button>
    </div>
  `);
}

function loginSeat(index: number): string 
{
  return baseCard
  (`
    <div class="w-full flex flex-col items-center justify-center">
      <form id="seat-form-${index}"
            class="w-full max-w-[280px] bg-white/90 rounded-xl p-5 shadow
                   flex flex-col gap-3">
        <div class="text-black font-semibold text-center text-lg"
             data-i18n="login.title">
          ${t('login.title')}
        </div>

        <input class="nick px-4 py-2 rounded border text-black"
               placeholder="${t('login.nick')}"
               data-i18n-attr="placeholder:login.nick"
               minlength="2" maxlength="20" required />

        <button class="px-4 py-2 rounded
                       bg-black/80 hover:bg-black text-white">
          ${t('login.submit')}
        </button>

        <div class="err text-red-600 text-xs hidden"></div>
      </form>
    </div>
  `);
}

function waitingCard(text = 'LOGIN'): string 
{
  return baseCard
  (`
    <div class="opacity-80 w-full flex flex-col items-center justify-center">
      <div class="text-6xl mb-3">⏳</div>
      <div class="px-3 py-2 rounded
                  bg-red-600/80 text-sm font-semibold inline-block">
        ${text}
      </div>
      <!-- Espacio invisible para alinear con las otras cartas -->
      <div class="mt-4 h-[32px]"></div>
    </div>
  `);
}

function seatCard(index: number, p?: { id: number; nick: string; avatar: string }): string 
{
  return p ? readySeat(p.nick, p.id, p.avatar, index) : loginSeat(index);
}
