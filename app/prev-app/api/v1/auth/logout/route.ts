import { cookies } from 'next/headers';

function normalizeBase(raw?: string) {
  const base = (raw || '').replace(/\/$/, '');
  // Remove trailing /api or /api/v1 if present, then add /api/v1 once
  const stripped = base.replace(/\/(?:api)(?:\/v1)?$/, '');
  return `${stripped}/api/v1`;
}

export async function POST() {
  const raw = process.env.SPRING_API_BASE_URL;
  if (!raw) {
    return new Response(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const base = normalizeBase(raw);
  const target = `${base}/auth/logout`;

  const cookieStore = await cookies();
  const cookieStr = cookieStore.toString();

  // Forward the client's cookies to backend, and propagate Set-Cookie back.
  const res = await fetch(target, {
    method: 'POST',
    headers: cookieStr ? { cookie: cookieStr } : undefined,
  });

  const out = new Response(await res.arrayBuffer(), { status: res.status });
  res.headers.forEach((v, k) => {
    const key = k.toLowerCase();
    if (key === 'set-cookie') out.headers.append('set-cookie', v);
    if (key === 'content-type') out.headers.set('content-type', v);
  });
  return out;
}
