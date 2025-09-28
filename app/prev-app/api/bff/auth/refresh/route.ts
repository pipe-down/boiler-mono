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
    if (lower === 'domain') continue;
    if (lower === 'secure') { if (isProd || isHttps) out.push('Secure'); continue; }
    if (lower === 'path') { hasPath = true; out.push(`Path=${val || '/'}`); continue; }
    if (lower === 'samesite') { hasSameSite = true; out.push(`SameSite=${(isProd && isHttps) ? (val || 'Lax') : 'Lax'}`); continue; }
    out.push(p);
  }
  if (!hasPath) out.push('Path=/');
  if (!hasSameSite) out.push('SameSite=' + ((isProd && isHttps) ? 'Lax' : 'Lax'));
  return out.join('; ');
}

export async function POST(req: NextRequest) {
  if (!BASE) {
    return new NextResponse(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const headers = new Headers();
  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const target = new URL(`${BASE.replace(/\/$/, '')}/api/v1/auth/refresh`);
  const res = await fetch(target.toString(), {
    method: 'POST',
    headers,
    cache: 'no-store',
    redirect: 'manual',
  });
  const out = new NextResponse(res.body, {
    status: res.status,
    headers: new Headers(res.headers),
  });
  res.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') out.headers.append('set-cookie', normalizeSetCookie(v, req));
  });
  out.headers.set('cache-control', 'no-store');
  return out;
}