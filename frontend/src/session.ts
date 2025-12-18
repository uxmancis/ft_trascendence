// src/session.ts
export type SessionUser = { id: number; nick: string; avatar: string };

// ========= Storage Keys ==========
const KEY_ME = 'pong:user';
const KEY_P2 = 'pong:local:p2';
const KEY_P3 = 'pong:local:p3';
const KEY_P4 = 'pong:local:p4';
const KEY_TOURNAMENT = 'pong:local:tournament';
const KEY_TEMP_STATE = 'pong:temp:state'; // Transient state (AI settings, etc.)
const KEY_CLEANUP_TIMEOUT = 'pong:cleanup:ts'; // Timestamp para limpiar temp

/* ========= State reactivo (store de sesión) ========= */
type Listener = () => void;

export type SessionState = {
  me: SessionUser | null;
  p2: SessionUser | null;
  p3: SessionUser | null;
  p4: SessionUser | null;
  tournament: SessionUser[];
};

let state: SessionState = {
  me: null,
  p2: null,
  p3: null,
  p4: null,
  tournament: [],
};

// Validación de SessionUser
function isValidUser(u: any): u is SessionUser {
  return u && typeof u === 'object' && typeof u.id === 'number' && typeof u.nick === 'string' && typeof u.avatar === 'string';
}

// Carga inicial desde localStorage (una sola vez, al importar)
(function bootstrapFromStorage() {
  try {
    const me = JSON.parse(localStorage.getItem(KEY_ME) || 'null');
    state.me = isValidUser(me) ? me : null;
  } catch { state.me = null; }
  try {
    const p2 = JSON.parse(localStorage.getItem(KEY_P2) || 'null');
    state.p2 = isValidUser(p2) ? p2 : null;
  } catch { state.p2 = null; }
  try {
    const p3 = JSON.parse(localStorage.getItem(KEY_P3) || 'null');
    state.p3 = isValidUser(p3) ? p3 : null;
  } catch { state.p3 = null; }
  try {
    const p4 = JSON.parse(localStorage.getItem(KEY_P4) || 'null');
    state.p4 = isValidUser(p4) ? p4 : null;
  } catch { state.p4 = null; }
  try {
    const tournament = JSON.parse(localStorage.getItem(KEY_TOURNAMENT) || '[]');
    state.tournament = Array.isArray(tournament) && tournament.every(isValidUser) ? tournament : [];
  } catch { state.tournament = []; }
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

function setP3Local(p3: SessionUser | null) {
  state.p3 = p3;
  if (p3) localStorage.setItem(KEY_P3, JSON.stringify(p3));
  else localStorage.removeItem(KEY_P3);
  emit();
}

function setP4Local(p4: SessionUser | null) {
  state.p4 = p4;
  if (p4) localStorage.setItem(KEY_P4, JSON.stringify(p4));
  else localStorage.removeItem(KEY_P4);
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

// Jugador 2 local (4v4)
export function getLocalP3(): SessionUser | null { return state.p3; }
export function setLocalP3(u: SessionUser) { setP3Local(u); }
export function clearLocalP3() { setP3Local(null); }
export function getLocalP4(): SessionUser | null { return state.p4; }
export function setLocalP4(u: SessionUser) { setP4Local(u); }
export function clearLocalP4() { setP4Local(null); }

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
  state = { me: null, p2: null, p3: null, p4: null, tournament: [] };
  emit();
}

/** Variante explícita si prefieres llamar a funciones concretas. */
export function clearAllLocalState() {
  clearTournamentPlayers();
  //clearLocalP2();
  //clearLocalP3();
  //clearLocalP4();
  //clearCurrentUser();
}

/* ============ Limpieza selectiva de temporales ============ */
/** Limpia P2, P3, P4, Tournament y temp state (después de partidas). */
export function clearTemporaryPlayers() {
  clearLocalP2();
  clearLocalP3();
  clearLocalP4();
  clearTournamentPlayers();
  clearTempState();
}

/* ============ Temporal State Management (sin persistencia larga) ============ */
/** Almacena state temporal en localStorage (con timeout automático). */
export function setTempState(key: string, value: any, expiryMs: number = 30 * 60 * 1000) {
  const obj = getTempState();
  obj[key] = { value, expires: Date.now() + expiryMs };
  localStorage.setItem(KEY_TEMP_STATE, JSON.stringify(obj));
}

/** Obtiene state temporal (auto-expira si pasó timeout). */
export function getTempState(key?: string): any {
  try {
    const all = JSON.parse(localStorage.getItem(KEY_TEMP_STATE) || '{}');
    
    // Limpia expirados
    const now = Date.now();
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(all)) {
      if ((v as any)?.expires > now) {
        cleaned[k] = (v as any).value;
      }
    }
    localStorage.setItem(KEY_TEMP_STATE, JSON.stringify(cleaned));
    
    return key ? cleaned[key] : cleaned;
  } catch {
    return key ? null : {};
  }
}

export function clearTempState() {
  localStorage.removeItem(KEY_TEMP_STATE);
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

export function patchLocalP3(partial: Partial<Pick<SessionUser, 'nick' | 'avatar'>>) {
  if (!state.p3) return;
  const next = { ...state.p3, ...partial };
  setP3Local(next);
}

export function patchLocalP4(partial: Partial<Pick<SessionUser, 'nick' | 'avatar'>>) {
  if (!state.p4) return;
  const next = { ...state.p4, ...partial };
  setP4Local(next);
}
