import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.SPRING_API_BASE_URL as string;
const DEBUG_BFF = process.env.DEBUG_BFF === 'true';
const IS_DEV = process.env.NODE_ENV !== 'production';

// In-memory observability counters (DEV only)
const bffStats = {
  total: 0,
  got401: 0,
  refreshAttempt: 0,
  refreshSuccess: 0,
  refreshFail: 0,
  retrySuccess: 0,
  retryFail: 0,
};

// First-attempt 401 simulator memory (DEV only)
const simulateOnce = new Set<string>();

function reqIdFrom(headers: Headers) {
  const h = headers.get('x-req-id');
  if (h) return h;
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function proxy(req: Request, params: { path?: string[] }) {
  if (!BASE)
    return new Response(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
    });

  bffStats.total++;

  const segs = (params.path ?? []).join('/');
  const url = new URL(req.url);
  const target = new URL(`/api/v1/${segs}${url.search}`, BASE);

  // Forward headers. Prefer passing only safe headers.
  const incoming = new Headers(req.headers);
  const headers = new Headers();
  // X-Req-Id assign/forward
  const reqId = reqIdFrom(incoming);
  headers.set('x-req-id', reqId);
  // copy selected headers
  const pass = ['content-type', 'accept', 'accept-encoding'];
  for (const k of pass) {
    const v = incoming.get(k);
    if (v) headers.set(k, v);
  }
  // attach cookie from next/headers for server-side BFF
  const cookieStore = await cookies();
  const cookieStr = cookieStore.toString();
  if (cookieStr) headers.set('cookie', cookieStr);

  const init: RequestInit = {
    method: req.method,
    headers,
    // GET/HEAD must not include body
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : (req as any).body,
    redirect: 'manual',
    cache: 'no-store',
  };

  let upstream: Response;
  // DEV-only: deterministic first-attempt 401 simulator
  const wantSim401 = IS_DEV && url.searchParams.get('__simulate401') === '1';
  const simKey = `${url.pathname}${url.search}`;
  if (wantSim401 && !simulateOnce.has(simKey) && req.method === 'GET') {
    simulateOnce.add(simKey);
    upstream = new Response(null, { status: 401 });
    if (DEBUG_BFF) console.info(JSON.stringify({ tag: 'bff', event: 'simulated_401', reqId, segs }));
  } else {
    upstream = await fetch(target.toString(), init);
  }

  // Single-attempt 401 recovery for GET only: refresh then retry once with header token
  const isEligibleGet = req.method === 'GET' && upstream.status === 401 && !segs.startsWith('auth/refresh');
  let refreshRes: Response | null = null;
  if (isEligibleGet) {
    bffStats.got401++;
    try {
      const refreshUrl = new URL('/api/v1/auth/refresh', BASE).toString();
      const refreshInit: RequestInit = { method: 'POST', headers, redirect: 'manual', cache: 'no-store' };
      // Never include body for refresh
      delete (refreshInit as any).body;
      bffStats.refreshAttempt++;
      if (DEBUG_BFF) console.info(JSON.stringify({ tag: 'bff', event: 'refresh_attempt', reqId, segs }));
      refreshRes = await fetch(refreshUrl, refreshInit);
      if (refreshRes.ok) {
        bffStats.refreshSuccess++;
        // Extract access token from headers
        const h =
          refreshRes.headers.get('authorization') ||
          refreshRes.headers.get('Authorization') ||
          refreshRes.headers.get('x-access-token') ||
          refreshRes.headers.get('X-Access-Token');
        if (h) {
          const token = h.startsWith('Bearer') ? h : `Bearer ${h}`;
          const retryHeaders = new Headers(headers);
          retryHeaders.set('authorization', token);
          const backoff = 200 + Math.floor(Math.random() * 300);
          await new Promise((r) => setTimeout(r, backoff));
          const retryRes = await fetch(target.toString(), {
            method: 'GET',
            headers: retryHeaders,
            redirect: 'manual',
            cache: 'no-store',
          });
          upstream = retryRes;
          if (upstream.status >= 200 && upstream.status < 300) {
            bffStats.retrySuccess++;
            if (DEBUG_BFF) console.info(JSON.stringify({ tag: 'bff', event: 'retry_success', reqId, segs, status: upstream.status }));
          } else {
            bffStats.retryFail++;
            if (DEBUG_BFF) console.info(JSON.stringify({ tag: 'bff', event: 'retry_fail', reqId, segs, status: upstream.status }));
          }
        }
      } else {
        bffStats.refreshFail++;
        if (DEBUG_BFF) console.info(JSON.stringify({ tag: 'bff', event: 'refresh_failed', reqId, segs, status: refreshRes.status }));
      }
    } catch (e) {
      bffStats.refreshFail++;
      if (DEBUG_BFF) console.info(JSON.stringify({ tag: 'bff', event: 'refresh_error', reqId, segs, error: (e as any)?.message }));
    }
  }

  const out = new Response(upstream.body, { status: upstream.status, headers: new Headers(upstream.headers) });
  // propagate Set-Cookie (multiple) from final response
  upstream.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') out.headers.append('set-cookie', v);
  });
  // also propagate cookies from refresh if any
  if (refreshRes) {
    refreshRes.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'set-cookie') out.headers.append('set-cookie', v);
    });
  }
  return out;
}

export const GET = async (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => {
  const { path } = await ctx.params;
  return proxy(req, { path });
};
export const POST = async (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => {
  const { path } = await ctx.params;
  return proxy(req, { path });
};
export const PUT = async (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => {
  const { path } = await ctx.params;
  return proxy(req, { path });
};
export const PATCH = async (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => {
  const { path } = await ctx.params;
  return proxy(req, { path });
};
export const DELETE = async (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => {
  const { path } = await ctx.params;
  return proxy(req, { path });
};
export const OPTIONS = async (req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) => {
  const { path } = await ctx.params;
  return proxy(req, { path });
};
