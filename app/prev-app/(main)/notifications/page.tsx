'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';
import { Bell, Check } from '@/src/components/icons';
import { useNotifications } from '@/src/hooks/api/useNotifications';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useNotificationWebSocket } from '@/src/hooks/realtime/useNotificationWebSocket';
import { NotificationItem } from '@/src/components/NotificationCenter';
import type { Notification } from '@/src/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  // Filters
  const [readFilter, setReadFilter] = React.useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('');
  // Phase 6: 폴링 제거, 실시간 구독으로 전환
  const isReadParam = readFilter === 'all' ? 'all' : readFilter === 'read';
  const { list, unread, readOne, readAll, removeOne, removeReadAll } = useNotifications({
    size: 50,
    isRead: isReadParam as any,
    type: typeFilter || undefined,
    priority: priorityFilter || undefined,
  });
  useNotificationWebSocket({ enabled: true, showToast: false });
  const notifications: Notification[] = useMemo(() => list.items ?? [], [list.items]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { size: listSize, isLoadingMore: listIsLoadingMore, isReachingEnd: listIsReachingEnd, setSize: setListSize } = list;
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    if (listIsReachingEnd) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !listIsLoadingMore) {
          setListSize(listSize + 1);
        }
      },
      { root: null, rootMargin: '200px 0px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [listSize, listIsLoadingMore, listIsReachingEnd, setListSize]);
  const unreadCount = unread.data ?? 0;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'trip_joined':
      case 'meetup_joined':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'review':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'message':
        return <Bell className="h-4 w-4 text-green-500" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-orange-500" />;
      case 'trip_full':
      case 'new_trip':
      case 'new_meetup':
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-slate-900 mb-1 truncate">알림</h1>
          <p className="text-muted-foreground text-sm truncate">최근 알림이 여기에 표시됩니다.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select defaultValue="all" onValueChange={(v) => setReadFilter(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="읽기" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="unread">읽지 않음</SelectItem>
              <SelectItem value="read">읽음</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter || 'all'}
            onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">유형(전체)</SelectItem>
              <SelectItem value="TRIP_INVITATION">TRIP_INVITATION</SelectItem>
              <SelectItem value="NEW_COMMENT_ON_MY_POST">NEW_COMMENT_ON_MY_POST</SelectItem>
              <SelectItem value="GENERAL">GENERAL</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter || 'all'}
            onValueChange={(v) => setPriorityFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="우선순위" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">우선순위(전체)</SelectItem>
              <SelectItem value="LOW">LOW</SelectItem>
              <SelectItem value="NORMAL">NORMAL</SelectItem>
              <SelectItem value="HIGH">HIGH</SelectItem>
              <SelectItem value="URGENT">URGENT</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={async () => {
                await readAll.trigger();
                await Promise.all([list.mutate(), unread.mutate()]);
              }}
            >
              <Check className="h-4 w-4 mr-2" /> 모두 읽음
            </Button>
          )}
          <Button
            variant="outline"
            onClick={async () => {
              if (!confirm('읽은 알림을 모두 삭제하시겠습니까?')) return;
              await removeReadAll.trigger();
              await Promise.all([list.mutate(), unread.mutate()]);
            }}
          >
            읽은 알림 삭제
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            ← 메인으로
          </Button>
        </div>
      </div>

      <Card className="border-border/80">
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-md border" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              새로운 알림이 없습니다
            </div>
          ) : (
            <div className="p-2 sm:p-3">
              {notifications.map((n, index) => (
                <React.Fragment key={n.id}>
                  <NotificationItem
                    notification={n}
                    onMarkAsRead={async (id) => {
                      await readOne.trigger(id);
                      await Promise.all([list.mutate(), unread.mutate()]);
                    }}
                    onDelete={async (id) => {
                      await removeOne.trigger(id);
                      await Promise.all([list.mutate(), unread.mutate()]);
                    }}
                    onClick={async (notif) => {
                      try {
                        await readOne.trigger(notif.id);
                      } catch {}
                      if (notif.actionUrl) {
                        router.push(notif.actionUrl);
                      } else if (notif.tripId) {
                        router.push('/trips');
                      } else if (notif.meetupId) {
                        router.push('/meetups');
                      }
                    }}
                    getIcon={getIcon}
                    formatTime={formatTime}
                  />
                  {index < notifications.length - 1 && <Separator className="my-1 sm:my-2" />}
                </React.Fragment>
              ))}
              {/* Infinite Scroll Sentinel */}
              <div ref={loadMoreRef} className="h-10" />
              {list.isLoadingMore && (
                <div className="py-4 text-center text-muted-foreground">불러오는 중...</div>
              )}
              {list.isReachingEnd && notifications.length > 0 && (
                <div className="py-4 text-center text-muted-foreground">
                  더 이상 알림이 없습니다.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
