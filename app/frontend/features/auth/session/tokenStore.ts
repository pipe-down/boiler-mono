
// Lightweight in-memory token store and on-demand refresher for WS/STOMP and API.
// Tokens are not persisted across reloads; they are refreshed using the backend refresh endpoint
// (relying on httpOnly cookies). This keeps compatibility with the A-pattern while enabling
// CONNECT header auth for STOMP.

let ACCESS_TOKEN: string | null = null;
let ACCESS_EXPIRES_AT: number | null = null; // epoch ms
let REFRESH_PROMISE: Promise<string | null> | null = null;

const DEBUG = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

export function setAccessToken(token: string | null, expiresAt?: number | null) {
  ACCESS_TOKEN = token || null;
  ACCESS_EXPIRES_AT = typeof expiresAt === 'number' ? expiresAt : ACCESS_EXPIRES_AT;
}

export function getAccessToken(): string | null {
  return ACCESS_TOKEN;
}

export function clearAccessToken() {
  ACCESS_TOKEN = null;
  ACCESS_EXPIRES_AT = null;
}

function parseBearerFromHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const m = /^\s*Bearer\s+(.+)$/i.exec(value);
  return (m ? m[1] : value).trim();
}

async function refreshOnce(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    if (DEBUG) {
      try { console.info('[auth] refresh: requesting /api/v1/auth/refresh'); } catch {}
    }
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      if (DEBUG) {
        try { console.warn('[auth] refresh failed:', res.status); } catch {}
      }
      return null;
    }
    // Prefer headers
    const headerToken = parseBearerFromHeaderValue(
      res.headers.get('authorization') ||
        res.headers.get('Authorization') ||
        res.headers.get('x-access-token') ||
        res.headers.get('X-Access-Token'),
    );
    let expAtHeader: number | null = null;
    const expHeader = res.headers.get('x-access-token-expires-at') || res.headers.get('X-Access-Token-Expires-At');
    if (expHeader && !Number.isNaN(Number(expHeader))) {
      expAtHeader = Number(expHeader);
    }
    let finalToken = headerToken;
    // Fallback to body
    if (!finalToken) {
      const body = await res.clone().json().catch(() => null as any);
      const t = body?.data?.accessToken || body?.accessToken;
      if (typeof t === 'string' && t) finalToken = t;
      const expRaw = body?.data?.accessTokenExpiresIn ?? body?.accessTokenExpiresIn;
      if (!expAtHeader && typeof expRaw === 'number' && expRaw > 0) {
        expAtHeader = expRaw > 1e12 ? expRaw : Date.now() + expRaw * 1000;
      }
    }
    if (typeof finalToken === 'string' && finalToken) {
      setAccessToken(finalToken, expAtHeader || undefined);
      // Broadcast to other tabs
      try {
        new BroadcastChannel('auth-refresh').postMessage({ type: 'token-refreshed', accessToken: finalToken });
      } catch {}
      return finalToken;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function ensureAccessTokenFresh(minTTLms = 60_000): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const now = Date.now();
  if (ACCESS_TOKEN && typeof ACCESS_EXPIRES_AT === 'number' && ACCESS_EXPIRES_AT > 0) {
    const ttl = ACCESS_EXPIRES_AT - now;
    if (ttl > minTTLms) return ACCESS_TOKEN;
  }
  if (!REFRESH_PROMISE) {
    REFRESH_PROMISE = (async () => {
      const t = await refreshOnce();
      REFRESH_PROMISE = null;
      return t;
    })();
  }
  return REFRESH_PROMISE;
}
