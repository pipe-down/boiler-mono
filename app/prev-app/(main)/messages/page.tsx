'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useRef, useState } from 'react';

// Stable helpers moved outside component to satisfy exhaustive-deps
function dedupeById<T extends { id: string | number }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const id = String(item.id);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}
function sortAsc<T extends { timestamp?: string; serverSeq?: number }>(arr: T[]): T[] {
  return arr.slice().sort((a: any, b: any) => {
    const as = a.serverSeq ?? 0;
    const bs = b.serverSeq ?? 0;
    if (as !== 0 || bs !== 0) return as - bs;
    return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
  });
}
function normalize<T extends { id: string | number; timestamp?: string; serverSeq?: number }>(
  arr: T[],
): T[] {
  return sortAsc(dedupeById(arr));
}
import { useRouter } from 'next/navigation';
import { Messages } from '@/src/components/Messages';
import { flushSync } from 'react-dom';
import { Button } from '@/src/components/ui/button';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { MessageCircle } from '@/src/components/icons';
import { useWebSocket } from '@/src/providers/WebSocketProvider';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useChatRooms, useChatMessages } from '@/src/hooks/api/useChat';
import { createDirectChat, createMeetingChat, markChatAsRead } from '@/src/services/api/chats';
import { useReadAckFocusGuard } from '@/src/features/chat/hooks/useReadAckFocusGuard';
import type {
  Message as ChatMessage,
  Conversation,
  ChatMessageEvent,
  ChatTypingEvent,
  ChatReadReceiptEvent,
  ChatReactionEvent,
} from '@/src/types/chat';

type AuthUser = NonNullable<ReturnType<typeof useAuth>['data']>;

export default function MessagesPage() {
  const { data: me, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          채팅 정보를 불러오는 중입니다...
        </div>
      </ErrorBoundary>
    );
  }

  if (!me) {
    return (
      <ErrorBoundary>
        <LoginPrompt />
      </ErrorBoundary>
    );
  }

  return <MessagesApp me={me} />;
}

