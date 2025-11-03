// src/views/Tournament.ts
import { createUser, type NewUser } from '../api';
import {
  getCurrentUser,
  getTournamentPlayers,
  setTournamentPlayers,
  clearTournamentPlayers,
} from '../session';
import { t, bindI18n } from '../i18n/i18n';
import { setupLivePong3D } from './Live1v1';

type SessionUser = { id: number; nick: string; avatar?: string };

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;

// claves compartidas con el engine
const T_MODE_KEY = 'tournament:mode';
const T_MATCH_PLAYERS_KEY = 'tournament:matchPlayers';
const T_LAST_RESULT_KEY = 'tournament:lastResult';

// estado del torneo
const STATE_KEY = 'tournament:state';
const PLAYERS_KEY = 'tournament:players';

type Pairing = { p1: SessionUser; p2: SessionUser | null };
type TourState = {
  round: number;
  queue: Pairing[];
  currentIndex: number;
  winners: SessionUser[];
  started: boolean;
};

function saveState(s: TourState) {
  sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
}
function loadState(): TourState | null {
  try {
    return JSON.parse(sessionStorage.getItem(STATE_KEY) || 'null');
  } catch {
    return null;
  }
}
function clearState() {
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(T_LAST_RESULT_KEY);
  sessionStorage.removeItem(T_MODE_KEY);
  sessionStorage.removeItem(T_MATCH_PLAYERS_KEY);
}

// utils
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
  const out: Pairing[] = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push({ p1: arr[i]!, p2: arr[i + 1] || null });
  }
  return out;
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
      s.started = false;
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
    pair.p1.id === winnerId
      ? pair.p1
      : pair.p2 && pair.p2.id === winnerId
        ? pair.p2
        : null;
  if (!winner) return;

  s.winners.push(winner);
  s.currentIndex++;

  if (s.currentIndex >= s.queue.length) {
    if (s.winners.length <= 1) {
      s.started = false;
    } else {
      s.round++;
      s.queue = makeRound(s.winners);
      s.currentIndex = 0;
      s.winners = [];
    }
  }
  saveState(s);
}

/* ====== helpers de bracket ====== */

// preview (antes de empezar) → generamos columnas teóricas
function buildPreviewBracket(players: SessionUser[], currentUserId?: number) {
  if (!players.length) return [];
  const round1 = makeRound(players);
  const cols: Array<{ title: string; matches: Array<{ label: string }> }> = [];

  cols.push({
    title: 'Round 1',
    matches: round1.map(() => ({ label: '' })), // el contenido real lo pintamos a medida
  });

  let next = Math.ceil(round1.length / 2);
  let r = 2;
  while (next > 1) {
    cols.push({
      title: `Round ${r}`,
      matches: Array.from({ length: next }, (_, i) => ({
        label: `Winner M${i * 2 + 1} vs Winner M${i * 2 + 2}`,
      })),
    });
    next = Math.ceil(next / 2);
    r++;
  }
  cols.push({ title: 'Champion', matches: [{ label: '🏆 Winner' }] });

  return cols;
}

// en curso
function buildBracketColumns(s: TourState) {
  const cols: Array<{
    title: string;
    matches: Array<{ label: string; done?: boolean; current?: boolean }>;
  }> = [];

  cols.push({
    title: `Round ${s.round}`,
    matches: s.queue.map((m, i) => ({
      label: m.p2 ? `${m.p1.nick} vs ${m.p2.nick}` : `${m.p1.nick} (BYE)`,
      done: i < s.currentIndex,
      current: i === s.currentIndex,
    })),
  });

  if (s.currentIndex < s.queue.length) {
    const expectedNext = Math.ceil(s.queue.length / 2);
    cols.push({
      title: 'Next',
      matches: Array.from({ length: expectedNext }, (_, i) => ({
        label: `Winner M${i * 2 + 1} vs Winner M${i * 2 + 2}`,
      })),
    });
  } else if (s.winners.length === 1) {
    cols.push({
      title: 'Champion',
      matches: [{ label: `🏆 ${s.winners[0].nick}`, done: true }],
    });
  }

  return cols;
}

function renderBracketCol(
  col: { title: string; matches: Array<{ label: string; done?: boolean; current?: boolean }> },
) {
  return `
    <div class="flex flex-col gap-3 min-w-[200px]">
      <div class="text-xs font-semibold text-white/70">${col.title}</div>
      <div class="flex flex-col gap-3">
        ${col.matches.map(m => bracketMatch(m.label, m.done, m.current)).join('')}
      </div>
    </div>
  `;
}

function bracketMatch(label: string, done?: boolean, current?: boolean) {
  const base = 'rounded-xl px-3 py-2 text-sm border';
  const doneCls = 'bg-emerald-500/15 border-emerald-300/40';
  const currentCls = 'bg-amber-500/15 border-amber-300/40 ring-2 ring-amber-300/50';
  const futureCls = 'bg-black/10 border-white/5';
  const cls = done ? doneCls : current ? currentCls : futureCls;
  return `
    <div class="${base} ${cls}">
      <div class="flex gap-2 items-center">
        ${done ? '<span class="text-xs">✔</span>' : current ? '<span class="text-xs animate-pulse">●</span>' : '<span class="text-xs opacity-40">•</span>'}
        <span class="truncate">${label}</span>
      </div>
    </div>
  `;
}

