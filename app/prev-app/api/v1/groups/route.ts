import { NextRequest } from 'next/server';
const SPRING = process.env.SPRING_API_BASE_URL!;

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(`${SPRING}/groups?${qs}`, {
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  });
  return new Response(await res.arrayBuffer(), { status: res.status, headers: res.headers });
}
