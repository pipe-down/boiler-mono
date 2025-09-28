'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createStompClient, releaseSharedStompClient } from '@/src/lib/ws';
import { useAuth } from '@/src/features/auth/hooks/useAuth';

type Subscription = { unsubscribe: () => void };

type WSContext = {
  connected: boolean;
  subscribe: (destination: string, cb: (payload: any) => void) => Subscription | null;
  publish: (destination: string, body: any) => void;
  topics: {
    notifications: string;
    tripLocation: (tripId: string | number) => string;
    chat: {
      message: (roomId: string | number) => string;
      typing: (roomId: string | number) => string;
      read: (roomId: string | number) => string;
      edit: (messageId: string | number) => string;
      delete: (messageId: string | number) => string;
      reaction: (roomId: string | number) => string;
    };
  };
  app: {
    chat: {
      send: (roomId: string | number) => string;
      typing: (roomId: string | number) => string;
      read: (roomId: string | number) => string;
      edit: (messageId: string | number) => string;
      delete: (messageId: string | number) => string;
      react: (messageId: string | number) => string;
      unreact: (messageId: string | number) => string;
    };
  };
};

const Ctx = createContext<WSContext | null>(null);

export function useWebSocket() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      connected: false,
      subscribe: () => null,
      publish: () => {},
      topics: {
        notifications: '',
        tripLocation: () => '',
        chat: {
          message: () => '',
          typing: () => '',
          read: () => '',
          edit: () => '',
          delete: () => '',
          reaction: () => '',
        },
      },
      app: {
        chat: {
          send: () => '',
          typing: () => '',
          read: () => '',
          edit: () => '',
          delete: () => '',
          react: () => '',
          unreact: () => '',
        },
      },
    } as WSContext;
  }
  return ctx;
}

