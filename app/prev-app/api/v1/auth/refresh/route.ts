import { cookies } from 'next/headers';

export async function POST() {
  const base = process.env.SPRING_API_BASE_URL;
  if (!base) {
    return new Response(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const target = new URL('/api/v1/auth/refresh', base);

  const cookieStore = await cookies();
  const cookieStr = cookieStore.toString();

  const res = await fetch(target.toString(), {
    method: 'POST',
    headers: cookieStr ? { cookie: cookieStr } : undefined,
    redirect: 'manual',
  });

  const out = new Response(res.body, { status: res.status, headers: new Headers(res.headers) });
  // propagate Set-Cookie (multiple)
  res.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') out.headers.append('set-cookie', v);
  });
  return out;
}
