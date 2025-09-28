'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from '@/src/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';
import { NotificationCenter } from '@/src/components/NotificationCenter';
import type { Notification } from '@/src/types/notification';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useNotifications } from '@/src/hooks/api/useNotifications';
import { useNotificationWebSocket } from '@/src/hooks/realtime/useNotificationWebSocket';
import { useUIStore } from '@/src/store/ui';
import { useSWRConfig } from 'swr';
import { useApiErrorToasts } from '@/src/lib/useApiErrorToasts';
import { useAuthInterrupts } from '@/src/features/auth/ui/useAuthInterrupts';
import AuthRefreshListener from '@/app/_components/AuthRefreshListener';
import clsx from 'clsx';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isFullWidthPage = pathname?.startsWith('/messages');
  useApiErrorToasts();
  useAuthInterrupts();
  // Global auth:expired banner/CTA wiring (in addition to useAuthInterrupts toast)
  useEffect(() => {
    const onExpired = () => {
      try {
        useUIStore.getState().setAuthExpired(true, '세션이 만료되었습니다. 다시 로그인해 주세요.');
      } catch {}
    };
    if (typeof window !== 'undefined') window.addEventListener('auth:expired', onExpired as any);
    return () => {
      try { window.removeEventListener('auth:expired', onExpired as any); } catch {}
    };
  }, []);

  const { data: me } = useAuth();
  const { mutate } = useSWRConfig();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isFullWidthPage) return;
    if (typeof document === 'undefined') return;
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const prevHtmlOverflow = htmlStyle.overflowY;
    const prevBodyOverflow = bodyStyle.overflowY;
    const prevBodyOverscroll = bodyStyle.overscrollBehaviorY;
    htmlStyle.overflowY = 'hidden';
    bodyStyle.overflowY = 'hidden';
    bodyStyle.overscrollBehaviorY = 'contain';
    return () => {
      htmlStyle.overflowY = prevHtmlOverflow;
      bodyStyle.overflowY = prevBodyOverflow;
      bodyStyle.overscrollBehaviorY = prevBodyOverscroll;
    };
  }, [isFullWidthPage]);

  // AuthModal is mounted globally in RootLayout via GlobalAuthModal
  const showNotifications = useUIStore((s) => s.showNotifications);
  const setShowNotifications = useUIStore((s) => s.setShowNotifications);

  const { list, readOne, readAll, removeOne } = useNotifications();
  const notifications: Notification[] = list.items ?? [];

  useNotificationWebSocket({ enabled: Boolean(me), showToast: true });

const handleLogout = async () => {
    try {
      await fetch('/api/bff/logout', { method: 'POST' });
    } catch {}
    try {
      const bc = new BroadcastChannel('auth-refresh');
      bc.postMessage({ type: 'logged-out' });
      bc.close();
    } catch {}
    await mutate('me', null, false);
    toast.success('로그아웃되었습니다.');
    router.push('/');
  };

  const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    try {
      localStorage.setItem('lastOAuthProvider', provider);
    } catch {}
    try {
      document.cookie = `last_oauth_provider=${provider}; Max-Age=15552000; Path=/; SameSite=Lax`;
    } catch {}
    // Use BFF to initiate OAuth so refresh cookie is set for FE domain via Set-Cookie propagation
    window.location.href = `/api/oauth2/authorization/${provider}`;
  };

  if (!mounted) {
    // Prevent hydration mismatch by deferring dynamic UI until after mount
    return (
      <div
        className={clsx('flex flex-col bg-background', isFullWidthPage ? 'overflow-hidden' : '')}
        style={
          isFullWidthPage
            ? {
                minHeight: 'calc(100dvh - var(--app-header-height, 72px))',
                height: 'calc(100dvh - var(--app-header-height, 72px))',
              }
            : { minHeight: 'calc(100dvh - var(--app-header-height, 72px))' }
        }
      >
        <main
          id="main-content"
          className={clsx(
            isFullWidthPage
              ? 'mx-auto flex w-full max-w-[1400px] flex-1 min-h-0 flex-col overflow-hidden px-3 sm:px-6 lg:px-8'
              : 'container mx-auto flex flex-1 min-h-0 flex-col overflow-hidden px-4',
            isFullWidthPage ? 'py-2 sm:py-4' : 'py-8',
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={clsx('flex flex-col bg-background', isFullWidthPage ? 'overflow-hidden' : '')}
      style={
        isFullWidthPage
          ? {
              minHeight: 'calc(100dvh - var(--app-header-height, 72px))',
              height: 'calc(100dvh - var(--app-header-height, 72px))',
            }
          : { minHeight: 'calc(100dvh - var(--app-header-height, 72px))' }
      }
    >
      <AuthRefreshListener />
      {/* Auth expired banner */}
      {useUIStore.getState().authExpired && (
        <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-800">
          <div className="container mx-auto px-4 py-2 text-sm flex items-center justify-between gap-3">
            <span>{useUIStore.getState().authBannerMessage || '세션이 만료되었습니다.'}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => useUIStore.getState().setShowAuthModal(true)}
              >
                로그인
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/login')}
              >
                로그인 페이지로 이동
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => useUIStore.getState().setAuthExpired(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
      <main
        id="main-content"
        className={clsx(
          isFullWidthPage
            ? 'mx-auto flex w-full max-w-[1400px] flex-1 min-h-0 flex-col overflow-hidden px-3 sm:px-6 lg:px-8'
            : 'container mx-auto flex flex-1 min-h-0 flex-col overflow-hidden px-4',
          isFullWidthPage ? 'py-2 sm:py-4' : 'py-8',
        )}
      >
        {children}
      </main>
      <Toaster position="top-right" expand richColors closeButton />
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={async (id) => {
          try {
            await readOne.trigger(id);
            await Promise.all([list.mutate(), mutate('notifications:unread-count')]);
          } catch {}
        }}
        onMarkAllAsRead={async () => {
          try {
            await readAll.trigger();
            await Promise.all([list.mutate(), mutate('notifications:unread-count')]);
          } catch {}
        }}
        onDeleteNotification={async (id) => {
          try {
            await removeOne.trigger(id);
            await Promise.all([list.mutate(), mutate('notifications:unread-count')]);
          } catch {}
        }}
        onNotificationClick={(n) => {
          readOne.trigger(n.id).catch(() => {});
          setShowNotifications(false);
          if (n.actionUrl) router.push(n.actionUrl);
        }}
        onViewAllClick={() => {
          setShowNotifications(false);
          router.push('/notifications');
        }}
      />
    </div>
  );
}