/* ===================== UI principal ===================== */
export async function renderTournament(root: HTMLElement) {
  const me = getCurrentUser();
  const locals = getTournamentPlayers().filter(Boolean);

  // resultado pendiente
  const pending = sessionStorage.getItem(T_LAST_RESULT_KEY);
  if (pending) {
    const res = JSON.parse(pending);
    const s = loadState();
    if (s && s.started) {
      const pair = getNextPairing(s);
      if (pair && pair.p2) {
        const expected = [pair.p1.id, pair.p2.id];
        const got = [res?.p1?.id, res?.p2?.id];
        const same =
          expected.length === got.length &&
          expected.every(id => got.includes(id));
        if (same && typeof res?.winner_id === 'number') {
          applyMatchResult(s, res.winner_id);
        }
      }
    }
    sessionStorage.removeItem(T_LAST_RESULT_KEY);
    sessionStorage.removeItem(T_MODE_KEY);
    sessionStorage.removeItem(T_MATCH_PLAYERS_KEY);
  }

  const s = loadState();

  // ======= FASE 1: no empezado =======
  if (!s || !s.started) {
    const players = [me, ...locals].filter(Boolean) as SessionUser[];
    const previewCols = buildPreviewBracket(players, me?.id);

    root.innerHTML = `
      <section class="mx-auto max-w-6xl p-6 grow space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">🏆 ${t('tour.title')}</h1>
          <button id="reset" class="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50">
            ${t('tour.reset')}
          </button>
        </div>

        <!-- barra para añadir jugadores -->
        <div class="rounded-xl bg-white/10 p-4 flex flex-wrap gap-3 items-center">
          <span class="font-semibold text-sm">${t('tour.ready')}</span>
          <form id="add-form" class="flex gap-2 flex-wrap">
            <input id="nick"
              class="px-3 py-2 rounded border text-black"
              placeholder="${t('login.nick')}"
              minlength="2" maxlength="20" required />
            <button class="px-3 py-2 rounded bg-black/80 hover:bg-black text-white text-sm">
              ${t('login.submit')}
            </button>
          </form>
          <span class="text-xs opacity-60 ml-auto">
            ${t('common.players')}: ${players.length} / ${MAX_PLAYERS} · min ${MIN_PLAYERS}
          </span>
        </div>

        <!-- caja del bracket -->
        <div class="rounded-2xl bg-white/5 p-4 min-h-[420px] flex flex-col gap-4">
          <div class="flex-1 overflow-x-auto">
            <div class="flex gap-5 min-h-[280px]">
              ${
                previewCols.length
                  ? previewCols
                      .map((col, colIdx) => {
                        if (colIdx === 0) {
                          // Round 1 → aquí sí queremos UNA SOLA LÍNEA con la X
                          return `
                            <div class="flex flex-col gap-3 min-w-[260px]">
                              <div class="text-xs font-semibold text-white/70">${col.title}</div>
                              <div class="flex flex-col gap-3">
                                ${makeRound(players)
                                  .map(m => lineMatchWithX(m, me?.id))
                                  .join('')}
                              </div>
                            </div>
                          `;
                        }
                        return renderBracketCol(col as any);
                      })
                      .join('')
                  : '<div class="opacity-50 text-sm">Añade jugadores para generar el cuadro…</div>'
              }
            </div>
          </div>

          <div class="flex justify-end">
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

    // añadir jugador
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
        const localsNext = [...current.slice(1), { id: created.id, nick: created.nick, avatar: created.avatar }];
        setTournamentPlayers(localsNext as any);
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

    // quitar jugador con la X
    root.addEventListener('click', (ev) => {
      const btn = ev.target as HTMLElement;
      if (!btn.dataset?.rmid) return;
      const id = Number(btn.dataset.rmid);
      if (me && id === me.id) return;
      const current = [me, ...getTournamentPlayers().filter(Boolean)] as SessionUser[];
      const next = current.filter(p => p.id !== id);
      setTournamentPlayers(next.slice(1) as any);
      renderTournament(root);
    });

    return;
  }

  // ======= FASE 2: torneo en curso =======
  const s2 = s;
  const next = getNextPairing(s2);
  const totalThisRound = s2.queue.length;
  const idx = s2.currentIndex + 1;
  const byesPending = next && !next.p2;
  const canStart = next && !!next.p2;
  const cols = buildBracketColumns(s2);

  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">🏆 ${t('tour.title')}</h1>
        <button id="reset" class="text-xs px-2 py-1 rounded bg-black/30 hover:bg-black/50">
          ${t('tour.reset')}
        </button>
      </div>

      <div class="rounded-2xl bg-white/5 p-4 min-h-[420px] flex flex-col gap-4">
        <div class="flex-1 overflow-x-auto">
          <div class="flex gap-5 min-h-[280px]">
            ${cols.map(renderBracketCol).join('')}
          </div>
        </div>

        <div class="flex items-center justify-between bg-black/20 rounded-lg px-4 py-3">
          ${
            next
              ? `
                <div>
                  <div class="text-xs opacity-70">Round ${s2.round} · Match ${idx} / ${totalThisRound}</div>
                  <div class="font-semibold">
                    ${next.p1.nick} ${next.p2 ? 'vs' : ''} ${next.p2 ? next.p2.nick : '(BYE)'}
                  </div>
                </div>
              `
              : `
                <div>
                  <div class="text-xs opacity-70">Tournament finished</div>
                  <div class="font-semibold">🏆 Champion decided</div>
                </div>
              `
          }
          <div>
            ${
              next
                ? (
                    byesPending
                      ? `<button id="advanceBye" class="px-4 py-2 rounded bg-amber-500/80 hover:bg-amber-600 text-white">Advance (BYE)</button>`
                      : `<button id="startMatch" class="px-4 py-2 rounded bg-emerald-500/80 hover:bg-emerald-600 text-white">Start match</button>`
                  )
                : ''
            }
          </div>
        </div>
      </div>
    </section>
  `;

  bindI18n(root);

  root.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
    clearTournamentPlayers();
    clearState();
    renderTournament(root);
  };

  if (byesPending) {
    root.querySelector<HTMLButtonElement>('#advanceBye')!.onclick = () => {
      applyByeAdvance(s2, next!.p1);
      renderTournament(root);
    };
    return;
  }

  if (canStart) {
    root.querySelector<HTMLButtonElement>('#startMatch')!.onclick = () => {
      sessionStorage.setItem(T_MODE_KEY, '1');
      sessionStorage.setItem(T_MATCH_PLAYERS_KEY, JSON.stringify({
        p1: next!.p1,
        p2: next!.p2!,
      }));

      root.innerHTML = `
        <section class="mx-auto max-w-6xl p-6 grow space-y-6 text-white">
          <div class="flex justify-between items-center mb-6 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-lg">
            <span class="font-semibold">${t('tour.title')} • Round ${s2.round} • Match ${idx}/${totalThisRound}</span>
            <span class="text-lg font-bold">🎮 ${next!.p1.nick} vs ${next!.p2!.nick}</span>
            <button id="backBtn" class="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-white transition-all">Salir</button>
          </div>
          <div class="flex flex-col items-center justify-center p-4">
            <canvas id="live_pong" width="800" height="500" class="shadow-xl border-4 border-white rounded-2xl backdrop-blur-md"></canvas>
          </div>
        </section>
      `;

      const back = () => {
        sessionStorage.removeItem(T_MODE_KEY);
        sessionStorage.removeItem(T_MATCH_PLAYERS_KEY);
        renderTournament(root);
      };
      document.getElementById('backBtn')?.addEventListener('click', back);

      const watch = setInterval(() => {
        if (sessionStorage.getItem(T_LAST_RESULT_KEY)) {
          clearInterval(watch);
          sessionStorage.removeItem(T_MODE_KEY);
          sessionStorage.removeItem(T_MATCH_PLAYERS_KEY);
          renderTournament(root);
        }
      }, 250);

      window.addEventListener('beforeunload', () => clearInterval(watch), { once: true });

      requestAnimationFrame(() => {
        const c = document.getElementById('live_pong') as HTMLCanvasElement | null;
        if (c) {
          if (!c.style.width) c.style.width = `${c.width}px`;
          if (!c.style.height) c.style.height = `${c.height}px`;
          setupLivePong3D();
        }
      });
    };
  }
}

/* ====== match Round1 en UNA SOLA LÍNEA con X ====== */
function lineMatchWithX(match: Pairing, currentUserId?: number) {
  const p1Can = match.p1.id !== currentUserId;
  const p2Can = match.p2 && match.p2.id !== currentUserId;
  return `
    <div class="flex items-center gap-2 rounded-xl px-3 py-2 border bg-black/10 border-white/5 text-sm">
      <div class="flex items-center gap-1">
        <span class="truncate max-w-[120px]">${match.p1.nick}</span>
        ${p1Can ? `<button data-rmid="${match.p1.id}" class="text-xs text-red-400 hover:text-red-200">✕</button>` : ''}
      </div>
      <span class="opacity-50 text-xs">vs</span>
      ${
        match.p2
          ? `<div class="flex items-center gap-1">
               <span class="truncate max-w-[120px]">${match.p2.nick}</span>
               ${p2Can ? `<button data-rmid="${match.p2.id}" class="text-xs text-red-400 hover:text-red-200">✕</button>` : ''}
             </div>`
          : `<span class="text-xs opacity-60">(BYE)</span>`
      }
    </div>
  `;
}
