// Lightweight wsToken fetcher with caching and single-flight
// Expects backend BFF route: /api/bff/ws/token → { token: string, expiresAt?: string, ttl?: number }

export type WsTokenResp = { token: string; expiresAt?: string; ttl?: number };

type Cache = { token: string; expAt: number };
let cache: Cache | null = null;
let inflight: Promise<string> | null = null;

function now() { return Date.now(); }
function toMs(resp: WsTokenResp) {
  if (resp && typeof resp.expiresAt === 'string') {
    const t = Date.parse(resp.expiresAt);
    if (!Number.isNaN(t)) return t;
  }
  if (resp && typeof resp.ttl === 'number') return now() + Math.max(0, resp.ttl) * 1000;
  return now() + 60_000; // default 60s
}

export async function fetchWsToken(): Promise<Cache> {
  const res = await fetch('/api/bff/ws/token', { method: 'POST', credentials: 'include', cache: 'no-store' });
  if (res.status === 401) {
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:expired')); } catch {}
    throw new Error('wsToken unauthorized');
  }
  if (!res.ok) throw new Error(`wsToken failed: ${res.status}`);

  // Try to parse JSON (support both plain and wrapped payloads)
  const raw: any = await res.json().catch(() => null);
  const body = raw && typeof raw === 'object' && 'data' in raw ? (raw as any).data : raw;

  // Try header fallbacks
  const headerToken = (() => {
    const h =
      res.headers.get('authorization') ||
      res.headers.get('Authorization') ||
      res.headers.get('x-ws-token') ||
      res.headers.get('X-Ws-Token') ||
      res.headers.get('X-WS-Token');
    if (!h) return null;
    const m = /^\s*Bearer\s+(.+)$/i.exec(h);
    return (m ? m[1] : h).trim();
  })();

  const token: string | null =
    (body && typeof body.token === 'string' && body.token) ||
    (body && typeof body.wsToken === 'string' && body.wsToken) ||
    (body && typeof body.accessToken === 'string' && body.accessToken) ||
    headerToken ||
    null;

  const expiresAt: string | undefined =
    (body && typeof body.expiresAt === 'string' && body.expiresAt) ||
    res.headers.get('x-ws-token-expires-at') ||
    undefined;

  if (!token) throw new Error('invalid wsToken payload');

  const expAt = toMs({ token, expiresAt });
  return { token, expAt };
}

export async function getValidWsToken(): Promise<string> {
  const earlyRefreshWindowMs = 60_000; // refresh if expiring within 60s
  if (cache && cache.expAt - now() > earlyRefreshWindowMs) return cache.token;
  if (!inflight) {
    inflight = fetchWsToken()
      .then((c) => {
        cache = c;
        return c.token;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function clearWsTokenCache() { cache = null; }