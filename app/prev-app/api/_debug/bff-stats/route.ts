import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEBUG_BFF = process.env.DEBUG_BFF === 'true';

const g = globalThis as unknown as {
  __bffStats?: {
    total: number;
    got401: number;
    refreshAttempt: number;
    refreshSuccess: number;
    refreshFail: number;
    retrySuccess: number;
    retryFail: number;
  };
};

export async function GET() {
  if (!DEBUG_BFF) {
    return new NextResponse(null, { status: 404 });
  }
  const stats = g.__bffStats || {
    total: 0,
    got401: 0,
    refreshAttempt: 0,
    refreshSuccess: 0,
    refreshFail: 0,
    retrySuccess: 0,
    retryFail: 0,
  };
  return NextResponse.json({ ok: true, stats }, { status: 200 });
}