export default function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading: authIsLoading } = useAuth();

  const clientRef = useRef<any | null>(null);
  const [connected, setConnected] = useState(false);

  // 구독 키/큐/라이브 맵
  const seqRef = useRef(0);
  const makeKey = () =>
    `sub:${++seqRef.current}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const pendingSubsRef = useRef<
    Array<{ key: string; destination: string; cb: (payload: any) => void; cancelled?: boolean }>
  >([]);

  const liveSubsRef = useRef<
    Map<string, { destination: string; cb: (payload: any) => void; sub: Subscription | null; cancelled?: boolean }>
  >(new Map());

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      if (!mounted || !me || clientRef.current?.active) return;

      try {
        const client = await createStompClient();
        if (!client) return;

        clientRef.current = client;

        client.onConnect = () => {
          if (!mounted) return;
          setConnected(true);

          // 1) 끊겼던 라이브 구독 재구독
          for (const [, meta] of liveSubsRef.current) {
            if (meta.cancelled || meta.sub) continue;
            const sub = client.subscribe(meta.destination, (frame: any) => {
              try {
                meta.cb(JSON.parse(frame.body));
              } catch {
                meta.cb(frame?.body ?? null);
              }
            });
            meta.sub = sub;
          }

          // 2) 연결 전 대기열 flush
          const toFlush = [...pendingSubsRef.current];
          pendingSubsRef.current.length = 0;
          for (const p of toFlush) {
            if (p.cancelled) continue;
            const sub = client.subscribe(p.destination, (frame: any) => {
              try {
                p.cb(JSON.parse(frame.body));
              } catch {
                p.cb(frame?.body ?? null);
              }
            });
            liveSubsRef.current.set(p.key, { destination: p.destination, cb: p.cb, sub });
          }
        };

        client.onDisconnect = () => {
          if (!mounted) return;
          setConnected(false);
          // 재연결 자동 복원을 위해 sub 핸들만 제거(메타는 유지)
          for (const [, meta] of liveSubsRef.current) {
            meta.sub = null;
          }
        };

        client.activate();
      } catch (e) {
        console.error('Failed to connect WebSocket', e);
      }
    };

    const disconnect = () => {
      if (clientRef.current) {
        try {
          clientRef.current.deactivate();
        } catch {}
        clientRef.current = null;
      }
      releaseSharedStompClient();
      setConnected(false);
      // 완전 종료(로그아웃/언마운트) 시에는 모두 제거
      pendingSubsRef.current = [];
      liveSubsRef.current.clear();
    };

    if (!authIsLoading) {
      if (me) connect();
      else disconnect();
    }

    return () => {
      mounted = false;
      disconnect();
    };
  }, [me, authIsLoading]);

  // 실제 STOMP 연결 여부(client.connected) 기준으로 동작
  const subscribe = useCallback<WSContext['subscribe']>((destination, cb) => {
    const client = clientRef.current;
    if (!client) return null;

    const key = makeKey();
    const isReallyConnected = !!client.connected;

    // 연결 전: 대기열에 등록(개별 해제 지원)
    if (!isReallyConnected) {
      const pending = { key, destination, cb, cancelled: false as boolean | undefined };
      pendingSubsRef.current.push(pending);
      return {
        unsubscribe: () => {
          pending.cancelled = true;
          pendingSubsRef.current = pendingSubsRef.current.filter((p) => p.key !== key);
        },
      };
    }

    // 연결됨: 즉시 구독
    try {
      const sub = client.subscribe(destination, (frame: any) => {
        try {
          cb(JSON.parse(frame.body));
        } catch {
          cb(frame?.body ?? null);
        }
      });
      liveSubsRef.current.set(key, { destination, cb, sub });
      return {
        unsubscribe: () => {
          const meta = liveSubsRef.current.get(key);
          if (meta) {
            meta.cancelled = true;
            try {
              meta.sub?.unsubscribe?.();
            } catch {}
            liveSubsRef.current.delete(key);
          }
        },
      };
    } catch {
      // subscribe 도중 오류 시 pending으로 폴백(일시적 연결지연 대비)
      const pending = { key, destination, cb, cancelled: false as boolean | undefined };
      pendingSubsRef.current.push(pending);
      return {
        unsubscribe: () => {
          pending.cancelled = true;
          pendingSubsRef.current = pendingSubsRef.current.filter((p) => p.key !== key);
        },
      };
    }
  }, []);

  const publish = useCallback<WSContext['publish']>((destination, body) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;
    try {
      client.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    } catch {}
  }, []);

  const value = useMemo<WSContext>(
    () => ({
      connected,
      subscribe,
      publish,
      topics: {
        notifications:
          process.env.NEXT_PUBLIC_STOMP_NOTIFICATION_QUEUE || '/user/queue/notifications',
        tripLocation: (tripId: string | number) => `/topic/trip/${tripId}/locations`,
        chat: {
          message: (roomId: string | number) => `/topic/chat/${roomId}`,
          typing: (roomId: string | number) => `/topic/chat/${roomId}/typing`,
          read: (roomId: string | number) => `/topic/chat/${roomId}/read`,
          edit: (messageId: string | number) => `/topic/chat/${messageId}/edit`,
          delete: (messageId: string | number) => `/topic/chat/${messageId}/delete`,
          reaction: (roomId: string | number) => `/topic/chat/${roomId}/reaction`,
        },
      },
      app: {
        chat: {
          send: (roomId: string | number) => `/app/chat/${roomId}/send`,
          typing: (roomId: string | number) => `/app/chat/${roomId}/typing`,
          read: (roomId: string | number) => `/app/chat/${roomId}/read`,
          edit: (messageId: string | number) => `/app/chat/${messageId}/edit`,
          delete: (messageId: string | number) => `/app/chat/${messageId}/delete`,
          react: (messageId: string | number) => `/app/chat/${messageId}/react`,
          unreact: (messageId: string | number) => `/app/chat/${messageId}/unreact`,
        },
      },
    }),
    [connected, subscribe, publish],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
