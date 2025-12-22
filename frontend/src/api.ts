// src/api.ts

export const API_URL =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
  '/api';

/* =========================
 * CACHE SYSTEM
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

function invalidateCachePattern(pattern: string): void {
  Object.keys(localStorage)
    .filter(k => k.includes(pattern))
    .forEach(k => localStorage.removeItem(k));
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/* =========================
 * DOMAIN TYPES
 * ========================= */
export interface User {
  id: number;
  nick: string;
  avatar: string;
  created_at: string;
}

export interface NewUser {
  nick: string;
  avatar: string;
}

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

export interface NewMatch {
  player1_id: number;
  player2_id: number;
  score_p1: number;
  score_p2: number;
  winner_id: number;
  duration_seconds?: number;
}

/* =========================
 * FETCH HELPER
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

    if (res.status === 204) return undefined as TResp;

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : undefined;

    if (!res.ok) {
      const msg = (data as any)?.error || `HTTP ${res.status}`;
      throw new ApiError(msg, res.status);
    }

    return data as TResp;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new ApiError('Timeout', 499);
    if (e instanceof ApiError) throw e;
    throw new ApiError(e?.message || 'Network error', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestArray<T>(path: string, opts?: RequestOptions): Promise<T[]> {
  try {
    const data = await request<T[] | null>(path, opts);
    return Array.isArray(data) ? data : [];
  } catch (e: any) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 204)) return [];
    throw e;
  }
}

/* =========================
 * USERS
 * ========================= */
export const getUsers = async (): Promise<User[]> => {
  const cached = getCached<User[]>(CACHE_KEYS.USERS_ALL());
  if (cached) return cached;
  const users = await requestArray<User>('/users');
  setCached(CACHE_KEYS.USERS_ALL(), users);
  return users;
};

export const getUser = async (id: number): Promise<User> => {
  const cached = getCached<User>(CACHE_KEYS.USER(id));
  if (cached) return cached;
  const user = await request<User>(`/users/${id}`);
  setCached(CACHE_KEYS.USER(id), user);
  return user;
};

export const createUser = async (payload: NewUser): Promise<User> => {
  const user = await request<User>('/users', { method: 'POST', body: payload });
  invalidateCachePattern('users:');
  return user;
};

export const deleteUser = async (id: number): Promise<{ deleted: number }> => {
  const res = await request<{ deleted: number }>(`/users/${id}`, { method: 'DELETE' });
  invalidateCachePattern('users:');
  return res;
};

export function sanitizeUser(user: any): NewUser {
  const nick = String(user?.nick || '').trim();
  const avatar = String(user?.avatar || '').trim();
  if (!nick || !avatar) throw new Error('Invalid user');
  return { nick, avatar };
}

/* =========================
 * STATS
 * ========================= */
export const getStats = async (): Promise<UserStats[]> => {
  const cached = getCached<UserStats[]>(CACHE_KEYS.STATS_ALL());
  if (cached) return cached;
  const stats = await requestArray<UserStats>('/stats');
  setCached(CACHE_KEYS.STATS_ALL(), stats);
  return stats;
};

export const getStatsByUserId = async (userId: number): Promise<UserStats> => {
  const cached = getCached<UserStats>(CACHE_KEYS.STATS_USER(userId));
  if (cached) return cached;
  const stats = await request<UserStats>(`/stats/${userId}`);
  setCached(CACHE_KEYS.STATS_USER(userId), stats);
  return stats;
};

/* =========================
 * MATCHES
 * ========================= */
export const getMatches = async (): Promise<Match[]> => {
  const cached = getCached<Match[]>(CACHE_KEYS.MATCHES_ALL());
  if (cached) return cached;
  const matches = await requestArray<Match>('/matches');
  setCached(CACHE_KEYS.MATCHES_ALL(), matches);
  return matches;
};

export const getMatch = async (id: number): Promise<Match> => {
  const cached = getCached<Match>(CACHE_KEYS.MATCH(id));
  if (cached) return cached;
  const match = await request<Match>(`/matches/${id}`);
  setCached(CACHE_KEYS.MATCH(id), match);
  return match;
};

export const createMatch = async (payload: NewMatch): Promise<{ id: number }> => {
  const res = await request<{ id: number }>('/matches', {
    method: 'POST',
    body: payload
  });
  invalidateCachePattern('matches:');
  invalidateCachePattern('stats:');
  return res;
};

export const deleteMatch = async (id: number): Promise<{ deleted: number }> => {
  const res = await request<{ deleted: number }>(`/matches/${id}`, {
    method: 'DELETE'
  });
  invalidateCachePattern('matches:');
  invalidateCachePattern('stats:');
  return res;
};

export function sanitizeMatch(match: any): NewMatch {
  if (!match || typeof match !== 'object') {
    throw new Error('Invalid match object');
  }

  const p1 = Number(match.player1_id);
  const p2 = Number(match.player2_id);
  const w  = Number(match.winner_id);

  const s1 = Number(match.score_p1 ?? 0);
  const s2 = Number(match.score_p2 ?? 0);
  const duration = Number(match.duration_seconds ?? 0);

  // IDs válidos (0 permitido solo para player2 / IA)
  if (Number.isNaN(p1) || Number.isNaN(p2) || Number.isNaN(w)) {
    throw new Error('Invalid player IDs');
  }

  if (p1 <= 0) {
    throw new Error('player1_id must be > 0');
  }

  if (p2 < 0) {
    throw new Error('player2_id must be >= 0');
  }

  if (w !== p1 && w !== p2) {
    throw new Error('Winner must be one of the players');
  }

  if (s1 < 0 || s2 < 0 || duration < 0) {
    throw new Error('Invalid scores or duration');
  }

  return {
    player1_id: p1,
    player2_id: p2,
    score_p1: s1,
    score_p2: s2,
    winner_id: w,
    duration_seconds: duration > 0 ? duration : undefined,
  };
}


