'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useUIStore } from '@/store/ui';

export function useAuthInterrupts() {
  const setShowAuthModal = useUIStore((s) => s.setShowAuthModal);
  const setAuthExpired = useUIStore((s) => s.setAuthExpired);
  useEffect(() => {
    function onExpired(e: Event) {
      try {
        const detail: any = (e as CustomEvent).detail || {};
        const path = detail?.pathname || window.location.pathname;
        toast.warning('세션이 만료되었습니다. 다시 로그인해 주세요.', {
          description: `경로: ${path}`,
        });
        setAuthExpired(true, '세션이 만료되었습니다. 다시 로그인해 주세요.');
        setShowAuthModal(true);
      } catch {}
    }
    window.addEventListener('auth:expired', onExpired as any);

    // Listen broadcast messages for bypass errors (silent popup failures)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('auth-refresh');
      bc.addEventListener('message', (ev: MessageEvent) => {
        try {
          const d: any = (ev as any)?.data ?? (ev as any);
          if (d?.type === 'bypass-error') {
            const msg =
              typeof d?.message === 'string' && d.message
                ? d.message
                : '우회 로그인에 실패했습니다.';
            toast.error(msg);
            setAuthExpired(true, msg);
            setShowAuthModal(true);
          }
        } catch {}
      });
    } catch {}

    return () => {
      window.removeEventListener('auth:expired', onExpired as any);
      try {
        bc?.close();
      } catch {}
    };
  }, [setShowAuthModal, setAuthExpired]);
}
