// src/views/Tournament.ts
import { createUser, type NewUser } from '../api';
import {
  getCurrentUser,
  getTournamentPlayers,
  setTournamentPlayers,
  clearTournamentPlayers,
} from '../session';
import { t, bindI18n } from '../i18n/i18n';
import { setupLivePong3D } from './Live1v1'; // usamos tu engine 1v1 3D

type SessionUser = { id: number; nick: string; avatar?: string };

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;

// ==== Claves compartidas con el engine ====
const T_MODE_KEY = 'tournament:mode';                  // '1' durante un partido del torneo
const T_MATCH_PLAYERS_KEY = 'tournament:matchPlayers'; // { p1, p2 }
const T_LAST_RESULT_KEY = 'tournament:lastResult';     // { finished_at, p1, p2, winner_id }

// ==== Estado del torneo (solo sessionStorage) ====
const STATE_KEY = 'tournament:state';
const PLAYERS_KEY = 'tournament:players'; // roster visible para reinicios

type Pairing = { p1: SessionUser; p2: SessionUser | null }; // null => BYE
type TourState = {
  round: number;
  queue: Pairing[];       // emparejamientos de la ronda actual
  currentIndex: number;   // índice del match pendiente en la ronda
  winners: SessionUser[]; // acumulador de ganadores para la siguiente ronda
  started: boolean;
};

function saveState(s: TourState) { sessionStorage.setItem(STATE_KEY, JSON.stringify(s)); }
function loadState(): TourState | null {
  try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null'); } catch { return null; }
}
function clearState() {
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(T_LAST_RESULT_KEY);
  sessionStorage.removeItem(T_MODE_KEY);
  sessionStorage.removeItem(T_MATCH_PLAYERS_KEY);
}

