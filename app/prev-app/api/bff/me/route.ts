import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL('/api/session/me', req.url);
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { cookie: req.headers.get('cookie') || '' },
    cache: 'no-store',
  });
  const body = await res.text();
  const out = new NextResponse(body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  });
  out.headers.set('cache-control', 'no-store');
  return out;
}