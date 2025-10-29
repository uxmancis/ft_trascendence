// src/session.ts
export type SessionUser = { id: number; nick: string; avatar: string };

const KEY_ME = 'pong:user';
const KEY_P2 = 'pong:local:p2';
const KEY_TOURNAMENT = 'pong:local:tournament'; // array de 3 jugadores locales (más tú = 4)

/* ========= State reactivo (store de sesión) ========= */
type Listener = () => void;

export type SessionState = {
  me: SessionUser | null;
  p2: SessionUser | null;
  tournament: SessionUser[];
};

let state: SessionState = {
  me: null,
  p2: null,
  tournament: [],
};

// Carga inicial desde localStorage (una sola vez, al importar)
(function bootstrapFromStorage() {
  try { state.me = JSON.parse(localStorage.getItem(KEY_ME) || 'null'); } catch { state.me = null; }
  try { state.p2 = JSON.parse(localStorage.getItem(KEY_P2) || 'null'); } catch { state.p2 = null; }
  try { state.tournament = JSON.parse(localStorage.getItem(KEY_TOURNAMENT) || '[]'); } catch { state.tournament = []; }
})();

let listeners: Listener[] = [];
let pending = false;

function emit() {
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    for (const l of listeners) l();
  });
}

/** Suscripción al estado de sesión (devuelve un unsubscribe) */
export function subscribeSession(fn: Listener) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(x => x !== fn); };
}

/** Lectura del snapshot actual (inmutable por contrato) */
export function getSessionState(): Readonly<SessionState> {
  return state;
}

/** Helpers internos para settear y emitir */
function setMe(me: SessionUser | null) {
  state.me = me;
  if (me) localStorage.setItem(KEY_ME, JSON.stringify(me));
  else localStorage.removeItem(KEY_ME);
  emit();
}
function setP2Local(p2: SessionUser | null) {
  state.p2 = p2;
  if (p2) localStorage.setItem(KEY_P2, JSON.stringify(p2));
  else localStorage.removeItem(KEY_P2);
  emit();
}
function setTournamentLocal(players: SessionUser[]) {
  state.tournament = players || [];
  if (state.tournament.length) localStorage.setItem(KEY_TOURNAMENT, JSON.stringify(state.tournament));
  else localStorage.removeItem(KEY_TOURNAMENT);
  emit();
}

/* ============ API clásica (compat) ============ */
// Usuario principal
export function getCurrentUser(): SessionUser | null { return state.me; }
export function setCurrentUser(u: SessionUser) { setMe(u); }
export function clearCurrentUser() { setMe(null); }

// Jugador 2 local (1v1)
export function getLocalP2(): SessionUser | null { return state.p2; }
export function setLocalP2(u: SessionUser) { setP2Local(u); }
export function clearLocalP2() { setP2Local(null); }

// Jugadores locales del torneo
export function getTournamentPlayers(): SessionUser[] { return state.tournament; }
export function setTournamentPlayers(players: SessionUser[]) { setTournamentLocal(players); }
export function clearTournamentPlayers() { setTournamentLocal([]); }

/* ============ Limpieza global localStorage de la app ============ */
/** Borra TODA la información local de la app (prefijo 'pong:'). */
export function clearAppStorage() {
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith('pong:')) toDelete.push(k);
  }
  toDelete.forEach(k => localStorage.removeItem(k));

  // Limpia también el estado en memoria
  state = { me: null, p2: null, tournament: [] };
  emit();
}

/** Variante explícita si prefieres llamar a funciones concretas. */
export function clearAllLocalState() {
  clearTournamentPlayers();
  clearLocalP2();
  clearCurrentUser();
}

/* ============ Azúcar extra útil para el juego ============ */
/** Indica si hay ambos jugadores listos para 1v1 local. */
export function isReadyFor1v1(): boolean {
  return !!(state.me && state.p2);
}

/** Devuelve tu pareja actual de jugadores (si existe). */
export function getPair(): [SessionUser, SessionUser] | null {
  if (state.me && state.p2) return [state.me, state.p2];
  return null;
}

/** Actualiza parcialmente el usuario actual (nick/avatar) y emite. */
export function patchCurrentUser(partial: Partial<Pick<SessionUser, 'nick' | 'avatar'>>) {
  if (!state.me) return;
  const next = { ...state.me, ...partial };
  setMe(next);
}

/** Actualiza parcialmente el P2 local (nick/avatar) y emite. */
export function patchLocalP2(partial: Partial<Pick<SessionUser, 'nick' | 'avatar'>>) {
  if (!state.p2) return;
  const next = { ...state.p2, ...partial };
  setP2Local(next);
}
