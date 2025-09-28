import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const BASE = process.env.SPRING_API_BASE_URL as string | undefined;

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function reqIdFrom(headers: Headers) {
  const h = headers.get('x-request-id') || headers.get('x-req-id');
  if (h) return h;
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildTargetUrl(req: NextRequest, segs: string[]) {
  const base = (BASE || 'http://localhost:9094').replace(/\/$/, '');
  const u = new URL(`${base}/api/v1/${(segs || []).join('/')}`);
  req.nextUrl.searchParams.forEach((v, k) => u.searchParams.append(k, v));
  return u;
}

function cloneHeaders(req: NextRequest, reqId: string) {
  const incoming = req.headers;
  const headers = new Headers();
  incoming.forEach((v, k) => {
    if (!HOP_BY_HOP.has(k.toLowerCase())) headers.set(k, v);
  });
  headers.set('x-req-id', reqId);
  // Explicit cookie forward
  const cookie = incoming.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  return headers;
}

function extractCookie(name: string, cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const m = new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '=([^;]+)').exec(cookieHeader);
  return m ? m[1] : null;
}

function noStore(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

async function doFetch(upstream: URL, req: NextRequest, headers: Headers) {
  const init: RequestInit & { duplex?: 'half' } = {
    method: req.method,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  };
  // Node(undici)에서는 스트림 전송 시 duplex 필요, Edge/브라우저는 비스트림화로 호환
  const IS_NODE = !!(process as any)?.versions?.node;
  if (req.method !== 'GET' && req.method !== 'HEAD' && (req as any).body) {
    if (IS_NODE) {
      // 스트림 그대로 프록시
      // @ts-ignore - NextRequest has body stream
      init.body = req.body as any;
      init.duplex = 'half';
    } else {
      // 런타임이 Edge/브라우저일 때: 비스트림화로 전송(duplex 불필요)
      const ab = await req.arrayBuffer();
      init.body = ab.byteLength ? ab : undefined;
    }
  }
  return fetch(upstream, init);
}

function normalizeSetCookie(v: string, req: NextRequest): string {
  // Dev helper: adjust cookie attributes to be settable on localhost:3000 over http
  const isProd = process.env.NODE_ENV === 'production';
  const url = new URL(req.url);
  const isHttps = url.protocol === 'https:';
  const parts = v.split(/;\s*/);
  const out: string[] = [];
  let hasPath = false;
  let hasSameSite = false;
  for (const p of parts) {
    const [kRaw, ...rest] = p.split('=');
    const k = kRaw.trim();
    const val = rest.join('=');
    const lower = k.toLowerCase();
    if (lower === 'domain') {
      // drop Domain to make host-only cookie for FE host
      continue;
    }
    if (lower === 'secure') {
      // drop Secure on http (dev)
      if (isProd || isHttps) out.push('Secure');
      continue;
    }
    if (lower === 'path') {
      hasPath = true;
      out.push(`Path=${val || '/'}`);
      continue;
    }
    if (lower === 'samesite') {
      hasSameSite = true;
      // Force Lax on dev/http to ensure cookie set
      const norm = isProd && isHttps ? (val || 'Lax') : 'Lax';
      out.push(`SameSite=${norm}`);
      continue;
    }
    out.push(p);
  }
  if (!hasPath) out.push('Path=/');
  if (!hasSameSite) out.push('SameSite=' + ((isProd && isHttps) ? 'Lax' : 'Lax'));
  if (!isProd && !isHttps) {
    // ensure Secure removed on http
    // (already handled above by ignoring 'Secure')
  }
  return out.join('; ');
}

function passThrough(upstream: Response, extraSetCookies: string[] = [], req?: NextRequest) {
  const headers = new Headers();
  upstream.headers.forEach((v, k) => {
    if (!HOP_BY_HOP.has(k.toLowerCase())) headers.set(k, v);
  });
  const out = new NextResponse(upstream.body, { status: upstream.status, headers });
  // propagate Set-Cookie (multiple values)
  upstream.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') out.headers.append('set-cookie', req ? normalizeSetCookie(v, req) : v);
  });
  for (const ck of extraSetCookies) out.headers.append('set-cookie', req ? normalizeSetCookie(ck, req) : ck);
  return noStore(out);
}

