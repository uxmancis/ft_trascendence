// src/api.ts
// export const API_URL =
//   (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
//   'http://' + HOSTNAME + ':3000';
export const API_URL = import.meta?.env?.VITE_API_URL?.replace(/\/+$/, '') ||
    'http://c4r6s3.42urduliz.com:3000';
export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}
async function request(path, { method = 'GET', body, signal, timeoutMs = 10000, headers } = {}) {
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
            return undefined;
        }
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await res.json() : undefined;
        if (!res.ok) {
            const message = data?.message || data?.error || `HTTP ${res.status}`;
            throw new ApiError(message, res.status);
        }
        return data;
    }
    catch (e) {
        if (e?.name === 'AbortError')
            throw new ApiError('Timeout de petición', 499);
        if (e instanceof ApiError)
            throw e;
        throw new ApiError(e?.message || 'Error de red', 0);
    }
    finally {
        clearTimeout(timeoutId);
    }
}
/* =========================
 * Helpers de arrays seguros
 * ========================= */
function ensureArray(v) {
    return Array.isArray(v) ? v : [];
}
async function requestArray(path, opts) {
    try {
        const data = await request(path, opts);
        return ensureArray(data);
    }
    catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 204))
            return [];
        throw e;
    }
}
/* =========================
 * USERS
 * ========================= */
export const getUsers = (signal) => requestArray('/users', { signal });
export const getUser = (id, signal) => request(`/users/${id}`, { signal });
export const createUser = (payload, signal) => request('/users', { method: 'POST', body: payload, signal });
export const deleteUser = (id, signal) => request(`/users/${id}`, { method: 'DELETE', signal });
/* =========================
 * STATS
 * ========================= */
export const getStats = (signal) => requestArray('/stats', { signal });
export const getStatsByUserId = (userId, signal) => request(`/stats/${userId}`, { signal });
export const createStats = (payload, signal) => request('/stats', { method: 'POST', body: payload, signal });
export const deleteStats = (userId, signal) => request(`/stats/${userId}`, { method: 'DELETE', signal });
/* =========================
 * MATCHES
 * ========================= */
export const getMatches = (signal) => requestArray('/matches', { signal });
export const getMatch = (id, signal) => request(`/matches/${id}`, { signal });
export const createMatch = (payload, signal) => request('/matches', { method: 'POST', body: payload, signal });
export const deleteMatch = (id, signal) => request(`/matches/${id}`, { method: 'DELETE', signal });
/* =========================
 * Extra: timeout helper
 * ========================= */
export function withTimeout(ms) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    return {
        signal: controller.signal,
        cancel: () => clearTimeout(id),
    };
}
