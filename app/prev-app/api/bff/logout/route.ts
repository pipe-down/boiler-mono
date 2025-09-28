import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.SPRING_API_BASE_URL as string | undefined;

export async function POST(req: NextRequest) {
  if (!BASE) {
    return new NextResponse(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1) Backend logout
  const headers = new Headers();
  const cookie = req.headers.get('cookie') || '';
  if (cookie) headers.set('cookie', cookie);

  // Extract AT from cookies to help backend blacklist access token
  const atMatch = /(?:^|;\s*)AT=([^;]+)/.exec(cookie);
  if (atMatch?.[1]) {
    try {
      const at = decodeURIComponent(atMatch[1]);
      headers.set('authorization', `Bearer ${at}`);
    } catch {}
  }

  const upstream = await fetch(new URL(`${BASE.replace(/\/$/, '')}/api/v1/auth/logout`).toString(), {
    method: 'POST',
    headers,
    cache: 'no-store',
    redirect: 'manual',
  });

  // 2) Clear local session
  const clear = await fetch(new URL('/api/session', req.url).toString(), {
    method: 'DELETE',
    cache: 'no-store',
  });

  const status = upstream.ok && clear.ok ? 200 : upstream.status || 500;
  const bodyText = upstream.ok ? 'OK' : await upstream.text().catch(() => 'Logout failed');
  const out = new NextResponse(bodyText, { status });

  // propagate all Set-Cookie headers from both backend and local session delete
  const appendSetCookies = (h: Headers) => {
    h.forEach((v, k) => { if (k.toLowerCase() === 'set-cookie') out.headers.append('set-cookie', v); });
  };
  appendSetCookies(upstream.headers);
  appendSetCookies(clear.headers);

  out.headers.set('cache-control', 'no-store');
  return out;
}
