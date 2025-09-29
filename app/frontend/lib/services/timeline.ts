import { api } from '@/lib/api';

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
  const data: ApiResponse<TimelineActivity[]> = await api.get(
    `trips/${tripId}/timeline/recent-activities`,
    { searchParams: { limit } },
  ).json();
  const all = data.data || [];
  const offset = page * size;
  const pageItems = all.slice(offset, offset + size);
  return { content: pageItems, totalElements: all.length };
}

export async function addTimelineMessage(tripId: string | number, content: string) {
  const data: ApiResponse<TimelineActivity> = await api.post(
    `trips/${tripId}/timeline/comments`,
    { json: { content } },
  ).json();
  return data.data;
}

export async function addTimelineComment(
  tripId: string | number,
  activityId: string | number,
  activityType: string,
  content: string,
) {
  const data: ApiResponse<TimelineComment> = await api.post(
    `trips/${tripId}/timeline/activities/${activityId}/comments`,
    {
      searchParams: { activityType },
      json: { content },
    },
  ).json();
  return data.data;
}

export async function getTimelineComments(
  tripId: string | number,
  activityId: string | number,
  activityType: string,
  page = 0,
  size = 10,
) {
  const data: ApiResponse<{ content: TimelineComment[]; totalElements: number }> = await api.get(
    `trips/${tripId}/timeline/activities/${activityId}/comments`,
    {
      searchParams: { activityType, page, size, sort: 'createdAt,desc' },
    },
  ).json();
  const d: any = data.data;
  if (Array.isArray(d)) return { content: d, totalElements: d.length };
  return d;
}

export async function deleteTimelineComment(tripId: string | number, commentId: string | number) {
  await api.delete(`trips/${tripId}/timeline/comments/${commentId}`);
}

export async function toggleTimelineLike(
  tripId: string | number,
  activityId: string | number,
  activityType: string,
) {
  const data: ApiResponse<any> = await api.put(
    `trips/${tripId}/timeline/activities/${activityId}/like`,
    {
      searchParams: { activityType },
    },
  ).json();
  const payload = data?.data || {};
  return {
    activityId: Number(payload.activityId ?? activityId),
    activityType: String(payload.activityType ?? activityType),
    isLiked: Boolean(payload.liked ?? payload.isLiked),
    likeCount: Number(payload.likeCount ?? 0),
  };
}

export async function getTimelineSummary(tripId: string | number, date: string) {
  const data: ApiResponse<any> = await api.get(`trips/${tripId}/timeline/summary`, {
    searchParams: { date },
  }).json();
  return data.data;
}

export async function getTimelineSummaries(
  tripId: string | number,
  startDate: string,
  endDate: string,
) {
  const data: ApiResponse<any[]> = await api.get(`trips/${tripId}/timeline/summaries`, {
    searchParams: { startDate, endDate },
  }).json();
  return data.data || [];
}

export async function getTripTimelineSummary(tripId: string | number) {
  const data: ApiResponse<any[]> = await api.get(`trips/${tripId}/timeline/trip-summary`).json();
  return data.data || [];
}
