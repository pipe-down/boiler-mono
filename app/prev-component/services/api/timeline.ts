import { api } from '@/src/lib/axios';

type ApiResponse<T> = { success?: boolean; code?: number; message?: string; data: T };

export type TimelineActivity = {
  referenceId: number;
  activityType: string;
  activityTime: string;
  userId: number;
  userName: string;
  userProfileImageUrl?: string;
  title?: string;
  description?: string;
  metadata?: string;
  likes?: { count: number; isLiked: boolean };
  comments?: { count: number };
};

export type TimelineComment = {
  id: number;
  content: string;
  author: { id: number; name: string; profileImageUrl?: string };
  createdAt: string;
};

export async function getTimelineActivities(tripId: string | number, page = 0, size = 10) {
  // BE는 /recent-activities?limit=만 지원하므로 간이 페이징: limit=(page+1)*size 후 슬라이스
  const limit = Math.max(size * (page + 1), size);
  const { data } = await api.get<ApiResponse<TimelineActivity[]>>(
    `/trips/${tripId}/timeline/recent-activities`,
    { params: { limit } },
  );
  const all = data.data || [];
  const offset = page * size;
  const pageItems = all.slice(offset, offset + size);
  return { content: pageItems, totalElements: all.length };
}

export async function addTimelineMessage(tripId: string | number, content: string) {
  const { data } = await api.post<ApiResponse<TimelineActivity>>(
    `/trips/${tripId}/timeline/comments`,
    { content },
  );
  return data.data;
}

export async function addTimelineComment(
  tripId: string | number,
  activityId: string | number,
  activityType: string,
  content: string,
) {
  const { data } = await api.post<ApiResponse<TimelineComment>>(
    `/trips/${tripId}/timeline/activities/${activityId}/comments`,
    { content },
    { params: { activityType } },
  );
  return data.data;
}

export async function getTimelineComments(
  tripId: string | number,
  activityId: string | number,
  activityType: string,
  page = 0,
  size = 10,
) {
  const { data } = await api.get<
    ApiResponse<{ content: TimelineComment[]; totalElements: number }>
  >(`/trips/${tripId}/timeline/activities/${activityId}/comments`, {
    params: { activityType, page, size, sort: 'createdAt,desc' },
  });
  const d: any = data.data;
  if (Array.isArray(d)) return { content: d, totalElements: d.length };
  return d;
}

export async function deleteTimelineComment(tripId: string | number, commentId: string | number) {
  await api.delete(`/trips/${tripId}/timeline/comments/${commentId}`);
}

export async function toggleTimelineLike(
  tripId: string | number,
  activityId: string | number,
  activityType: string,
) {
  const { data } = await api.put<ApiResponse<any>>(
    `/trips/${tripId}/timeline/activities/${activityId}/like`,
    null,
    { params: { activityType } },
  );
  const payload = data?.data || {};
  return {
    activityId: Number(payload.activityId ?? activityId),
    activityType: String(payload.activityType ?? activityType),
    isLiked: Boolean(payload.liked ?? payload.isLiked),
    likeCount: Number(payload.likeCount ?? 0),
  };
}

export async function getTimelineSummary(tripId: string | number, date: string) {
  const { data } = await api.get<ApiResponse<any>>(`/trips/${tripId}/timeline/summary`, {
    params: { date },
  });
  return data.data;
}

export async function getTimelineSummaries(
  tripId: string | number,
  startDate: string,
  endDate: string,
) {
  const { data } = await api.get<ApiResponse<any[]>>(`/trips/${tripId}/timeline/summaries`, {
    params: { startDate, endDate },
  });
  return data.data || [];
}

export async function getTripTimelineSummary(tripId: string | number) {
  const { data } = await api.get<ApiResponse<any[]>>(`/trips/${tripId}/timeline/trip-summary`);
  return data.data || [];
}
