'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Listens for 'api:error' events and shows a minimal toast with X-Error-Id.
 * Keep UI impact small; projects can opt-out by not importing this hook.
 */
export function useApiErrorToasts() {
  useEffect(() => {
    function onApiError(e: Event) {
      const detail: any = (e as CustomEvent).detail || {};
      const id = detail?.meta?.errorId;
      const status: number | undefined = detail?.meta?.errorStatus;
      if (typeof window === 'undefined') return;
      try {
        if (status && status >= 500) {
          toast.error(`서버 오류가 발생했습니다. 오류 코드: ${id ?? 'N/A'}`);
        }
      } catch {}
    }
    window.addEventListener('api:error', onApiError as any);
    return () => window.removeEventListener('api:error', onApiError as any);
  }, []);
}
