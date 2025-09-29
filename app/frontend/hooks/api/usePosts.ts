'use client';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { invalidateAllForPost, invalidatePostLists, invalidatePostDetail } from '@/lib/swr-cache';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  togglePostBookmark,
  togglePostLike,
} from '@/lib/services/posts';

export function usePosts(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  type?: string;
}) {
  const key = [
    'posts',
    params?.page ?? 0,
    params?.size ?? 10,
    params?.keyword ?? '',
    params?.type ?? '',
  ] as const;
  return useSWR(key, () => getPosts(params), { revalidateOnFocus: false });
}

export function useCreatePost() {
  return useSWRMutation(
    ['posts', 'create'],
    (
      _key,
      {
        arg,
      }: {
        arg: {
          title: string;
          content: string;
          category?: string;
          type?: string;
          tags?: string[];
          files?: File[];
          onProgress?: (p: number) => void;
        };
      },
    ) => createPost(arg).then(async (out) => {
      await invalidatePostLists();
      return out;
    }),
  );
}

export function usePost(postId?: number) {
  return useSWR(postId ? ['post', postId] : null, () => getPost(postId as number), {
    revalidateOnFocus: false,
  });
}

export function useUpdatePost() {
  return useSWRMutation(
    ['posts', 'update'],
    (
      _key,
      {
        arg,
      }: {
        arg: {
          postId: number;
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
          newFiles?: File[];
          deletedFileIds?: number[];
        };
      },
    ) => updatePost(arg.postId, arg),
    {
      onSuccess: async (_data, _key, _cfg) => {
        await invalidatePostDetail((_key as any)[2]?.postId ?? (arguments as any)[1]?.arg?.postId);
        await invalidatePostLists();
      },
    }
  );
}

export function useDeletePost() {
  return useSWRMutation(
    ['posts', 'delete'],
    async (_key, { arg: postId }: { arg: number }) => {
      await deletePost(postId);
      await invalidateAllForPost(postId);
      return true;
    },
  );
}

export function useTogglePostLike() {
  return useSWRMutation(['posts', 'like'], (_key, { arg }: { arg: { postId: number } }) =>
    togglePostLike(arg.postId),
  );
}

export function useTogglePostBookmark() {
  return useSWRMutation(['posts', 'bookmark'], (_key, { arg }: { arg: { postId: number } }) =>
    togglePostBookmark(arg.postId),
  );
}
