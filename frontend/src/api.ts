// src/api.ts

// export const API_URL =
//   (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
//   'http://' + HOSTNAME + ':3000';

export const API_URL =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
  '/api';

/* =========================
 * CACHE SYSTEM - Reduce peticiones a BD
 * ========================= */
const CACHE_KEYS = {
  USERS_ALL: () => 'users:all',
  USER: (id: number) => `user:${id}`,
  STATS_ALL: () => 'stats:all',
  STATS_USER: (userId: number) => `stats:user:${userId}`,
  MATCHES_ALL: () => 'matches:all',
  MATCH: (id: number) => `match:${id}`,
} as const;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCached<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(`cache:${key}`);
    if (!stored) return null;
    const entry: CacheEntry<T> = JSON.parse(stored);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCached<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
}

function invalidateCache(key: string): void {
  localStorage.removeItem(`cache:${key}`);
}

function invalidateCachePattern(pattern: string): void {
  const keys = Object.keys(localStorage).filter(k => k.includes(pattern));
  keys.forEach(k => localStorage.removeItem(k));
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/* =========================
 * Tipos de dominio
 * ========================= */
export interface User {
  id: number;
  nick: string;
  avatar: string;
  created_at: string;
}
export interface NewUser { nick: string; avatar: string; }

export interface UserStats {
  user_id: number;
  games_played: number;
  wins: number;
  losses: number;
  goals_scored: number;
  goals_received: number;
  shots_on_target: number;
  saves: number;
  win_streak: number;
  best_streak: number;
}
export interface NewUserStats { user_id: number; }

export interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  score_p1: number;
  score_p2: number;
  winner_id: number;
  duration_seconds: number;
  created_at: string;
}

/** Métricas opcionales por partido (si el backend las soporta vía `details`) */
export interface MatchDetails {
  shots_on_target_p1?: number;
  saves_p1?: number;
  shots_on_target_p2?: number;
  saves_p2?: number;
}

export interface NewMatch {
  player1_id: number;
  player2_id: number;
  score_p1: number;
  score_p2: number;
  winner_id: number;
  duration_seconds?: number;

  /** Envío recomendado: objeto `details` con las métricas */
  details?: MatchDetails;

  /** Alternativa opcional (plano), por si el backend también lo acepta */
  shots_on_target_p1?: number;
  saves_p1?: number;
  shots_on_target_p2?: number;
  saves_p2?: number;
}

/* =========================
 * Fetch helper robusto
 * ========================= */
type HttpMethod = 'GET' | 'POST' | 'DELETE';

interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

async function request<TResp = unknown, TBody = unknown>(
  path: string,
  { method = 'GET', body, signal, timeoutMs = 10000, headers }: RequestOptions<TBody> = {}
): Promise<TResp> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? controller.signal,
    });

    if (res.status === 204) {
      return undefined as TResp;
    }

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : undefined;

    if (!res.ok) {
      const message = (data as any)?.message || (data as any)?.error || `HTTP ${res.status}`;
      throw new ApiError(message, res.status);
    }

    return data as TResp;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new ApiError('Timeout de petición', 499);
    if (e instanceof ApiError) throw e;
    throw new ApiError(e?.message || 'Error de red', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

/* =========================
 * Helpers de arrays seguros
 * ========================= */
function ensureArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

async function requestArray<T>(path: string, opts?: RequestOptions): Promise<T[]> {
  try {
    const data = await request<T[] | null | undefined>(path, opts);
    return ensureArray<T>(data);
  } catch (e: any) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 204)) return [];
    throw e;
  }
}

/* =========================
 * USERS
 * ========================= */
export const getUsers = async (signal?: AbortSignal): Promise<User[]> => {
  const cached = getCached<User[]>(CACHE_KEYS.USERS_ALL());
  if (cached) {
    console.log('[Cache] Users obtenidos del caché');
    return cached;
  }
  const users = await requestArray<User>('/users', { signal });
  setCached(CACHE_KEYS.USERS_ALL(), users);
  return users;
};

export const getUser = async (id: number, signal?: AbortSignal): Promise<User> => {
  const cached = getCached<User>(CACHE_KEYS.USER(id));
  if (cached) {
    console.log(`[Cache] User ${id} obtenido del caché`);
    return cached;
  }
  const user = await request<User>(`/users/${id}`, { signal });
  setCached(CACHE_KEYS.USER(id), user);
  return user;
};

export const createUser = async (payload: NewUser, signal?: AbortSignal): Promise<User> => {
  const result = await request<User>('/users', { method: 'POST', body: payload, signal });
  invalidateCachePattern('users:');
  return result;
};

export const deleteUser = async (id: number, signal?: AbortSignal): Promise<{ deleted: number }> => {
  const result = await request<{ deleted: number }>(`/users/${id}`, { method: 'DELETE', signal });
  invalidateCachePattern('users:');
  return result;
};

/** Sanitiza y envía un usuario (solo id, nick, avatar). */
export function sanitizeUser(user: any): NewUser {
  if (!user || typeof user !== 'object') throw new Error('Invalid user object');
  const nick = String(user.nick || '').trim();
  const avatar = String(user.avatar || '').trim();
  if (!nick || !avatar) throw new Error('User must have nick and avatar');
  return { nick, avatar };
}

