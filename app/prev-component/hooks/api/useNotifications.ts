'use client';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import useSWRInfinite from 'swr/infinite';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from '@/src/services/api/notifications';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useUIStore } from '@/src/store/ui';

export function useNotifications(options?: {
  size?: number;
  isRead?: boolean | 'all';
  type?: string;
  priority?: string;
}) {
  const { data: me } = useAuth();
  const authExpired = useUIStore((s) => s.authExpired);
  const sizePerPage = options?.size ?? 20;
  const isRead = options?.isRead ?? 'all';
  const type = options?.type ?? '';
  const priority = options?.priority ?? '';

  const infinite = useSWRInfinite(
    (pageIndex, previousPageData: any) => {
      if (!me || authExpired) return null;
      if (
        previousPageData &&
        Array.isArray(previousPageData.items) &&
        previousPageData.items.length === 0
      )
        return null;
      return ['notifications', pageIndex, sizePerPage, isRead, type, priority];
    },
    async ([_, pageIndex, size, r, t, p]) =>
      getNotifications({
        page: pageIndex as number,
        size: size as number,
        isRead: r as any,
        type: (t as string) || undefined,
        priority: (p as string) || undefined,
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
      // Avoid infinite loops on 401 while logged-out/expired
      shouldRetryOnError: false,
      errorRetryCount: 0,
    },
  );

  const unread = useSWR(me && !authExpired ? 'notifications:unread-count' : null, getUnreadNotificationCount, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    shouldRetryOnError: false,
    errorRetryCount: 0,
  });

  const readOne = useSWRMutation(['notifications', 'read-one'], (_k, { arg }: { arg: string }) =>
    markNotificationRead(arg),
  );

  const readAll = useSWRMutation(['notifications', 'read-all'], () => markAllNotificationsRead());

  const removeOne = useSWRMutation(
    ['notifications', 'delete-one'],
    (_k, { arg }: { arg: string }) => deleteNotification(arg),
  );

  const removeReadAll = useSWRMutation(['notifications', 'delete-read-all'], () =>
    deleteAllReadNotifications(),
  );

  const pages = infinite.data ?? [];
  const flatItems = pages.flatMap((p: any) => p.items ?? []);
  const total = pages[0]?.total ?? 0;
  const isInitialLoading = infinite.isLoading;
  const isLoadingMore = infinite.isValidating && pages.length > 0;
  const isReachingEnd =
    total > 0
      ? flatItems.length >= total
      : (pages[pages.length - 1]?.items?.length ?? 0) < sizePerPage;

  const list = {
    items: flatItems,
    total,
    size: infinite.size,
    setSize: infinite.setSize,
    isLoadingInitial: isInitialLoading,
    isLoadingMore,
    isReachingEnd,
    isLoading: isInitialLoading || isLoadingMore,
    mutate: infinite.mutate,
  };

  return { list, unread, readOne, readAll, removeOne, removeReadAll };
}
