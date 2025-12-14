// src/api.ts

// export const API_URL =
//   (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
//   'http://' + HOSTNAME + ':3000';

export const API_URL =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
  'http://c4r6s3.42urduliz.com:3000';

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
export const getUsers = (signal?: AbortSignal) =>
  requestArray<User>('/users', { signal });

export const getUser = (id: number, signal?: AbortSignal) =>
  request<User>(`/users/${id}`, { signal });

export const createUser = (payload: NewUser, signal?: AbortSignal) =>
  request<User>('/users', { method: 'POST', body: payload, signal });

export const deleteUser = (id: number, signal?: AbortSignal) =>
  request<{ deleted: number }>(`/users/${id}`, { method: 'DELETE', signal });

/* =========================
 * STATS
 * ========================= */
export const getStats = (signal?: AbortSignal) =>
  requestArray<UserStats>('/stats', { signal });

export const getStatsByUserId = (userId: number, signal?: AbortSignal) =>
  request<UserStats>(`/stats/${userId}`, { signal });

export const createStats = (payload: NewUserStats, signal?: AbortSignal) =>
  request<{ id: number | string }>('/stats', { method: 'POST', body: payload, signal });

export const deleteStats = (userId: number, signal?: AbortSignal) =>
  request<{ deleted: number }>(`/stats/${userId}`, { method: 'DELETE', signal });

/* =========================
 * MATCHES
 * ========================= */
export const getMatches = (signal?: AbortSignal) =>
  requestArray<Match>('/matches', { signal });

export const getMatch = (id: number, signal?: AbortSignal) =>
  request<Match>(`/matches/${id}`, { signal });

export const createMatch = (payload: NewMatch, signal?: AbortSignal) =>
  request<{ id: number }>('/matches', { method: 'POST', body: payload, signal });

export const deleteMatch = (id: number, signal?: AbortSignal) =>
  request<{ deleted: number }>(`/matches/${id}`, { method: 'DELETE', signal });

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