async function refreshOnce(req: NextRequest, reqId: string) {
  const base = (BASE || 'http://localhost:9094').replace(/\/$/, '');
  const url = new URL(`${base}/api/v1/auth/refresh`);
  const headers = new Headers();
  headers.set('x-req-id', reqId);
  const ck = req.headers.get('cookie');
  if (ck) headers.set('cookie', ck);
  const res = await fetch(url, { method: 'POST', headers, cache: 'no-store', redirect: 'manual' });
  const setCookies: string[] = [];
  res.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') setCookies.push(v);
  });
  // Extract header token for immediate retry if provided by backend
  const headerTokenRaw =
    res.headers.get('authorization') ||
    res.headers.get('Authorization') ||
    res.headers.get('x-access-token') ||
    res.headers.get('X-Access-Token');
  const headerToken = (() => {
    if (!headerTokenRaw) return null;
    const m = /^\s*Bearer\s+(.+)$/i.exec(headerTokenRaw);
    return (m ? m[1] : headerTokenRaw).trim();
  })();
  return { ok: res.ok, res, setCookies, headerToken } as const;
}

// Single-flight refresh lock per sid to avoid token rotation races
const REFRESH_LOCKS = new Map<string, Promise<{ ok: boolean; setCookies: string[]; headerToken: string | null }>>();
function getRefreshKey(req: NextRequest) {
  const ck = req.headers.get('cookie') || '';
  const m = /(?:^|; )sid=([^;]+)/.exec(ck);
  return m ? `sid:${m[1]}` : 'sid:anonymous';
}
async function refreshSingleFlight(req: NextRequest, reqId: string) {
  const key = getRefreshKey(req);
  const existing = REFRESH_LOCKS.get(key);
  if (existing) {
    try { return await existing; } finally {}
  }
  const p: Promise<{ ok: boolean; setCookies: string[]; headerToken: string | null }> = (async () => {
    const { ok, setCookies, headerToken } = await refreshOnce(req, reqId);
    let finalHeaderToken = headerToken;
    if (!finalHeaderToken && setCookies && setCookies.length) {
      try {
        const pairs = parseSetCookiePairs(setCookies);
        const at = pairs['AT'];
        if (at) finalHeaderToken = decodeURIComponent(at);
      } catch {}
    }
    return { ok, setCookies, headerToken: finalHeaderToken };
  })();
  REFRESH_LOCKS.set(key, p);
  try { return await p; } finally { REFRESH_LOCKS.delete(key); }
}

function parseSetCookiePairs(setCookies: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const sc of setCookies) {
    const first = sc.split(';', 1)[0];
    const eq = first.indexOf('=');
    if (eq > 0) {
      const name = first.slice(0, eq).trim();
      const val = first.slice(eq + 1).trim();
      if (name) out[name] = val;
    }
  }
  return out;
}

function mergeCookieHeader(origCookie: string | null | undefined, add: Record<string, string>): string {
  const map: Record<string, string> = {};
  if (origCookie) {
    for (const part of origCookie.split(/;\s*/)) {
      const eq = part.indexOf('=');
      if (eq > 0) {
        const k = part.slice(0, eq).trim();
        const v = part.slice(eq + 1).trim();
        if (k) map[k] = v;
      }
    }
  }
  for (const [k, v] of Object.entries(add)) map[k] = v;
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function handler(req: NextRequest, segs: string[]) {
  if (!BASE) {
    return new NextResponse(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const reqId = reqIdFrom(req.headers);
  const upstream = buildTargetUrl(req, segs || []);
  const headers = cloneHeaders(req, reqId);

  // Attach Authorization from AT cookie on first attempt if present and not an auth endpoint
  const segStr = (segs || []).join('/');
  if (!segStr.startsWith('auth/')) {
    try {
      const ck = headers.get('cookie') || req.headers.get('cookie') || '';
      const at = extractCookie('AT', ck);
      if (at && !headers.has('authorization')) {
        const token = decodeURIComponent(at);
        if (token) headers.set('authorization', `Bearer ${token}`);
      }
    } catch {}
  }

  let upRes = await doFetch(upstream, req, headers);

  // Single-attempt GET 401 recovery: refresh (single-flight), then retry once.
  if (req.method === 'GET' && upRes.status === 401 && !(segs || []).join('/').startsWith('auth/refresh')) {
    try {
      const { ok, setCookies, headerToken } = await refreshSingleFlight(req, reqId);
      if (ok) {
        // Build retry headers: prefer Authorization; otherwise merge new cookies for immediate retry
        const h = new Headers(headers);
        if (headerToken) {
          h.set('authorization', `Bearer ${headerToken}`);
        } else if (setCookies && setCookies.length) {
          const addPairs = parseSetCookiePairs(setCookies);
          const mergedCookie = mergeCookieHeader(h.get('cookie'), addPairs);
          if (mergedCookie) h.set('cookie', mergedCookie);
        }
        upRes = await doFetch(upstream, req, h);
        const out = passThrough(upRes, setCookies, req);
        out.headers.set('x-bff-refresh', 'attempted');
        return out;
      }
    } catch {}
  }

  return passThrough(upRes, [], req);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return handler(req, path || []);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return handler(req, path || []);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return handler(req, path || []);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return handler(req, path || []);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return handler(req, path || []);
}