/* =========================
 * STATS
 * ========================= */
export const getStats = async (signal?: AbortSignal): Promise<UserStats[]> => {
  const cached = getCached<UserStats[]>(CACHE_KEYS.STATS_ALL());
  if (cached) {
    console.log('[Cache] All stats obtenidas del caché');
    return cached;
  }
  const stats = await requestArray<UserStats>('/stats', { signal });
  setCached(CACHE_KEYS.STATS_ALL(), stats);
  return stats;
};

export const getStatsByUserId = async (userId: number, signal?: AbortSignal): Promise<UserStats> => {
  const cached = getCached<UserStats>(CACHE_KEYS.STATS_USER(userId));
  if (cached) {
    console.log(`[Cache] Stats usuario ${userId} obtenidas del caché`);
    return cached;
  }
  const stats = await request<UserStats>(`/stats/${userId}`, { signal });
  setCached(CACHE_KEYS.STATS_USER(userId), stats);
  return stats;
};

export const createStats = async (payload: NewUserStats, signal?: AbortSignal): Promise<{ id: number | string }> => {
  const result = await request<{ id: number | string }>('/stats', { method: 'POST', body: payload, signal });
  invalidateCachePattern('stats:');
  return result;
};

export const deleteStats = async (userId: number, signal?: AbortSignal): Promise<{ deleted: number }> => {
  const result = await request<{ deleted: number }>(`/stats/${userId}`, { method: 'DELETE', signal });
  invalidateCachePattern('stats:');
  return result;
};

/* =========================
 * MATCHES
 * ========================= */
export const getMatches = async (signal?: AbortSignal): Promise<Match[]> => {
  const cached = getCached<Match[]>(CACHE_KEYS.MATCHES_ALL());
  if (cached) {
    console.log('[Cache] Matches obtenidos del caché');
    return cached;
  }
  const matches = await requestArray<Match>('/matches', { signal });
  setCached(CACHE_KEYS.MATCHES_ALL(), matches);
  return matches;
};

export const getMatch = async (id: number, signal?: AbortSignal): Promise<Match> => {
  const cached = getCached<Match>(CACHE_KEYS.MATCH(id));
  if (cached) {
    console.log(`[Cache] Match ${id} obtenido del caché`);
    return cached;
  }
  const match = await request<Match>(`/matches/${id}`, { signal });
  setCached(CACHE_KEYS.MATCH(id), match);
  return match;
};

export const createMatch = async (payload: NewMatch, signal?: AbortSignal): Promise<{ id: number }> => {
  const result = await request<{ id: number }>('/matches', { method: 'POST', body: payload, signal });
  invalidateCachePattern('matches:');
  invalidateCachePattern('stats:');
  return result;
};

export const deleteMatch = async (id: number, signal?: AbortSignal): Promise<{ deleted: number }> => {
  const result = await request<{ deleted: number }>(`/matches/${id}`, { method: 'DELETE', signal });
  invalidateCachePattern('matches:');
  invalidateCachePattern('stats:');
  return result;
};

/** Sanitiza y envía un match (valida IDs y scores). */
export function sanitizeMatch(match: any): NewMatch {
  if (!match || typeof match !== 'object') throw new Error('Invalid match object');
  
  const p1_id = Number(match.player1_id);
  const p2_id = Number(match.player2_id);
  const winner_id = Number(match.winner_id);
  const s1 = Number(match.score_p1 || 0);
  const s2 = Number(match.score_p2 || 0);
  const duration = Number(match.duration_seconds || 0);
  
  // player1 y winner deben ser > 0 (usuarios reales)
  // player2 puede ser 0 (para IA) o > 0
  if (!p1_id || !winner_id) throw new Error('Match must have player1_id and winner_id');
  if (typeof p2_id !== 'number') throw new Error('Match must have player2_id (can be 0 for AI)');
  if (s1 < 0 || s2 < 0 || duration < 0) throw new Error('Scores and duration must be non-negative');
  
  // Winner debe ser player1 o player2 (o 0 si player2 es 0)
  if (winner_id !== p1_id && winner_id !== p2_id) {
    throw new Error('Winner must be one of the players');
  }
  
  const sanitized: NewMatch = {
    player1_id: p1_id,
    player2_id: p2_id,
    score_p1: s1,
    score_p2: s2,
    winner_id,
    duration_seconds: duration > 0 ? duration : undefined,
  };
  
  // Agrega details si existen
  const details = match.details || match;
  if (details.shots_on_target_p1 !== undefined || details.saves_p1 !== undefined ||
      details.shots_on_target_p2 !== undefined || details.saves_p2 !== undefined) {
    sanitized.details = {
      shots_on_target_p1: Math.max(0, Number(details.shots_on_target_p1) || 0),
      saves_p1: Math.max(0, Number(details.saves_p1) || 0),
      shots_on_target_p2: Math.max(0, Number(details.shots_on_target_p2) || 0),
      saves_p2: Math.max(0, Number(details.saves_p2) || 0),
    };
  }
  
  return sanitized;
}

/* =========================
 * Extra: timeout helper
 * ========================= */
export function withTimeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(id),
  };
}
