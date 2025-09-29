import useSWRInfinite from 'swr/infinite';
import useSWRMutation from 'swr/mutation';
import {
  getTimelineActivities,
  addTimelineMessage,
  addTimelineComment,
  getTimelineComments,
  deleteTimelineComment,
  toggleTimelineLike,
} from '@/lib/services/timeline';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useTimeline(tripId: string | number, pageSize = 10) {
  const { data: me } = useAuth();
  const getKey = (pageIndex: number, prev: any) => {
    if (!me) return null;
    if (prev && prev.last) return null;
    return ['timeline', tripId, pageIndex, pageSize] as const;
  };
  const swr = useSWRInfinite(
    getKey,
    async ([, id, page]) => {
      const pageData = await getTimelineActivities(String(id), page, pageSize);
      const last = !pageData || (pageData.content?.length ?? 0) < pageSize;
      return { ...pageData, last };
    },
    { revalidateOnFocus: false },
  );

  const items = (swr.data || []).flatMap((p) => p?.content || []);
  const total = swr.data?.[0]?.totalElements ?? 0;
  const isReachingEnd = swr.size > 0 && (swr.data?.[swr.size - 1]?.last ?? true);
  return { ...swr, items, total, isReachingEnd };
}

export function useTimelineActions(tripId: string | number) {
  const addMessage = useSWRMutation(
    ['timeline', tripId, 'addMessage'],
    async (_k, { arg }: { arg: { content: string } }) => {
      return addTimelineMessage(String(tripId), arg.content);
    },
  );

  const addComment = useSWRMutation(
    ['timeline', tripId, 'addComment'],
    async (_k, { arg }: { arg: { activityId: number; activityType: string; content: string } }) => {
      return addTimelineComment(String(tripId), arg.activityId, arg.activityType, arg.content);
    },
  );

  const delComment = useSWRMutation(
    ['timeline', tripId, 'delComment'],
    async (_k, { arg }: { arg: { commentId: number } }) => {
      await deleteTimelineComment(String(tripId), arg.commentId);
      return true;
    },
  );

  const toggleLike = useSWRMutation(
    ['timeline', tripId, 'toggleLike'],
    async (_k, { arg }: { arg: { activityId: number; activityType: string } }) => {
      return toggleTimelineLike(String(tripId), arg.activityId, arg.activityType);
    },
  );

  return { addMessage, addComment, delComment, toggleLike };
}

export function useTimelineComments(
  tripId: string | number,
  activityId: number,
  activityType: string,
  pageSize = 10,
) {
  const { data: me } = useAuth();
  const getKey = (pageIndex: number, prev: any) => {
    if (!me) return null;
    if (prev && prev.last) return null;
    return ['timeline-comments', tripId, activityId, activityType, pageIndex, pageSize] as const;
  };
  const swr = useSWRInfinite(
    getKey,
    async ([, id, aId, aType, page]) => {
      const pageData = await getTimelineComments(
        String(id),
        String(aId),
        String(aType),
        page,
        pageSize,
      );
      const last = !pageData || (pageData.content?.length ?? 0) < pageSize;
      return { ...pageData, last };
    },
    { revalidateOnFocus: false },
  );

  const items = (swr.data || []).flatMap((p) => p?.content || []);
  const total = swr.data?.[0]?.totalElements ?? 0;
  const isReachingEnd = swr.size > 0 && (swr.data?.[swr.size - 1]?.last ?? true);
  return { ...swr, items, total, isReachingEnd };
}
