import { api } from '@/lib/api';

export type Comment = {
  id: number;
  postId: number;
  parentId?: number | null;
  authorId?: number;
  authorName?: string;
  content: string;
  likeCount?: number;
  liked?: boolean;
  createdAt?: string;
  children?: Comment[];
};

type Paged<T> = {
  content: T[];
  totalElements: number;
  totalPages?: number;
  number?: number;
  last?: boolean;
};

export async function getComments(postId: number, page = 0, size = 20): Promise<Paged<Comment>> {
  const data: any = await api.get(`posts/${postId}/comments`, {
    searchParams: { page, size },
  }).json();
  return data?.data ?? data;
}

export async function createComment(input: { postId: number; content: string; parentId?: number }): Promise<Comment> {
  const data: any = await api.post('comments', { json: input }).json();
  return data?.data ?? data;
}

export async function updateComment(commentId: number, postId: number, input: { content: string }): Promise<Comment> {
  const data: any = await api.put(`comments/${commentId}`,
    {
      searchParams: { postId },
      json: input,
    },
  ).json();
  return data?.data ?? data;
}

export async function deleteComment(commentId: number, postId: number): Promise<void> {
  await api.delete(`comments/${commentId}`, { searchParams: { postId } });
}

export async function toggleCommentLike(commentId: number, postId: number): Promise<boolean> {
  const data: any = await api.post(`comments/${commentId}/like`, {
    searchParams: { postId },
  }).json();
  return data?.data ?? data;
}
