'use client';

import { useCallback, useEffect, useRef } from 'react';
import { markChatAsRead } from '@/src/services/api/chats';

/**
 * 포커스/가시성 복귀, 뷰포트 하단 고정 상태, 워터마크 전진이 있을 때만
 * PUT /chats/{id}/read를 1회 전송 (과호출 차단)
 */
export function useReadAckFocusGuard(params: {
  roomId: number | string;
  /** 뷰포트에 실제로 보이는 마지막 메시지 ID (스크롤/리스트 변화마다 갱신) */
  visibleLastMessageId: number;
  /** 현재 바닥 고정 여부 (useAnchoredScroll 등으로 산출) */
  isAtBottom: boolean;
  /** 디바운스(ms): 연속 트리거를 묶을 시간창, 기본 250ms */
  debounceMs?: number;
  /** 포커스/가시성 복귀 후 최소 간격(ms), 기본 1200ms */
  focusMinIntervalMs?: number;
}) {
  const {
    roomId,
    visibleLastMessageId,
    isAtBottom,
    debounceMs = 250,
    focusMinIntervalMs = 1200,
  } = params;

  // 최신 값 참조(이벤트 리스너 클로저 신선도 유지)
  const latestRef = useRef({ visibleLastMessageId, isAtBottom });
  useEffect(() => {
    latestRef.current = { visibleLastMessageId, isAtBottom };
  }, [visibleLastMessageId, isAtBottom]);

  // 로컬 워터마크/인플라이트/디바운스 타이머
  const lastAckedRef = useRef(0);
  const inFlightRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const lastFocusFiredAtRef = useRef(0);

  const send = useCallback(
    async (nextId: number) => {
      if (inFlightRef.current) return;
      if (nextId <= lastAckedRef.current) return;
      inFlightRef.current = true;
      try {
        const res = await markChatAsRead(Number(roomId), { lastReadMessageId: nextId });
        // chats.ts 내부 coalesce가 skip할 수도 있지만, 로컬 워터마크는 올려 중복 재시도 방지
        lastAckedRef.current = nextId;
        return res;
      } finally {
        inFlightRef.current = false;
      }
    },
    [roomId],
  );

  const request = useCallback(() => {
    const { visibleLastMessageId: nextId, isAtBottom: bottom } = latestRef.current;
    if (!bottom) return;
    if (nextId <= lastAckedRef.current) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void send(nextId);
    }, debounceMs) as unknown as number;
  }, [send, debounceMs]);

  // 뷰포트의 마지막 메시지 ID가 증가할 때만 시도
  useEffect(() => {
    request();
  }, [visibleLastMessageId, request]);

  // 탭 포커스/가시성 복귀 시 1회만 시도(최소 간격 가드)
  useEffect(() => {
    const fireIfDue = () => {
      const now = Date.now();
      if (now - lastFocusFiredAtRef.current < focusMinIntervalMs) return;
      lastFocusFiredAtRef.current = now;
      request();
    };
    const onFocus = () => fireIfDue();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fireIfDue();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [request, focusMinIntervalMs]);

  // 언마운트 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);
}
