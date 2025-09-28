import { api } from '@/src/lib/axios';
import type { Notification } from '@/src/types/notification';

type ApiResponse<T> = {
  success?: boolean;
  code?: number;
  message?: string;
  data: T;
};

type PageableResponse<T> = {
  content: T[];
  totalElements: number;
};

export async function getNotifications(params?: {
  page?: number;
  size?: number;
  isRead?: boolean | 'all';
  type?: string;
  priority?: string;
}) {
  const page = params?.page ?? 0;
  const size = params?.size ?? 20;
  const isRead = params?.isRead === 'all' ? undefined : params?.isRead;
  const type = params?.type || undefined;
  const priority = params?.priority || undefined;

  const { data } = await api.get<ApiResponse<PageableResponse<any>>>('/notifications', {
    params: { page, size, sort: ['createdAt,DESC'], isRead, type, priority },
  });

  // 서버 스키마 → 프론트 스키마 매핑
  const items: Notification[] = (data.data?.content ?? []).map((n: any) => ({
    id: String(n.id ?? n.notificationId ?? n.uuid ?? ''),
    type: (n.type as Notification['type']) ?? 'message',
    title: n.title ?? n.messageTitle ?? '알림',
    message: n.message ?? n.content ?? '',
    timestamp: n.createdAt ?? n.timestamp ?? new Date().toISOString(),
    isRead: Boolean(n.read ?? n.isRead ?? false),
    userId: n.actorUserId ? String(n.actorUserId) : undefined,
    userName: n.actorUserName,
    userAvatar: n.actorUserAvatar,
    tripId: n.tripId ? String(n.tripId) : undefined,
    meetupId: n.meetupId ? String(n.meetupId) : undefined,
    actionUrl: n.actionUrl,
  }));

  return { items, total: data.data?.totalElements ?? items.length };
}

export async function getUnreadNotificationCount() {
  const { data } = await api.get<ApiResponse<number>>('/notifications/unread-count');
  return data.data ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  await api.put(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead() {
  // OpenAPI 상으로는 PUT /notifications/read-all 제공
  await api.put('/notifications/read-all');
}

export async function deleteNotification(notificationId: string) {
  await api.delete(`/notifications/${notificationId}`);
}

export async function deleteAllReadNotifications() {
  await api.delete('/notifications/read-all');
}