// ==== Utilidades ====
function shuffle<T>(a: T[]): T[] {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeRound(players: SessionUser[]): Pairing[] {
  const arr = players.slice();
  if (arr.length % 2 === 1) arr.push(null as any); // BYE
  const res: Pairing[] = [];
  for (let i = 0; i < arr.length; i += 2) {
    res.push({ p1: arr[i]!, p2: arr[i + 1] || null });
  }
  return res;
}

function startTournament(withPlayers: SessionUser[]): TourState {
  const shuffled = shuffle(withPlayers);
  const queue = makeRound(shuffled);
  const s: TourState = { round: 1, queue, currentIndex: 0, winners: [], started: true };
  saveState(s);
  return s;
}

function getNextPairing(s: TourState): Pairing | null {
  if (!s.started) return null;
  if (s.currentIndex >= s.queue.length) return null;
  return s.queue[s.currentIndex]!;
}

function applyByeAdvance(s: TourState, byeWinner: SessionUser) {
  s.winners.push(byeWinner);
  s.currentIndex++;
  if (s.currentIndex >= s.queue.length) {
    if (s.winners.length <= 1) {
      s.started = false; // campeón decidido
    } else {
      s.round++;
      s.queue = makeRound(s.winners);
      s.currentIndex = 0;
      s.winners = [];
    }
  }
  saveState(s);
}

function applyMatchResult(s: TourState, winnerId: number) {
  const pair = s.queue[s.currentIndex]!;
  const winner =
    pair.p1.id === winnerId ? pair.p1 :
    (pair.p2 && pair.p2.id === winnerId ? pair.p2 : null);
  if (!winner) return;

  s.winners.push(winner);
  s.currentIndex++;

  if (s.currentIndex >= s.queue.length) {
    if (s.winners.length <= 1) {
      s.started = false; // campeón
    } else {
      s.round++;
      s.queue = makeRound(s.winners);
      s.currentIndex = 0;
      s.winners = [];
    }
  }
  saveState(s);
}

/* ===================== UI principal ===================== */
export async function renderTournament(root: HTMLElement) {
  const me = getCurrentUser();
  let locals = getTournamentPlayers().filter(Boolean);

  // 1) ¿Hay resultado pendiente publicado por el engine?
  const pending = sessionStorage.getItem(T_LAST_RESULT_KEY);
  if (pending) {
    const res = JSON.parse(pending);
    const s = loadState();
    if (s && s.started) {
      const pair = getNextPairing(s);
      if (pair && pair.p2) {
        // El engine guarda { p1: {id...}, p2: {id...}, winner_id }
        const expectedIds = [pair.p1.id, pair.p2.id];
        const resultIds = [res?.p1?.id, res?.p2?.id];
        const sameMatch =
          expectedIds.length === resultIds.length &&
          expectedIds.every(id => resultIds.includes(id));

        if (sameMatch && typeof res?.winner_id === 'number') {
          applyMatchResult(s, res.winner_id);
        }
      }
    }
    sessionStorage.removeItem(T_LAST_RESULT_KEY);
    // limpiamos modo torneo por si seguía activo
    sessionStorage.removeItem(T_MODE_KEY);
    sessionStorage.removeItem(T_MATCH_PLAYERS_KEY);
  }

  const s = loadState();

  // 2) Constructor de jugadores (si no ha empezado)
  if (!s || !s.started) {
    const players = [me, ...locals].filter(Boolean) as SessionUser[];

    root.innerHTML = `
      <section class="mx-auto max-w-6xl p-6 grow space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">🏆 ${t('tour.title')}</h1>
          <div class="flex items-center gap-2">
            <button id="reset" class="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50">${t('tour.reset')}</button>
          </div>
        </div>

        <div class="rounded-2xl bg-white/10 p-4 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold">${t('tour.ready')}</h3>
              <p class="opacity-80 text-sm">Min ${MIN_PLAYERS} · Max ${MAX_PLAYERS} · 1vs1 knockout</p>
            </div>
            <form id="add-form" class="flex items-center gap-2">
              <input id="nick" class="px-3 py-2 rounded border text-black"
                     placeholder="${t('login.nick')}" minlength="2" maxlength="20" required />
              <button class="px-3 py-2 rounded bg-black/80 hover:bg-black text-white text-sm">
                ${t('login.submit')}
              </button>
            </form>
          </div>

          <ul id="list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            ${players.map(p => liPlayer(p, !!me && p.id === me.id)).join('')}
          </ul>

          <div class="flex items-center justify-between pt-2">
            <div class="text-sm opacity-80">
              ${t('tour.schema')} — ${t('common.players')}: ${players.length}
            </div>
            <button id="startBtn"
              class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              ${players.length < MIN_PLAYERS ? 'disabled' : ''}>
              ${t('common.startTournament')}
            </button>
          </div>
        </div>
      </section>
    `;

    bindI18n(root);

    // reset
    root.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
      clearTournamentPlayers();
      clearState();
      renderTournament(root);
    };

    // eliminar jugador (no eliminamos a "me")
    root.querySelectorAll<HTMLButtonElement>('.rm').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.dataset.id);
        if (me && id === me.id) return;
        const arr = [me, ...getTournamentPlayers().filter(Boolean)] as SessionUser[];
        const next = arr.filter(p => p.id !== id);
        const localsNew = next.slice(1);
        setTournamentPlayers(localsNew as any);
        renderTournament(root);
      };
    });

    // añadir jugador (vía API)
    const form = root.querySelector<HTMLFormElement>('#add-form')!;
    form.onsubmit = async (e) => {
      e.preventDefault();
      const nick = (form.querySelector<HTMLInputElement>('#nick')!.value || '').trim();
      if (!nick) return;
      const initial = encodeURIComponent((nick.charAt(0) || 'P').toUpperCase());
      const avatar = `https://dummyimage.com/96x96/0aa15c/ffffff&text=${initial}`;
      const payload: NewUser = { nick, avatar };
      try {
        const created = await createUser(payload);
        const current = [me, ...getTournamentPlayers().filter(Boolean)] as SessionUser[];
        if (current.length >= MAX_PLAYERS) return;
        const localsNew = [...current.slice(1), { id: created.id, nick: created.nick, avatar: created.avatar }];
        setTournamentPlayers(localsNew as any);
        renderTournament(root);
      } catch (err) {
        console.error(err);
      }
    };

    // start
    root.querySelector<HTMLButtonElement>('#startBtn')!.onclick = () => {
      const current = [me, ...getTournamentPlayers().filter(Boolean)] as SessionUser[];
      if (current.length < MIN_PLAYERS) return;
      startTournament(current);
      sessionStorage.setItem(PLAYERS_KEY, JSON.stringify(current));
      renderTournament(root);
    };

    return;
  }

  // 3) Bracket en curso
  const next = getNextPairing(s);
  const totalThisRound = s.queue.length;
  const idxHuman = s.currentIndex + 1;

  const byesPending = next && !next.p2;
  const canStart = next && !!next.p2;

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">🏆 ${t('tour.title')} • Round ${s.round}</h1>
        <div class="flex items-center gap-2">
          <button id="reset" class="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50">${t('tour.reset')}</button>
        </div>
      </div>

      <div class="rounded-2xl bg-white/10 p-4 space-y-4">
        ${
          next
            ? `
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="opacity-80 text-sm">Match ${idxHuman} / ${totalThisRound}</div>
              <h3 class="font-semibold text-lg">${next.p1.nick} ${next.p2 ? 'vs' : ''} ${next.p2 ? next.p2.nick : '(BYE)'}</h3>
            </div>
            <div class="flex items-center gap-2">
              ${
                byesPending
                  ? `<button id="advanceBye" class="px-4 py-2 rounded bg-amber-500/80 hover:bg-amber-600 text-white">Advance (BYE)</button>`
                  : `<button id="startMatch" class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white">Start match</button>`
              }
            </div>
          </div>
          `
            : `
          <div class="text-center py-8">
            <div class="text-3xl mb-2">🏆</div>
            <div class="font-semibold">Champion decided</div>
            <div class="opacity-80 text-sm">Reset to start a new tournament</div>
          </div>
          `
        }
      </div>

      <!-- Cola visual de la ronda -->
      <div class="rounded-2xl bg-white/10 p-4">
        <h4 class="font-semibold mb-3">Round ${s.round} bracket</h4>
        <ol class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          ${s.queue.map((q, i) => itemMatch(q, i, s.currentIndex)).join('')}
        </ol>
      </div>
    </section>
  `;

  bindI18n(root);

  // Reset torneo
  root.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
    clearTournamentPlayers();
    clearState();
    renderTournament(root);
  };

  // Avanzar BYE
  if (byesPending) {
    root.querySelector<HTMLButtonElement>('#advanceBye')!.onclick = () => {
      applyByeAdvance(s, next!.p1);
      renderTournament(root);
    };
    return;
  }

  // Iniciar partido (en la MISMA VISTA, sin cambiar de ruta)
  if (canStart) {
    root.querySelector<HTMLButtonElement>('#startMatch')!.onclick = () => {
      // Pasamos contexto al engine sin tocar tu usuario principal
      sessionStorage.setItem(T_MODE_KEY, '1');
      sessionStorage.setItem(T_MATCH_PLAYERS_KEY, JSON.stringify({
        p1: next!.p1,
        p2: next!.p2!,
      }));

      // Renderizamos la vista de juego inline (clonado del flujo Play1v1)
      root.innerHTML = `
        <section class="mx-auto max-w-6xl p-6 grow space-y-6 text-white">
          <div class="flex justify-between items-center mb-6 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-lg">
            <span class="font-semibold">${t('tour.title')} • Round ${s.round} • Match ${idxHuman}/${totalThisRound}</span>
            <span class="text-lg font-bold">🎮 ${next!.p1.nick} vs ${next!.p2!.nick}</span>
            <button id="backBtn" class="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-white transition-all">Salir</button>
          </div>
          <div class="flex flex-col items-center justify-center p-4">
            <canvas id="live_pong" width="800" height="500" class="shadow-xl border-4 border-white rounded-2xl backdrop-blur-md"></canvas>
          </div>
        </section>
      `;

      // Volver manual al bracket
      const handleBack = () => {
        sessionStorage.removeItem(T_MODE_KEY);
        sessionStorage.removeItem(T_MATCH_PLAYERS_KEY);
        renderTournament(root);
      };
      document.getElementById('backBtn')?.addEventListener('click', handleBack);

      // 🟢 Watcher: cuando el engine deje el resultado, volvemos automáticamente al bracket
      const WATCH_KEY = T_LAST_RESULT_KEY;
      const watchInterval = setInterval(() => {
        if (sessionStorage.getItem(WATCH_KEY)) {
          clearInterval(watchInterval);
          sessionStorage.removeItem(T_MODE_KEY);
          sessionStorage.removeItem(T_MATCH_PLAYERS_KEY);
          renderTournament(root);
        }
      }, 250);

      // Limpieza si el usuario cierra/navega
      const cleanup = () => clearInterval(watchInterval);
      window.addEventListener('beforeunload', cleanup, { once: true });

      // Arrancamos el juego 1v1 3D con el canvas ya en DOM
      requestAnimationFrame(() => {
        const c = document.getElementById('live_pong') as HTMLCanvasElement | null;
        if (c) {
          if (!c.style.width)  c.style.width  = `${c.width}px`;
          if (!c.style.height) c.style.height = `${c.height}px`;
          setupLivePong3D();
        }
      });
    };
  }
}