function MessagesApp({ me }: { me: AuthUser }) {
  const router = useRouter();
  const { subscribe, publish, connected, topics, app } = useWebSocket();

  // 네트워크 상태(effective offline)
  const [offline, setOffline] = useState<boolean>(false);
  useEffect(() => {
    const apply = () => setOffline(typeof navigator !== 'undefined' && navigator.onLine === false);
    apply();
    window.addEventListener('online', apply);
    window.addEventListener('offline', apply);
    // 다중 탭 동기화: 마지막 활성 방 변경 수신
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'chat:last-room-id' && typeof e.newValue === 'string' && e.newValue) {
        setActiveRoomId(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('online', apply);
      window.removeEventListener('offline', apply);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // 채팅방 목록 (SWR)
  const rooms = useChatRooms();
  const { data: roomsData, mutate: roomsMutate } = rooms;
  // 로컬 캐시된 rooms (초기 페인트 가속)
  const roomsCacheRef = useRef<any[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('chat:rooms');
      if (raw) roomsCacheRef.current = JSON.parse(raw) || [];
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (roomsData) localStorage.setItem('chat:rooms', JSON.stringify(roomsData));
    } catch {}
  }, [roomsData]);
  // 읽음 처리의 중복 API 호출/플리커를 줄이기 위한 방별 디바운서(마지막 갱신 시간)
  const lastRoomReadAtRef = useRef<Map<string, number>>(new Map());

  // 선택된 방 ID (문자열; Messages 컴포넌트 콜백으로 설정)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const activeRoomNumeric = activeRoomId ? Number(activeRoomId) : undefined;

  // 마지막 활성 채팅방 복원/저장 키
  const LAST_ROOM_KEY = 'chat:last-room-id';

  // 1) 방 목록이 로드되면 마지막 활성 방 복원 (없으면 첫번째 방 자동 선택)
  useEffect(() => {
    try {
      if (!roomsData || roomsData.length === 0) return;
      if (activeRoomId) return; // 이미 선택됨
      const saved = typeof window !== 'undefined' ? localStorage.getItem(LAST_ROOM_KEY) : null;
      const exists = saved && (roomsData as any[]).some((r) => String(r.id) === saved);
      if (exists) {
        setActiveRoomId(saved as string);
      } else {
        // fallback: 첫번째 방 선택 (원치 않으면 이 분기 제거)
        setActiveRoomId(String((roomsData as any[])[0].id));
      }
    } catch {}
  }, [roomsData, activeRoomId]);

  // 2) 활성 방이 바뀔 때 로컬 스토리지에 저장
  useEffect(() => {
    try {
      if (!activeRoomId) return;
      localStorage.setItem(LAST_ROOM_KEY, activeRoomId);
    } catch {}
  }, [activeRoomId]);

  useEffect(() => {
    setVisibleLastMessageId(0);
  }, [activeRoomId]);

  // 선택된 방 메시지 (SWR)
  const activeMessages = useChatMessages(activeRoomNumeric, { page: 0, size: 50 });
  const isUpstreamUnavailable = React.useCallback((err: any) => {
    if (!err) return false;
    const status = err?.response?.status;
    if (status === 401) return false;
    const code = err?.code ?? err?.cause?.code;
    const message: string = err?.message || '';
    return (
      status === 503 ||
      code === 'ECONNREFUSED' ||
      code === 'ECONNRESET' ||
      message.includes('fetch failed')
    );
  }, []);

  // 화면 렌더용 상태
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [visibleLastMessageId, setVisibleLastMessageId] = useState(0);
  const [typingByRoom, setTypingByRoom] = useState<Map<string, Set<string>>>(new Map());
  const typingTimers = useRef<Map<string, any>>(new Map());
  const safeRevalidateActiveMessages = React.useCallback(() => {
    if (isUpstreamUnavailable(activeMessages.error)) return;
    activeMessages.mutate?.();
  }, [activeMessages, isUpstreamUnavailable]);
  useEffect(() => {
    const err: any = activeMessages.error;
    if (isUpstreamUnavailable(err)) {
      setOffline(true);
      return;
    }
    if (!err && typeof navigator !== 'undefined' && navigator.onLine !== false) {
      setOffline(false);
    }
  }, [activeMessages.error, isUpstreamUnavailable]);
  // Outbox(전송 대기열): 오프라인/미연결 시 STOMP publish를 재시도
  type OutboxItem = {
    roomId: string;
    destination: string;
    body: any;
    optimisticId: string;
    attempt: number;
    nextAt: number;
  };
  const outboxRef = useRef<OutboxItem[]>([]);
  const outboxTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const BASE_DELAY_MS = 2000;
  const MAX_ATTEMPTS = 7;
  const saveOutbox = () => {
    try {
      localStorage.setItem('chat-outbox', JSON.stringify(outboxRef.current));
    } catch {}
  };
  const loadOutbox = () => {
    try {
      const raw = localStorage.getItem('chat-outbox');
      if (raw) outboxRef.current = JSON.parse(raw) || [];
    } catch {}
  };
  useEffect(() => {
    loadOutbox();
  }, []);

  useReadAckFocusGuard({
    roomId: activeRoomId ? Number(activeRoomId) : 0,
    visibleLastMessageId,
    isAtBottom,
  });
  // 최근 이모지 조작(ADD/REMOVE) 기록으로 낙관적+서버 이벤트 중복 증가 방지
  const recentReactionOpsRef = useRef<Map<string, number>>(new Map());
  const markReactionOp = (
    roomId: string,
    messageId: string,
    emoji: string,
    action: 'ADD' | 'REMOVE',
  ) => {
    recentReactionOpsRef.current.set(`${roomId}:${messageId}:${emoji}:${action}`, Date.now());
  };
  const isRecentReactionOp = (
    roomId: string,
    messageId: string,
    emoji: string,
    action: 'ADD' | 'REMOVE',
    withinMs = 1500,
  ) => {
    const ts = recentReactionOpsRef.current.get(`${roomId}:${messageId}:${emoji}:${action}`);
    return !!ts && Date.now() - ts < withinMs;
  };

  // 전역 이벤트 채널(간단 구현): 메시지 편집/삭제를 STOMP로 발행
  useEffect(() => {
    function onEdit(ev: Event) {
      const d: any = (ev as CustomEvent).detail;
      if (!d || !activeRoomId) return;
      const appPrefix = process.env.NEXT_PUBLIC_STOMP_APP_PREFIX || '/app/chat';
      publish(`${appPrefix}/message/${d.messageId}/edit`, { content: d.content });
    }
    function onDelete(ev: Event) {
      const d: any = (ev as CustomEvent).detail;
      if (!d || !activeRoomId) return;
      const appPrefix = process.env.NEXT_PUBLIC_STOMP_APP_PREFIX || '/app/chat';
      publish(`${appPrefix}/message/${d.messageId}/delete`, {});
    }
    window.addEventListener('chat:edit', onEdit as any);
    window.addEventListener('chat:delete', onDelete as any);
    return () => {
      window.removeEventListener('chat:edit', onEdit as any);
      window.removeEventListener('chat:delete', onDelete as any);
    };
  }, [activeRoomId, publish]);

  // Outbox 처리 루프: 연결 + 온라인일 때, 시각 도래 항목 publish
  useEffect(() => {
    if (outboxTimerRef.current) clearInterval(outboxTimerRef.current);
    outboxTimerRef.current = setInterval(() => {
      if (!connected || offline || outboxRef.current.length === 0) return;
      const now = Date.now();
      const due = outboxRef.current.filter((it) => it.nextAt <= now);
      if (!due.length) return;
      const remaining: OutboxItem[] = [];
      for (const it of outboxRef.current) {
        if (it.nextAt > now) {
          remaining.push(it);
          continue;
        }
        try {
          publish(it.destination, it.body);
          // 낙관적으로 'sent'로 승격 (서버 에코가 오면 최종 확정)
          setMessagesMap((prev) => ({
            ...prev,
            [it.roomId]: (prev[it.roomId] || []).map((m) =>
              m.id === it.optimisticId ? { ...m, status: 'sent' as ChatMessage['status'] } : m,
            ),
          }));
          // 재시도 항목은 서버 에코(clientMessageId) 수신 시 제거됨
          remaining.push({ ...it, attempt: it.attempt + 1, nextAt: now + BASE_DELAY_MS });
        } catch (e) {
          const nextAttempt = it.attempt + 1;
          if (nextAttempt >= MAX_ATTEMPTS) {
            // 실패로 표기
            setMessagesMap((prev) => ({
              ...prev,
              [it.roomId]: (prev[it.roomId] || []).map((m) =>
                m.id === it.optimisticId
                  ? {
                      ...m,
                      status: 'failed' as ChatMessage['status'],
                      metadata: {
                        ...(m.metadata || {}),
                        errorMessage: '전송 실패: 네트워크/서버 오류',
                      },
                    }
                  : m,
              ),
            }));
          } else {
            const backoff = BASE_DELAY_MS * Math.pow(2, Math.min(4, nextAttempt - 1));
            remaining.push({ ...it, attempt: nextAttempt, nextAt: now + backoff });
          }
        }
      }
      outboxRef.current = remaining;
      saveOutbox();
    }, 2000);
    return () => {
      if (outboxTimerRef.current) clearInterval(outboxTimerRef.current);
      outboxTimerRef.current = null;
    };
  }, [connected, offline, publish]);

  // util fns moved to module scope for stable identity (see top of file)

  // SWR page0을 가져오면 기존 로컬(과거까지 포함)과 병합해 유지
  useEffect(() => {
    if (!activeRoomId) return;
    const list = activeMessages.data ?? [];
    const mapped: ChatMessage[] = list.map((m: any) => ({
      id: String(m.id),
      senderId: String(m.senderId),
      senderName: m.senderName,
      senderAvatar: m.senderProfileImageUrl,
      content: m.content,
      timestamp: m.createdAt,
      serverSeq: (m as any).serverSeq,
      type: m.messageType === 'IMAGE' ? 'image' : 'text',
      status: 'delivered',
    }));
    setMessagesMap((prev) => {
      const base = prev[activeRoomId] || [];
      // 서버에서 온 page0(mapped)이 우선하도록 base에서 중복 제거 후 병합
      const baseWithout = base.filter((b) => !mapped.some((m) => m.id === b.id));
      const merged = normalize([...baseWithout, ...mapped]);
      return { ...prev, [activeRoomId]: merged };
    });
  }, [activeRoomId, activeMessages.data]);

  // 탭 비가시화 시 읽음 플러시(현재 방)
  useEffect(() => {
    const onHide = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
        return;
      }
      if (!activeRoomId || !me) return;
      const nowIso = new Date().toISOString();
      const list = messagesMap[activeRoomId] || [];
      const unreadOtherIds = list
        .filter((m) => m.senderId !== String(me.id) && m.status !== 'read')
        .map((m) => m.id);
      if (unreadOtherIds.length > 0) {
        const appPrefix = process.env.NEXT_PUBLIC_STOMP_APP_PREFIX || '/app/chat';
        publish(`${appPrefix}/${activeRoomId}/read`, {
          messageIds: unreadOtherIds.map((x) => Number(x)),
        });
        try {
          const lastOther = list
            .filter((m) => m.senderId !== String(me.id))
            .reduce((acc, m) => (Number(m.id) > Number(acc?.id || 0) ? m : acc), null as any);
          const lastIdNum = lastOther ? Number(lastOther.id) : undefined;
          await markChatAsRead(Number(activeRoomId), {
            lastReadMessageId: lastIdNum,
            lastSeenAt: nowIso,
            messageIds: unreadOtherIds.map((x) => Number(x)),
          } as any);
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [activeRoomId, messagesMap, me, publish]);

  // 선택된 방 토픽 구독 (실시간 수신)
  useEffect(() => {
    if (!connected || !activeRoomId) return;
    const destMsg = topics.chat.message(activeRoomId);
    const destTyping = topics.chat.typing(activeRoomId);
    const destRead = topics.chat.read(activeRoomId);
    const destEdit = topics.chat.edit(activeRoomId);
    const destDelete = topics.chat.delete(activeRoomId);
    const destReaction = topics.chat.reaction(activeRoomId);

    const subMsg = subscribe(destMsg, (payload: ChatMessageEvent) => {
      try {
        if (!payload) return;
        const incoming: ChatMessage = {
          id: String(payload.id || Date.now()),
          senderId: String(payload.senderId ?? '0'),
          senderName: payload.senderName || '사용자',
          senderAvatar: payload.senderProfileImageUrl,
          content: payload.content ?? '',
          timestamp: payload.createdAt || new Date().toISOString(),
          serverSeq: (payload as any).serverSeq,
          type: payload.messageType === 'IMAGE' ? 'image' : 'text',
          status: 'delivered',
        };
        setMessagesMap((prev) => {
          const list = prev[activeRoomId] || [];
          // 내 메시지의 서버 에코에 clientMessageId가 있다면 optimistic 교체
          if (me && String(payload.senderId) === String(me.id) && payload.clientMessageId) {
            const idx = list.findIndex((m) => m.id === payload.clientMessageId);
            if (idx >= 0) {
              const nextList = list.slice();
              nextList[idx] = { ...incoming };
              // Outbox에서 해당 optimistic 제거
              try {
                outboxRef.current = outboxRef.current.filter(
                  (x) => x.optimisticId !== payload.clientMessageId,
                );
                saveOutbox();
              } catch {}
              return { ...prev, [activeRoomId]: nextList };
            }
          }
          // 시간 오름차순 유지: 새 메시지는 끝에 추가(최신이 맨 아래)
          return { ...prev, [activeRoomId]: normalize([...list, incoming]) };
        });
        // 목록(rooms) 즉시 업데이트: 마지막 메시지/시간, unreadCount(현재 방 외에는 +1)
        try {
          const nowRooms = (rooms.data ?? []) as any[];
          const updated = nowRooms.map((r) => {
            if (String(r.id) === activeRoomId) {
              return {
                ...r,
                lastMessage: incoming.content,
                lastMessageAt: incoming.timestamp,
                unreadCount: 0,
              };
            }
            if (String(r.id) === String(payload.chatRoomId)) {
              const plus = me && String(payload.senderId) !== String(me.id) ? 1 : 0;
              return {
                ...r,
                lastMessage: incoming.content,
                lastMessageAt: incoming.timestamp,
                unreadCount: (r.unreadCount || 0) + plus,
              };
            }
            return r;
          });
          roomsMutate?.(updated, false);
        } catch {}
        // SWR 캐시도 최신화 시도 (메시지)
        safeRevalidateActiveMessages();
        // 읽음 전송은 IntersectionObserver에서 처리(뷰포트 진입 시)
      } catch {}
    });

    const subTyping = subscribe(destTyping, (payload: ChatTypingEvent) => {
      const name = payload?.userName || '상대방';
      const isTyping = !!payload?.isTyping;
      setTypingByRoom((prev) => {
        const set = new Set(prev.get(activeRoomId) || []);
        if (isTyping) set.add(name);
        else set.delete(name);
        const next = new Map(prev);
        next.set(activeRoomId, set);
        return next;
      });
      const key = `${activeRoomId}:${name}`;
      if (typingTimers.current.get(key)) clearTimeout(typingTimers.current.get(key));
      if (isTyping) {
        const t = setTimeout(() => {
          setTypingByRoom((prev) => {
            const set = new Set(prev.get(activeRoomId) || []);
            set.delete(name);
            const next = new Map(prev);
            next.set(activeRoomId, set);
            return next;
          });
        }, 3000);
        typingTimers.current.set(key, t);
      }
    });

    const subRead = subscribe(destRead, (payload: ChatReadReceiptEvent) => {
      // 상대방이 읽음 처리 → 내 메시지 중 payload.messageIds에 해당하는 것만 read로 승격
      setMessagesMap((prev) => {
        const arr = prev[activeRoomId] || [];
        if (!arr.length || !me) return prev;
        const idSet = new Set((payload?.messageIds || []).map((n) => String(n)));
        const reader = {
          id: String(payload.readerId),
          name: payload.readerName || '상대방',
          at: payload.readAt,
        };
        const nextArr = arr.map((m) => {
          if (String(m.senderId) !== String(me.id) || !idSet.has(m.id)) return m;
          const prevReaders = m.readBy || [];
          const already = prevReaders.some((r) => r.id === reader.id);
          return {
            ...m,
            status: 'read' as ChatMessage['status'],
            readBy: already ? prevReaders : [...prevReaders, reader],
          };
        });
        return { ...prev, [activeRoomId]: nextArr };
      });
      try {
        rooms.mutate?.();
      } catch {}
    });

    const subEdit = subscribe(destEdit, (payload: any) => {
      // payload: ChatMessageResponse
      try {
        let wasLast = false;
        setMessagesMap((prev) => {
          const arr = prev[activeRoomId] || [];
          wasLast = arr.length > 0 && arr[arr.length - 1]?.id === String(payload.id);
          const nextArr = arr.map((m) =>
            m.id === String(payload.id) ? { ...m, content: payload.content, isEdited: true } : m,
          );
          return { ...prev, [activeRoomId]: nextArr };
        });
        if (wasLast) {
          try {
            const nowRooms = (roomsData ?? []) as any[];
            const updated = nowRooms.map((r) =>
              String(r.id) === activeRoomId ? { ...r, lastMessage: payload.content } : r,
            );
            roomsMutate?.(updated, false);
          } catch {}
        } else {
          // 최근 메시지 아닌 경우에는 서버 상태와의 차이를 줄이기 위해 재검증
          try {
            roomsMutate?.(undefined as any, true);
          } catch {}
        }
      } catch {}
    });

    const subDelete = subscribe(destDelete, (payload: any) => {
      // payload: { messageId, deletedBy }
      try {
        let newLast: any = null;
        let wasLast = false;
        setMessagesMap((prev) => {
          const arr = prev[activeRoomId] || [];
          wasLast = arr.length > 0 && arr[arr.length - 1]?.id === String(payload.messageId);
          const nextArr = arr.filter((m) => m.id !== String(payload.messageId));
          newLast = nextArr[nextArr.length - 1];
          return { ...prev, [activeRoomId]: nextArr };
        });
        if (wasLast) {
          try {
            const nowRooms = (roomsData ?? []) as any[];
            const updated = nowRooms.map((r) =>
              String(r.id) === activeRoomId
                ? {
                    ...r,
                    lastMessage: newLast?.content || '',
                    lastMessageAt: newLast?.timestamp || r.lastMessageAt,
                  }
                : r,
            );
            roomsMutate?.(updated, false);
          } catch {}
        } else {
          // 최근 메시지 아닌 경우에는 서버 상태와의 차이를 줄이기 위해 재검증
          try {
            roomsMutate?.(undefined as any, true);
          } catch {}
        }
      } catch {}
    });

    const subReaction = subscribe(destReaction, (payload: ChatReactionEvent | any) => {
      try {
        const ev: any = payload;
        const messageId = String(ev.messageId || ev.id);
        const emoji = ev.emoji;
        const action = ev.action as 'ADD' | 'REMOVE' | undefined;
        const summary = Array.isArray(ev.reactions) ? ev.reactions : null;
        const userId = ev.userId != null ? String(ev.userId) : null;
        const meId = me ? String(me.id) : null;
        setMessagesMap((prev) => {
          const arr = prev[activeRoomId] || [];
          const idx = arr.findIndex((m) => m.id === messageId);
          if (idx < 0) return prev;
          const msg = arr[idx];
          let reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];

          const applyDelta = (emo: string, isAdd: boolean, isMe?: boolean) => {
            const rIdx = reactions.findIndex((r) => r.emoji === emo);
            if (isAdd) {
              if (rIdx >= 0) {
                const r = reactions[rIdx];
                reactions[rIdx] = {
                  ...r,
                  count: Math.max(1, (r.count || 0) + 1),
                  reactedByMe: isMe ? true : r.reactedByMe,
                };
              } else {
                reactions = [...reactions, { emoji: emo, count: 1, reactedByMe: !!isMe }];
              }
            } else {
              if (rIdx >= 0) {
                const r = reactions[rIdx];
                const nextCount = Math.max(0, (r.count || 0) - 1);
                if (nextCount === 0) reactions = reactions.filter((_, i) => i !== rIdx);
                else
                  reactions[rIdx] = {
                    ...r,
                    count: nextCount,
                    reactedByMe: isMe ? false : r.reactedByMe,
                  };
              }
            }
          };

          if (summary) {
            // Full summary sync
            reactions = summary.map((r: any) => ({
              emoji: r.emoji,
              count: r.count ?? 0,
              reactedByMe: msg.reactions?.find((x) => x.emoji === r.emoji)?.reactedByMe,
            }));
          } else if (emoji && action) {
            // 내 낙관적 변경 직후 서버 이벤트가 도착하면 중복 적용을 방지
            const isMe = userId && meId && userId === meId;
            if (!(isMe && isRecentReactionOp(activeRoomId, messageId, emoji, action))) {
              applyDelta(emoji, action === 'ADD', !!isMe);
            }
          }

          const nextArr = arr.slice();
          nextArr[idx] = { ...msg, reactions };
          return { ...prev, [activeRoomId]: nextArr };
        });
      } catch {}
    });

    return () => {
      try {
        subMsg?.unsubscribe?.();
      } catch {}
      try {
        subTyping?.unsubscribe?.();
      } catch {}
      try {
        subRead?.unsubscribe?.();
      } catch {}
      try {
        subEdit?.unsubscribe?.();
      } catch {}
      try {
        subDelete?.unsubscribe?.();
      } catch {}
      try {
        subReaction?.unsubscribe?.();
      } catch {}
    };
  }, [
    connected,
    subscribe,
    activeRoomId,
    topics,
    roomsData,
    roomsMutate,
    me,
    activeMessages,
    rooms,
    safeRevalidateActiveMessages,
  ]);

  // 채팅방 목록을 UI 스키마로 매핑
  const conversationsData: Conversation[] = useMemo(() => {
    const list = (roomsData ?? roomsCacheRef.current ?? []) as any[];
    return list.map((r: any) => ({
      id: String(r.id),
      type: 'group',
      name: r.name,
      avatar: undefined,
      participants: me ? [{ id: String(me.id), name: me.name, avatar: me.profileImageUrl }] : [],
      lastMessage: r.lastMessageAt
        ? {
            id: 'last',
            senderId: '',
            senderName: '',
            content: r.lastMessage || '',
            timestamp: r.lastMessageAt,
            type: 'text',
            status: 'delivered',
          }
        : undefined,
      unreadCount: r.unreadCount ?? 0,
      createdAt: r.lastMessageAt || new Date().toISOString(),
    }));
  }, [roomsData, me]);

  const messagesData = useMemo(() => messagesMap as Record<string, any[]>, [messagesMap]);

  // ===== Local cache for active room messages (persist across refresh) =====
  const CHAT_CACHE_PREFIX = 'chat:cache:';
  const MAX_CACHE_PER_ROOM = 200;
  function loadRoomCache(roomId: string): any[] {
    try {
      const raw = localStorage.getItem(CHAT_CACHE_PREFIX + roomId);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  function saveRoomCache(roomId: string, arr: any[]) {
    try {
      const slim = Array.isArray(arr)
        ? arr.slice(Math.max(0, arr.length - MAX_CACHE_PER_ROOM))
        : [];
      localStorage.setItem(CHAT_CACHE_PREFIX + roomId, JSON.stringify(slim));
    } catch {}
  }

  // Load cache when active room changes (only if we don't already have messages)
  useEffect(() => {
    if (!activeRoomId) return;
    const existing = messagesMap[activeRoomId];
    if (existing && existing.length > 0) return;
    const cached = loadRoomCache(activeRoomId);
    if (cached.length > 0) {
      setMessagesMap((prev) => ({ ...prev, [activeRoomId]: cached }));
    }
  }, [activeRoomId, messagesMap]);

  // Save cache whenever active room messages change
  useEffect(() => {
    if (!activeRoomId) return;
    const list = messagesMap[activeRoomId] || [];
    if (list.length > 0) saveRoomCache(activeRoomId, list);
  }, [messagesMap, activeRoomId]);
  const typingUsers = useMemo(
    () => Array.from(typingByRoom.get(activeRoomId || '') || []),
    [typingByRoom, activeRoomId],
  );

  // Handle meeting room creation requests bubbled from CreateDialog
  useEffect(() => {
    function onCreateMeeting(ev: Event) {
      const d: any = (ev as CustomEvent).detail || {};
      const tripId = Number(d.tripId);
      const name = d.name || undefined;
      const description = d.description || undefined;
      if (!tripId) return;
      (async () => {
        try {
          const room = await createMeetingChat(tripId, name as any, description as any);
          if (room?.id) {
            try {
      const nowRooms = (roomsData ?? []) as any[];
              const exists = nowRooms.some((r) => String(r.id) === String(room.id));
              if (!exists) roomsMutate?.([room, ...nowRooms], false);
            } catch {}
            setActiveRoomId(String(room.id));
            try {
              localStorage.setItem('chat:last-room-id', String(room.id));
            } catch {}
            // Success toast is shown by CreateDialog; avoid duplicate toasts here
          }
        } catch (e: any) {
          const msg = e?.response?.data?.message || '모임 채팅 생성 실패';
          toast.error(msg);
        }
      })();
    }
    window.addEventListener('chat:create-meeting', onCreateMeeting as any);
    return () => window.removeEventListener('chat:create-meeting', onCreateMeeting as any);
  }, [roomsData, roomsMutate]);

  // Handle room removal: remove from list, clear caches, and adjust active room
  useEffect(() => {
    function onRoomRemoved(ev: Event) {
      const d: any = (ev as CustomEvent).detail || {};
      const roomId = d.roomId ? String(d.roomId) : '';
      if (!roomId) return;
      try {
        // Remove from rooms list
        const nowRooms = (roomsData ?? []) as any[];
        const filtered = nowRooms.filter((r) => String(r.id) !== roomId);
        roomsMutate?.(filtered, false);
      } catch {}
      try {
        // Clear caches
        localStorage.removeItem('chat:cache:' + roomId);
        localStorage.removeItem('chat:pages:' + roomId);
      } catch {}
      // Remove from messagesMap and adjust active selection
      setMessagesMap((prev) => {
        if (!prev[roomId]) return prev;
        const next = { ...prev } as any;
        delete next[roomId];
        return next;
      });
      setActiveRoomId((cur) => {
        if (cur !== roomId) return cur;
        // If active was removed, fallback to first room if any
        const now = (roomsData ?? []) as any[];
        return now.length > 0 ? String(now[0].id) : null;
      });
    }
    window.addEventListener('chat:room-removed', onRoomRemoved as any);
    return () => window.removeEventListener('chat:room-removed', onRoomRemoved as any);
  }, [roomsData, roomsMutate]);

  return (
    <ErrorBoundary>
      <div className="mx-auto flex h-full w-full max-w-[1320px] flex-1 min-h-0 flex-col gap-4 overflow-hidden">
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900 mb-2">메시지</h1>
              <p className="text-muted-foreground">여행 동료들과 실시간으로 소통해보세요.</p>
            </div>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            ← 메인으로
          </Button>
        </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
            <Messages
          currentUser={{ id: String(me.id), name: me.name, avatar: me.profileImageUrl }}
          conversations={conversationsData}
          messages={messagesData}
          selectedConversationId={activeRoomId}
          typingUsers={typingUsers}
          onBottomStateChange={setIsAtBottom}
          onPrependMessages={(conversationId, older) => {
            setMessagesMap((prev) => {
              const arr = prev[conversationId] || [];
              // 시간 오름차순: 더 오래된 묶음은 앞쪽에 붙여야 함
              return { ...prev, [conversationId]: normalize([...older, ...arr]) };
            });
          }}
          onReactMessage={(messageId, emoji) => {
            // optimistic + publish
            setMessagesMap((prev) => {
              const roomId = activeRoomId;
              if (!roomId) return prev;
              const arr = prev[roomId] || [];
              const idx = arr.findIndex((m) => m.id === messageId);
              if (idx < 0) return prev;
              const msg = arr[idx];
              const reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
              const rIdx = reactions.findIndex((r) => r.emoji === emoji);
              if (rIdx >= 0)
                reactions[rIdx] = {
                  ...reactions[rIdx],
                  count: (reactions[rIdx].count || 0) + 1,
                  reactedByMe: true,
                };
              else reactions.push({ emoji, count: 1, reactedByMe: true });
              const nextArr = arr.slice();
              nextArr[idx] = { ...msg, reactions };
              return { ...prev, [roomId]: nextArr };
            });
            publish(app.chat.react(messageId), { emoji });
            if (activeRoomId) markReactionOp(activeRoomId, messageId, emoji, 'ADD');
          }}
          onUnreactMessage={(messageId, emoji) => {
            setMessagesMap((prev) => {
              const roomId = activeRoomId;
              if (!roomId) return prev;
              const arr = prev[roomId] || [];
              const idx = arr.findIndex((m) => m.id === messageId);
              if (idx < 0) return prev;
              const msg = arr[idx];
              let reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
              const rIdx = reactions.findIndex((r) => r.emoji === emoji);
              if (rIdx >= 0) {
                const r = reactions[rIdx];
                const nextCount = Math.max(0, (r.count || 0) - 1);
                if (nextCount === 0) reactions = reactions.filter((_, i) => i !== rIdx);
                else reactions[rIdx] = { ...r, count: nextCount, reactedByMe: false };
              }
              const nextArr = arr.slice();
              nextArr[idx] = { ...msg, reactions };
              return { ...prev, [roomId]: nextArr };
            });
            publish(app.chat.unreact(messageId), { emoji });
            if (activeRoomId) markReactionOp(activeRoomId, messageId, emoji, 'REMOVE');
          }}
          onEditMessage={(messageId, content) => {
            const appPrefix = process.env.NEXT_PUBLIC_STOMP_APP_PREFIX || '/app/chat';
            publish(`${appPrefix}/message/${messageId}/edit`, { content });
          }}
          onDeleteMessage={(messageId) => {
            const appPrefix = process.env.NEXT_PUBLIC_STOMP_APP_PREFIX || '/app/chat';
            publish(`${appPrefix}/message/${messageId}/delete`, {});
          }}
          visibilityConfig={{
            threshold: Number(process.env.NEXT_PUBLIC_CHAT_READ_THRESHOLD ?? 0.7),
            rootMargin: process.env.NEXT_PUBLIC_CHAT_READ_ROOT_MARGIN ?? '0px 0px -24px 0px',
            batchMs: Number(process.env.NEXT_PUBLIC_CHAT_READ_BATCH_MS ?? 250),
            maxObserved: Number(process.env.NEXT_PUBLIC_CHAT_READ_MAX ?? 200),
          }}
          onMessagesVisible={(conversationId, ids) => {
            if (!ids.length) return;
            // 1) 서버에 읽음 전송(STOMP)
            publish(app.chat.read(conversationId), { messageIds: ids.map((x) => Number(x)) });
            // 2) 좌측 목록의 뱃지를 즉시 0으로 반영(선택 방)
            try {
              const now = (rooms.data ?? []) as any[];
              const updated = now.map((r) =>
                String(r.id) === String(conversationId) ? { ...r, unreadCount: 0 } : r,
              );
              rooms.mutate?.(updated, false);
            } catch {}
            if (activeRoomId && String(conversationId) === String(activeRoomId)) {
              const numericIds = ids
                .map((id) => Number(id))
                .filter((num) => Number.isFinite(num) && num > 0);
              if (numericIds.length) {
                const maxId = Math.max(...numericIds);
                setVisibleLastMessageId((prev) => (maxId > prev ? maxId : prev));
              }
            }
          }}
          onSendMessage={async (conversationId, content, type, metadata) => {
            const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const isImage = type === 'image' && metadata?.imageUrl;
            // 낙관적 UI 업데이트 (sending)
            flushSync(() => {
              setMessagesMap((prev) => ({
                ...prev,
                // 시간 오름차순: 낙관적 아이템을 끝에 추가
                [conversationId]: normalize([
                  ...(prev[conversationId] || []),
                  {
                    id: optimisticId,
                    senderId: String(me.id),
                    senderName: me.name,
                    content: content || (isImage ? '' : ''),
                    timestamp: new Date().toISOString(),
                    type: isImage ? 'image' : 'text',
                    status: 'sending',
                    metadata: isImage ? { imageUrl: metadata!.imageUrl } : undefined,
                  } as ChatMessage,
                ]),
              }));
            });

            // 목적지/바디 구성
            const destination = app.chat.send(conversationId);
            const body = isImage
              ? {
                  content: content || '',
                  messageType: 'IMAGE',
                  imageUrl: metadata!.imageUrl,
                  clientMessageId: optimisticId,
                }
              : {
                  content,
                  messageType: 'TEXT',
                  clientMessageId: optimisticId,
                };

            const canPublish = connected && !offline;
            if (canPublish) {
              try {
                publish(destination, body);
                // 전송 시도 후 상태 업데이트(sent)
                setMessagesMap((prev) => ({
                  ...prev,
                  [conversationId]: (prev[conversationId] || []).map((m) =>
                    m.id === optimisticId ? { ...m, status: 'sent' as ChatMessage['status'] } : m,
                  ),
                }));
                rooms.mutate?.();
              } catch (e) {
                // publish 실패 → 대기열로 이관
                const item: OutboxItem = {
                  roomId: conversationId,
                  destination,
                  body,
                  optimisticId,
                  attempt: 0,
                  nextAt: Date.now() + BASE_DELAY_MS,
                };
                outboxRef.current.push(item);
                saveOutbox();
                toast.message('오프라인: 전송 대기열에 저장했습니다');
              }
            } else {
              // 미연결/오프라인 → 대기열 저장
              const item: OutboxItem = {
                roomId: conversationId,
                destination,
                body,
                optimisticId,
                attempt: 0,
                nextAt: Date.now() + BASE_DELAY_MS,
              };
              outboxRef.current.push(item);
              saveOutbox();
              toast.message('오프라인: 전송 대기열에 저장했습니다');
            }
          }}
          onCreateConversation={async (participantIds, name) => {
            try {
              // Direct chat when single participant id provided (string[] of user ids)
              if (participantIds.length === 1) {
                const targetUserId = Number(participantIds[0]);
                const room = await createDirectChat(targetUserId);
                if (room?.id) {
                  // SWR rooms를 낙관적으로 즉시 반영
                  try {
                    const nowRooms = (rooms.data ?? []) as any[];
                    const exists = nowRooms.some((r) => String(r.id) === String(room.id));
                    if (!exists) {
                      rooms.mutate?.([room, ...nowRooms], false);
                    }
                  } catch {}
                  setActiveRoomId(String(room.id));
                  try {
                    localStorage.setItem('chat:last-room-id', String(room.id));
                  } catch {}
                  toast.success('1:1 대화가 생성되었습니다.');
                  return;
                }
              }
              // For group chats, guide to use meeting chat (trip-based)
              toast.info(
                '그룹 대화는 모임(여행) 채팅으로 생성됩니다. 모임 상세에서 채팅을 시작해주세요.',
              );
            } catch (e: any) {
              const msg = e?.response?.data?.message || '대화 생성에 실패했습니다.';
              toast.error(msg);
            }
          }}
          onMarkAsRead={async (conversationId) => {
            setActiveRoomId(conversationId);
            const nowIso = new Date().toISOString();
            try {
              // 선택된 방 저장
              localStorage.setItem(LAST_ROOM_KEY, conversationId);
              localStorage.setItem('chat:lastSeenAt:' + conversationId, nowIso);
            } catch {}
            // 방 전환 시 서버에 읽음 처리(마지막 읽은 시간) 업데이트
            try {
              await markChatAsRead(Number(conversationId), { lastSeenAt: nowIso });
            } catch {}
            // 좌측 목록 뱃지 즉시 0 처리(재검증은 뒤로 미룸)
            try {
              const now = (rooms.data ?? []) as any[];
              const updated = now.map((r) =>
                String(r.id) === conversationId ? { ...r, unreadCount: 0 } : r,
              );
              rooms.mutate?.(updated, false);
            } catch {}
            // 화면에 보이는(로딩된) 상대방 메시지를 메시지 단위로 읽음 처리 전송(STOMP)
            if (me) {
              const list = messagesMap[conversationId] || [];
              const unreadOtherIds = list
                .filter((m) => m.senderId !== String(me.id) && m.status !== 'read')
                .map((m) => m.id);
              if (unreadOtherIds.length > 0) {
                const appPrefix = process.env.NEXT_PUBLIC_STOMP_APP_PREFIX || '/app/chat';
                publish(`${appPrefix}/${conversationId}/read`, {
                  messageIds: unreadOtherIds.map((x) => Number(x)),
                });
              }
            }
          }}
          onTyping={(conversationId, isTyping) => {
            const appPrefix = process.env.NEXT_PUBLIC_STOMP_APP_PREFIX || '/app/chat';
            publish(`${appPrefix}/${conversationId}/typing`, { isTyping, userName: me?.name });
          }}
          onRetryMessage={(messageId) => {
            const roomId = activeRoomId;
            if (!roomId || !me) return;
            const arr = messagesMap[roomId] || [];
            const idx = arr.findIndex((m) => m.id === messageId);
            if (idx < 0) return;
            const msg = arr[idx];
            if (String(msg.senderId) !== String(me.id)) return;
            if (msg.status !== 'failed' && msg.status !== 'sending') return;

            // 재전송 준비: 상태를 'sending'으로
            setMessagesMap((prev) => {
              const next = (prev[roomId] || []).slice();
              if (idx >= 0) next[idx] = { ...msg, status: 'sending' } as ChatMessage;
              return { ...prev, [roomId]: next };
            });

            const destination = app.chat.send(roomId);
            const isImage = msg.type === 'image' && msg.metadata?.imageUrl;
            const body = isImage
              ? {
                  content: msg.content || '',
                  messageType: 'IMAGE',
                  imageUrl: msg.metadata!.imageUrl,
                  clientMessageId: msg.id,
                }
              : {
                  content: msg.content,
                  messageType: 'TEXT',
                  clientMessageId: msg.id,
                };
            const canPublish = connected && !offline;
            if (canPublish) {
              try {
                publish(destination, body);
                setMessagesMap((prev) => ({
                  ...prev,
                  [roomId]: (prev[roomId] || []).map((m) =>
                    m.id === messageId ? { ...m, status: 'sent' as ChatMessage['status'] } : m,
                  ),
                }));
              } catch {
                const item = {
                  roomId,
                  destination,
                  body,
                  optimisticId: msg.id,
                  attempt: 0,
                  nextAt: Date.now() + BASE_DELAY_MS,
                } as any;
                outboxRef.current.push(item);
                saveOutbox();
              }
            } else {
              const item = {
                roomId,
                destination,
                body,
                optimisticId: msg.id,
                attempt: 0,
                nextAt: Date.now() + BASE_DELAY_MS,
              } as any;
              outboxRef.current.push(item);
              saveOutbox();
            }
          }}
          onCancelPending={(messageId) => {
            const roomId = activeRoomId;
            if (!roomId || !me) return;
            // Outbox에서 제거
            try {
              outboxRef.current = outboxRef.current.filter((x) => x.optimisticId !== messageId);
              saveOutbox();
            } catch {}
            // 메시지 목록에서 제거(내 메시지 & sending/failed)
            setMessagesMap((prev) => {
              const arr = prev[roomId] || [];
              const next = arr.filter((m) => {
                if (m.id !== messageId) return true;
                if (String(m.senderId) !== String(me.id)) return true; // 남의 메시지는 보호
                return !(m.status === 'sending' || m.status === 'failed') ? true : false;
              });
              return { ...prev, [roomId]: next };
            });
          }}
            />
        </div>
      </div>
    </ErrorBoundary>
  );
}

function LoginPrompt() {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <MessageCircle className="h-12 w-12 text-muted-foreground" />
      <div>
        <p className="text-lg font-medium">로그인이 필요합니다</p>
        <p className="text-sm text-muted-foreground">채팅 페이지는 로그인 후 이용할 수 있습니다.</p>
      </div>
      <Button size="lg" onClick={() => router.push('/login?redirect=/messages')}>
        로그인 하러 가기
      </Button>
    </div>
  );
}
