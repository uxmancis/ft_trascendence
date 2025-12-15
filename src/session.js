const KEY_ME = 'pong:user';
const KEY_P2 = 'pong:local:p2';
const KEY_P3 = 'pong:local:p3';
const KEY_P4 = 'pong:local:p4';
const KEY_TOURNAMENT = 'pong:local:tournament'; // array de 3 jugadores locales (más tú = 4)
let state = {
    me: null,
    p2: null,
    p3: null,
    p4: null,
    tournament: [],
};
// Carga inicial desde localStorage (una sola vez, al importar)
(function bootstrapFromStorage() {
    try {
        state.me = JSON.parse(localStorage.getItem(KEY_ME) || 'null');
    }
    catch {
        state.me = null;
    }
    try {
        state.p2 = JSON.parse(localStorage.getItem(KEY_P2) || 'null');
    }
    catch {
        state.p2 = null;
    }
    try {
        state.p3 = JSON.parse(localStorage.getItem(KEY_P3) || 'null');
    }
    catch {
        state.p3 = null;
    }
    try {
        state.p4 = JSON.parse(localStorage.getItem(KEY_P4) || 'null');
    }
    catch {
        state.p4 = null;
    }
    try {
        state.tournament = JSON.parse(localStorage.getItem(KEY_TOURNAMENT) || '[]');
    }
    catch {
        state.tournament = [];
    }
})();
let listeners = [];
let pending = false;
function emit() {
    if (pending)
        return;
    pending = true;
    queueMicrotask(() => {
        pending = false;
        for (const l of listeners)
            l();
    });
}
/** Suscripción al estado de sesión (devuelve un unsubscribe) */
export function subscribeSession(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(x => x !== fn); };
}
/** Lectura del snapshot actual (inmutable por contrato) */
export function getSessionState() {
    return state;
}
/** Helpers internos para settear y emitir */
function setMe(me) {
    state.me = me;
    if (me)
        localStorage.setItem(KEY_ME, JSON.stringify(me));
    else
        localStorage.removeItem(KEY_ME);
    emit();
}
function setP2Local(p2) {
    state.p2 = p2;
    if (p2)
        localStorage.setItem(KEY_P2, JSON.stringify(p2));
    else
        localStorage.removeItem(KEY_P2);
    emit();
}
function setP3Local(p3) {
    state.p3 = p3;
    if (p3)
        localStorage.setItem(KEY_P3, JSON.stringify(p3));
    else
        localStorage.removeItem(KEY_P3);
    emit();
}
function setP4Local(p4) {
    state.p4 = p4;
    if (p4)
        localStorage.setItem(KEY_P4, JSON.stringify(p4));
    else
        localStorage.removeItem(KEY_P4);
    emit();
}
function setTournamentLocal(players) {
    state.tournament = players || [];
    if (state.tournament.length)
        localStorage.setItem(KEY_TOURNAMENT, JSON.stringify(state.tournament));
    else
        localStorage.removeItem(KEY_TOURNAMENT);
    emit();
}
/* ============ API clásica (compat) ============ */
// Usuario principal
export function getCurrentUser() { return state.me; }
export function setCurrentUser(u) { setMe(u); }
export function clearCurrentUser() { setMe(null); }
// Jugador 2 local (1v1)
export function getLocalP2() { return state.p2; }
export function setLocalP2(u) { setP2Local(u); }
export function clearLocalP2() { setP2Local(null); }
// Jugador 2 local (4v4)
export function getLocalP3() { return state.p3; }
export function setLocalP3(u) { setP3Local(u); }
export function clearLocalP3() { setP3Local(null); }
export function getLocalP4() { return state.p4; }
export function setLocalP4(u) { setP4Local(u); }
export function clearLocalP4() { setP4Local(null); }
// Jugadores locales del torneo
export function getTournamentPlayers() { return state.tournament; }
export function setTournamentPlayers(players) { setTournamentLocal(players); }
export function clearTournamentPlayers() { setTournamentLocal([]); }
/* ============ Limpieza global localStorage de la app ============ */
/** Borra TODA la información local de la app (prefijo 'pong:'). */
export function clearAppStorage() {
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('pong:'))
            toDelete.push(k);
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
/* ============ Azúcar extra útil para el juego ============ */
/** Indica si hay ambos jugadores listos para 1v1 local. */
export function isReadyFor1v1() {
    return !!(state.me && state.p2);
}
/** Devuelve tu pareja actual de jugadores (si existe). */
export function getPair() {
    if (state.me && state.p2)
        return [state.me, state.p2];
    return null;
}
/** Actualiza parcialmente el usuario actual (nick/avatar) y emite. */
export function patchCurrentUser(partial) {
    if (!state.me)
        return;
    const next = { ...state.me, ...partial };
    setMe(next);
}
/** Actualiza parcialmente el P2 local (nick/avatar) y emite. */
export function patchLocalP2(partial) {
    if (!state.p2)
        return;
    const next = { ...state.p2, ...partial };
    setP2Local(next);
}
export function patchLocalP3(partial) {
    if (!state.p3)
        return;
    const next = { ...state.p3, ...partial };
    setP3Local(next);
}
export function patchLocalP4(partial) {
    if (!state.p4)
        return;
    const next = { ...state.p4, ...partial };
    setP4Local(next);
}
