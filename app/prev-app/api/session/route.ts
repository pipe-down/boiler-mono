import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { getSession, setSession, deleteSession } from '@/src/server/session/store';

function serializeSetCookie(name: string, value: string, opts?: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number; // seconds
}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts?.path) parts.push(`Path=${opts.path}`); else parts.push('Path=/');
  if (opts?.httpOnly !== false) parts.push('HttpOnly');
  if (opts?.secure !== false) parts.push('Secure');
  parts.push(`SameSite=${(opts?.sameSite || 'Lax').charAt(0).toUpperCase() + (opts?.sameSite || 'Lax').slice(1)}`);
  if (typeof opts?.maxAge === 'number') parts.push(`Max-Age=${Math.max(0, Math.floor(opts.maxAge))}`);
  return parts.join('; ');
}

export async function POST(req: Request) {
  // Expect backend has authenticated already and sent us user + maybe backend cookie to keep
  // Request body can include user and optional backendCookie; real world would verify via backend callback
  const body = await req.json().catch(() => ({}));
  const user = body?.user as { id: string; name: string; email?: string; avatar?: string } | undefined;
  const backendCookie = body?.backendCookie as string | undefined;

  if (!user || !user.id || !user.name) {
    return new Response(JSON.stringify({ message: 'Invalid login payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sid = randomBytes(24).toString('hex');
  await setSession(sid, { user, backendCookie: backendCookie || null });

  const isProd = process.env.NODE_ENV === 'production';
  const ck = serializeSetCookie('sid', sid, {
    httpOnly: true,
    secure: isProd, // In dev (http), do not set Secure so cookie can be stored
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7d
  });

  const res = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  res.headers.append('Set-Cookie', ck);
  return res;
}

export async function DELETE() {
  const ck = await cookies();
  const sid = ck.get('sid')?.value;
  if (sid) await deleteSession(sid);
  const res = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  res.headers.append('Set-Cookie', serializeSetCookie('sid', '', { path: '/', maxAge: 0, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }));
  return res;
}
