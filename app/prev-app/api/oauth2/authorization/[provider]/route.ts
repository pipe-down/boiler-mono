import { cookies } from 'next/headers';

function normalizeSetCookieDev(v: string, req: Request): string {
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

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const raw = process.env.SPRING_API_BASE_URL;
  if (!raw) {
    return new Response(JSON.stringify({ message: 'SPRING_API_BASE_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const base = (raw || '').replace(/\/$/, '');
  const target = `${base}/oauth2/authorization/${encodeURIComponent(provider)}`;

  const reqUrl = new URL(req.url);
  const silent = reqUrl.searchParams.get('silent') === 'true';

  // Initiate OAuth through backend, forward cookies and propagate Set-Cookie and Location headers.
  const cookieStore = await cookies();
  const cookieStr = cookieStore.toString();
  const res = await fetch(target + (reqUrl.search ? reqUrl.search : ''), {
    method: 'GET',
    headers: cookieStr ? { cookie: cookieStr } : undefined,
    redirect: 'manual',
  });

  // Build a response that preserves status and headers (Location/Set-Cookie)
  const out = new Response(null, { status: res.status });
  res.headers.forEach((v, k) => {
    const key = k.toLowerCase();
    if (key === 'set-cookie') out.headers.append('set-cookie', normalizeSetCookieDev(v, req));
    if (key === 'location') out.headers.set('location', v);
    if (key === 'content-type') out.headers.set('content-type', v);
    if (key === 'cache-control') out.headers.set('cache-control', v);
  });
  // Mark this as a silent flow so the callback can auto-close
  if (silent) {
    out.headers.append('set-cookie', 'oauth_silent=1; Max-Age=600; Path=/; SameSite=Lax');
  }
  return out;
}
