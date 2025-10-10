export type SessionUser = { id: number; nick: string; avatar: string };

const KEY_ME = 'pong:user';
const KEY_P2 = 'pong:local:p2';
const KEY_TOURNAMENT = 'pong:local:tournament'; // array de 3 jugadores locales (más tú = 4)

/* ============ Usuario principal ============ */
export function getCurrentUser(): SessionUser | null {
  try { return JSON.parse(localStorage.getItem(KEY_ME) || 'null'); }
  catch { return null; }
}
export function setCurrentUser(u: SessionUser){ localStorage.setItem(KEY_ME, JSON.stringify(u)); }
export function clearCurrentUser(){ localStorage.removeItem(KEY_ME); }

/* ============ Jugador 2 local (1v1) ============ */
export function getLocalP2(): SessionUser | null {
  try { return JSON.parse(localStorage.getItem(KEY_P2) || 'null'); }
  catch { return null; }
}
export function setLocalP2(u: SessionUser){ localStorage.setItem(KEY_P2, JSON.stringify(u)); }
export function clearLocalP2(){ localStorage.removeItem(KEY_P2); }

/* ============ Jugadores locales del torneo ============ */
export function getTournamentPlayers(): SessionUser[] {
  try { return JSON.parse(localStorage.getItem(KEY_TOURNAMENT) || '[]'); }
  catch { return []; }
}
export function setTournamentPlayers(players: SessionUser[]){
  localStorage.setItem(KEY_TOURNAMENT, JSON.stringify(players));
}
export function clearTournamentPlayers(){ localStorage.removeItem(KEY_TOURNAMENT); }

/* ============ Limpieza global localStorage de la app ============ */
/** Borra TODA la información local de la app (prefijo 'pong:').
 *  No borra nada en la base de datos. */
export function clearAppStorage() {
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith('pong:')) toDelete.push(k);
  }
  toDelete.forEach(k => localStorage.removeItem(k));
}

/** Variante explícita si prefieres llamar a funciones concretas. */
export function clearAllLocalState() {
  clearTournamentPlayers();
  clearLocalP2();
  clearCurrentUser();
}
