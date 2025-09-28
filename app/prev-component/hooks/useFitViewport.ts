import { useEffect } from 'react';

/**
 * Fit the element height to available visual viewport space below its top edge.
 * Useful when the page has a persistent header that we cannot control.
 */
export function useFitViewport(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const vv: any = (typeof window !== 'undefined' ? (window as any).visualViewport : undefined);

    const apply = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = vv?.height ? Math.round(vv.height) : window.innerHeight;
      // Fill to the visual viewport bottom; sticky input will reserve its own space
      const h = Math.max(320, Math.round(vh - rect.top));
      ref.current.style.height = h + 'px';
    };

    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    vv?.addEventListener?.('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
      vv?.removeEventListener?.('resize', apply);
    };
  }, [ref]);
}