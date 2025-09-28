import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.SPRING_API_BASE_URL as string | undefined;

function normalizeSetCookie(v: string, req: NextRequest): string {
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
      const norm = isProd && isHttps ? (val || 'Lax') : 'Lax';
      out.push(`SameSite=${norm}`);
      continue;
    }
    out.push(p);
  }
  if (!hasPath) out.push('Path=/');
  if (!hasSameSite) out.push('SameSite=' + ((isProd && isHttps) ? 'Lax' : 'Lax'));
  return out.join('; ');
}

export async function GET(req: NextRequest) {
  if (!BASE) {
    return new NextResponse(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // Build upstream URL, preserve search params
  const upstream = new URL(`${BASE.replace(/\/$/, '')}/api/v1/auth/bypass-login/redirect`);
  req.nextUrl.searchParams.forEach((v, k) => upstream.searchParams.append(k, v));

  // Perform server-side request so we can capture Set-Cookie and propagate to FE origin
  const res = await fetch(upstream.toString(), { method: 'GET', redirect: 'manual', cache: 'no-store' });

  // Determine final redirect target: always land on FE /oauth-callback
  const rawLoc = res.headers.get('location') || res.headers.get('Location') || '/oauth-callback';
  const origLocUrl = (() => {
    try { return new URL(rawLoc, req.url); } catch { return new URL('/oauth-callback', req.url); }
  })();
  const finalLoc = new URL('/oauth-callback', req.url);
  // Preserve original upstream query parameters if present
  try {
    origLocUrl.searchParams.forEach((v, k) => finalLoc.searchParams.set(k, v));
  } catch {}
  // Ensure silent and next from original request are preserved
  const silent = req.nextUrl.searchParams.get('silent');
  const next = req.nextUrl.searchParams.get('next');
  if (silent != null) finalLoc.searchParams.set('silent', silent);
  if (next) finalLoc.searchParams.set('next', next);

  const out = NextResponse.redirect(finalLoc);

  // Propagate Set-Cookie headers (normalize for FE origin)
  res.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') {
      out.headers.append('set-cookie', normalizeSetCookie(v, req));
    }
  });

  // Mark silent-mode via helper cookie for robust callback behavior in iframe
  if ((silent || '').toLowerCase() === 'true') {
    out.headers.append('set-cookie', 'oauth_silent=1; Max-Age=600; Path=/; SameSite=Lax');
  }

  // No-store headers
  out.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  out.headers.set('Pragma', 'no-cache');
  out.headers.set('Expires', '0');

  return out;
}
