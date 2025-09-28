import { api } from '@/src/lib/axios';

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

type ApiResponse<T> = { success?: boolean; code?: number; message?: string; data: T };
type Paged<T> = {
  content: T[];
  totalElements: number;
  totalPages?: number;
  number?: number;
  last?: boolean;
};

export async function getComments(postId: number, page = 0, size = 20) {
  const { data } = await api.get<ApiResponse<Paged<Comment>>>(`/posts/${postId}/comments`, {
    params: { page, size },
  });
  return data.data;
}

export async function createComment(input: { postId: number; content: string; parentId?: number }) {
  const { data } = await api.post<ApiResponse<Comment>>('/comments', input);
  return data.data;
}

export async function updateComment(commentId: number, postId: number, input: { content: string }) {
  const { data } = await api.put<ApiResponse<Comment>>(`/comments/${commentId}`, input, {
    params: { postId },
  });
  return data.data;
}

export async function deleteComment(commentId: number, postId: number) {
  await api.delete(`/comments/${commentId}`, { params: { postId } });
}

export async function toggleCommentLike(commentId: number, postId: number) {
  const { data } = await api.post<ApiResponse<boolean>>(`/comments/${commentId}/like`, null, {
    params: { postId },
  });
  return data.data;
}
