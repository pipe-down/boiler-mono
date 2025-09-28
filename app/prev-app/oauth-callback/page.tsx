'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { broadcastAuth } from '@/src/lib/auth-broadcast';
import { invalidateAllApiCaches } from '@/src/lib/swr-cache';

function OAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    (async () => {
      // Detect silent mode via query or helper cookie
      const silentParam = searchParams.get('silent') === 'true';
      let isSilent = silentParam;
      try {
        isSilent = isSilent || (document.cookie?.includes('oauth_silent=1') ?? false);
      } catch {}

      // Helper: get user from BFF
      async function fetchUser(token?: string | null): Promise<any | null> {
        try {
const me = await fetch('/api/bff/users/me', {
            method: 'GET',
            credentials: 'include',
            headers: token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : undefined,
          });
          if (me.ok) {
            const raw = await me.json().catch(() => null);
            return raw && typeof raw === 'object' && 'data' in raw ? (raw as any).data : raw;
          }
          return null;
        } catch {
          return null;
        }
      }

      // 1) Try to get user directly (cookies should be set by auth redirect)
      let user = await fetchUser();

      // 2) If not yet available, try server-side refresh via BFF, then retry with header token
      if (!user) {
        let headerToken: string | null = null;
        try {
const ref = await fetch('/api/bff/auth/refresh', { method: 'POST', credentials: 'include' });
          const h =
            ref.headers.get('authorization') ||
            ref.headers.get('Authorization') ||
            ref.headers.get('x-access-token') ||
            ref.headers.get('X-Access-Token');
          headerToken = h ? h.trim() : null;
        } catch {}
        user = await fetchUser(headerToken);
      }

      if (user && user.id) {
        // 3) Create opaque sid session on FE server (A-pattern)
        try {
          await fetch('/api/session', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              user: {
                id: String(user.id),
                name: user.name ?? '',
                email: user.email ?? '',
                avatar: user.profileImageUrl ?? user.avatar ?? undefined,
              },
            }),
          });
        } catch {}

        // Notify other tabs and refresh SSR boundary
        try {
          broadcastAuth('token-refreshed');
        } catch {}
        mutate('me');
        try { invalidateAllApiCaches(); } catch {}
        router.refresh();

        if (isSilent) {
          try {
            document.cookie = 'oauth_silent=; Max-Age=0; Path=/; SameSite=Lax';
          } catch {}
          try {
            window.close();
          } catch {}
          return;
        }

        const targetFromParam = (() => {
          const n = searchParams.get('next') || searchParams.get('redirect') || '';
          if (n && n.startsWith('/') && !n.startsWith('/api/')) return n;
          return null;
        })();
        const targetFromSession = (() => {
          try {
            return sessionStorage.getItem('redirectAfterLogin');
          } catch {
            return null;
          }
        })();
        const target =
          targetFromParam ||
          (targetFromSession && targetFromSession.startsWith('/') && !targetFromSession.startsWith('/api/')
            ? targetFromSession
            : '/');
        try {
          sessionStorage.removeItem('redirectAfterLogin');
        } catch {}
        router.replace(target);
        return;
      }

      // Fallback: error handling
      let isSilentFinal = isSilent;
      if (!isSilentFinal) {
        try {
          isSilentFinal = isSilentFinal || (document.cookie?.includes('oauth_silent=1') ?? false);
        } catch {}
      }
      if (isSilentFinal) {
        try {
          new BroadcastChannel('auth-refresh').postMessage({
            type: 'bypass-error',
            message: '세션 설정에 실패했습니다. 다시 시도하세요.',
          });
        } catch {}
        try {
          document.cookie = 'oauth_silent=; Max-Age=0; Path=/; SameSite=Lax';
        } catch {}
        try {
          window.close();
        } catch {}
        return;
      }
      router.replace('/login?error=auth_failed');
    })();
  }, [router, searchParams, mutate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg animate-pulse">Logging you in...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg animate-pulse">Preparing...</p>
        </div>
      }
    >
      <OAuthCallbackClient />
    </Suspense>
  );
}