/* ===================== Vistas parciales ===================== */
function liPlayer(p: SessionUser, isYou: boolean) {
  return `
    <li class="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2">
      <div class="flex items-center gap-3">
        <img src="${p.avatar || 'https://dummyimage.com/96x96/0aa15c/ffffff&text=' + encodeURIComponent((p.nick[0] || 'P').toUpperCase())}" class="w-8 h-8 rounded-full"/>
        <div>
          <div class="font-semibold">${p.nick}${isYou ? ' <span class="text-xs opacity-80">(you)</span>' : ''}</div>
          <div class="text-xs opacity-70">id ${p.id}</div>
        </div>
      </div>
      ${isYou ? '' : `<button class="rm text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50" data-id="${p.id}">Remove</button>`}
    </li>
  `;
}

function itemMatch(q: Pairing, i: number, current: number) {
  const isNext = i === current;
  const done = i < current;
  const vs = q.p2 ? 'vs' : '(BYE)';
  return `
    <li class="rounded-xl px-3 py-2 ${done ? 'bg-emerald-600/30' : isNext ? 'bg-amber-500/30' : 'bg-black/20'}">
      <div class="text-sm ${done ? 'line-through opacity-70' : ''}">${q.p1.nick} ${vs} ${q.p2 ? q.p2.nick : ''}</div>
      ${isNext ? `<div class="text-xs opacity-75 mt-1">Next</div>` : ''}
    </li>
  `;
}
