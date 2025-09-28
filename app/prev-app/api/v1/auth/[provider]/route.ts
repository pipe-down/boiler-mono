import { NextResponse } from 'next/server';

type Ctx = { params: Promise<{ provider: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { provider: rawProvider } = await ctx.params;
  const provider = (rawProvider || '').toLowerCase();
  const base = process.env.SPRING_API_BASE_URL;
  if (!base) {
    return NextResponse.json({ message: 'SPRING_API_BASE_URL is not set' }, { status: 500 });
  }

  // Backend OAuth2 authorization endpoint
  // e.g., https://api.example.com/oauth2/authorization/{provider}
  const target = new URL(`/oauth2/authorization/${provider}`, base);

  // Optional: pass-through redirect_uri if provided by FE
  const url = new URL(req.url);
  const redirectUri = url.searchParams.get('redirect_uri');
  if (redirectUri) target.searchParams.set('redirect_uri', redirectUri);

  return NextResponse.redirect(target.toString());
}
