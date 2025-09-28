'use client';

import { useEffect, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useWebSocket } from '@/src/providers/WebSocketProvider';
import type { Notification } from '@/src/types/notification';
import { useAuth } from '@/src/features/auth/hooks/useAuth';

type Options = {
  enabled?: boolean;
  showToast?: boolean;
};

export function useNotificationWebSocket(options: Options = {}) {
  const { enabled = true, showToast = true } = options;
  const { data: me } = useAuth();
  const { mutate } = useSWRConfig();
  const { subscribe, connected, topics } = useWebSocket();
  const timerRef = useRef<any | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!mounted) return;
    if (!enabled) return;
    if (!me) return;
    if (!connected) return;

    const sub = subscribe(topics.notifications, (payload: any) => {
      const notif = normalizeNotification(payload);

      // Debounced cache refresh (reduce mutate bursts)
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        mutate('notifications:unread-count');
        mutate((key: any) => Array.isArray(key) && key[0] === 'notifications', undefined, {
          revalidate: true,
        });
      }, 300);

      if (showToast && notif?.title) {
        const actionUrl = notif.actionUrl;
        if (actionUrl) {
          toast.message(notif.title, {
            description: notif.message,
            action: {
              label: '바로가기',
              onClick: () => {
                window.location.href = actionUrl;
              },
            },
          });
        } else {
          toast.info(notif.title, { description: notif.message });
        }
      }
    });

    return () => {
      mounted = false;
      try {
        sub?.unsubscribe?.();
      } catch {}
      if (timerRef.current) {
        try {
          clearTimeout(timerRef.current);
        } catch {}
      }
    };
  }, [enabled, me?.id, me, connected, subscribe, topics, showToast, mutate]);
}

function normalizeNotification(input: any): Notification {
  return {
    id: String(input.id ?? input.notificationId ?? crypto.randomUUID()),
    type: (input.type as Notification['type']) ?? 'message',
    title: input.title ?? input.messageTitle ?? '알림',
    message: input.message ?? input.content ?? '',
    timestamp: input.createdAt ?? new Date().toISOString(),
    isRead: Boolean(input.read ?? input.isRead ?? false),
    userId: input.actorUserId ? String(input.actorUserId) : undefined,
    userName: input.actorUserName,
    userAvatar: input.actorUserAvatar,
    tripId: input.tripId ? String(input.tripId) : undefined,
    meetupId: input.meetupId ? String(input.meetupId) : undefined,
    actionUrl: input.actionUrl,
  };
}
