import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.SPRING_API_BASE_URL as string | undefined;

async function proxyWsToken(req: NextRequest, method: 'GET' | 'POST') {
  if (!BASE) {
    return new NextResponse(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const headers = new Headers();
  const cookie = req.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const target = new URL(`${BASE.replace(/\/$/, '')}/api/v1/ws/token`);
  const up = await fetch(target.toString(), { method, headers, cache: 'no-store', redirect: 'manual' });
  const out = new NextResponse(up.body, { status: up.status, headers: new Headers(up.headers) });
  up.headers.forEach((v, k) => { if (k.toLowerCase() === 'set-cookie') out.headers.append('set-cookie', v); });
  out.headers.set('cache-control', 'no-store');
  return out;
}

export async function POST(req: NextRequest) {
  return proxyWsToken(req, 'POST');
}
