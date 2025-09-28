import { NextRequest, NextResponse } from 'next/server';

// Proxies Kakao Local Search with server-side API key
// Query params supported:
// - q or query: keyword (required)
// - page, size, x, y, radius, sort

const KAKAO_ENDPOINT = 'https://dapi.kakao.com/v2/local/search/keyword.json';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const q = sp.get('q') || sp.get('query');
  if (!q) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 400,
        error: 'Bad Request',
        message: 'Missing required parameter: q',
        path: url.pathname,
      },
      { status: 400 },
    );
  }

  const params = new URLSearchParams();
  params.set('query', q);
  if (sp.get('page')) params.set('page', sp.get('page')!);
  if (sp.get('size')) params.set('size', sp.get('size')!);
  if (sp.get('x')) params.set('x', sp.get('x')!);
  if (sp.get('y')) params.set('y', sp.get('y')!);
  if (sp.get('radius')) params.set('radius', sp.get('radius')!);
  if (sp.get('sort')) params.set('sort', sp.get('sort')!);

  const apiKey = process.env.KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 500,
        error: 'Internal Server Error',
        message: 'Kakao API key not configured',
        path: url.pathname,
      },
      { status: 500 },
    );
  }

  const resp = await fetch(`${KAKAO_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    // Cache for a short period to reduce API usage
    next: { revalidate: 60 },
  });

  // Map Kakao errors to standard BFF error schema
  if (!resp.ok) {
    let cause: any = null;
    try {
      cause = await resp.json();
    } catch {
      try {
        cause = await resp.text();
      } catch {
        cause = null;
      }
    }
    // Kakao error codes mapping (best-effort)
    const kakaoCode = typeof cause?.code === 'number' ? cause.code : undefined;
    const mapStatus = (code?: number, httpStatus?: number) => {
      if (code === -4) return 429; // API limit exceeded
      if (code === -1) return 400; // invalid parameter
      if (code === -2) return 500; // permission denied (server config)
      if (code === -3) return 502; // kakao internal
      if (httpStatus && httpStatus >= 400) return httpStatus;
      return 502;
    };
    const status = mapStatus(kakaoCode, resp.status);
    const message =
      kakaoCode === -4
        ? '카카오 API 호출 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요.'
        : kakaoCode === -1
          ? '요청 파라미터가 올바르지 않습니다.'
          : kakaoCode === -2
            ? '내부 서버 오류가 발생했습니다. 카카오 API 인증 설정을 확인해주세요.'
            : kakaoCode === -3
              ? '카카오 API 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
              : '외부 API 호출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status,
        error: status >= 500 ? 'Server Error' : 'Client Error',
        message,
        path: url.pathname,
        cause: typeof cause === 'object' ? cause : { raw: String(cause) },
      },
      { status },
    );
  }

  const body = await resp.text();
  const out = new NextResponse(body, { status: resp.status });
  out.headers.set('Content-Type', resp.headers.get('Content-Type') || 'application/json');
  out.headers.set('Cache-Control', 'public, max-age=60');
  return out;
}
