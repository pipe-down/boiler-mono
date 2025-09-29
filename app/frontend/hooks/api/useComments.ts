import useSWRInfinite from 'swr/infinite';
import useSWRMutation from 'swr/mutation';
import { invalidateAllForPost, invalidateComments, invalidatePostDetail } from '@/lib/swr-cache';
import {
  getComments,
  createComment as svcCreate,
  updateComment as svcUpdate,
  deleteComment as svcDelete,
  toggleCommentLike as svcToggleLike,
  type Comment,
} from '@/lib/services/comments';

export function useComments(postId: number, pageSize = 20) {
  const getKey = (pageIndex: number, prev: any) => {
    if (prev && prev.last) return null;
    return ['comments', postId, pageIndex, pageSize] as const;
  };
  const swr = useSWRInfinite(getKey, ([, , page]) => getComments(postId, page, pageSize), {
    revalidateOnFocus: false,
  });

  const items: Comment[] = (swr.data || []).flatMap((p) => p?.content || []);

  const total = swr.data?.[0]?.totalElements ?? 0;
  const isReachingEnd = swr.size > 0 && (swr.data?.[swr.size - 1]?.last ?? true);

  return { ...swr, items, total, isReachingEnd };
}

export function useCreateComment(postId: number) {
  return useSWRMutation(
    ['comments', postId, 'create'],
    async (_key, { arg }: { arg: { content: string; parentId?: number } }) => {
      const out = await svcCreate({ postId, ...arg });
      await invalidateComments(postId);
      await invalidatePostDetail(postId);
      return out;
    },
  );
}

export function useUpdateComment(postId: number) {
  return useSWRMutation(
    ['comments', postId, 'update'],
    async (_key, { arg }: { arg: { commentId: number; content: string } }) => {
      const out = await svcUpdate(arg.commentId, postId, { content: arg.content });
      await invalidateComments(postId);
      return out;
    },
  );
}

export function useDeleteComment(postId: number) {
  return useSWRMutation(
    ['comments', postId, 'delete'],
    async (_key, { arg: commentId }: { arg: number }) => {
      await svcDelete(commentId, postId);
      await invalidateComments(postId);
      await invalidatePostDetail(postId);
      return true;
    },
  );
}

export function useToggleCommentLike(postId: number) {
  return useSWRMutation(
    ['comments', postId, 'toggle-like'],
    async (_key, { arg: commentId }: { arg: number }) => {
      const liked = await svcToggleLike(commentId, postId);
      await invalidateComments(postId);
      return liked;
    },
  );
}
