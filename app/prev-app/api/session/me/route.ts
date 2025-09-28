import { cookies } from 'next/headers';
import { getSession } from '@/src/server/session/store';
import { headers as nextHeaders } from 'next/headers';

export async function GET() {
  const ck = await cookies();
  const sid = ck.get('sid')?.value;
  if (!sid) {
    return new Response(JSON.stringify({ user: null, unreadNotifications: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  const s = await getSession(sid);
  const out = {
    user: s?.user ?? null,
    unreadNotifications: 0,
  };
  return new Response(JSON.stringify(out), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
