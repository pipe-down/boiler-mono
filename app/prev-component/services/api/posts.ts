import { api } from '@/src/lib/axios';

export type PostSummary = {
  id: number;
  title: string;
  summary?: string;
  authorName?: string;
  category?: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  createdAt?: string;
};

type PageableResponse<T> = {
  content: T[];
  totalElements: number;
};

type ApiResponse<T> = { success?: boolean; code?: number; message?: string; data: T };

export async function getPosts(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  type?: string;
}) {
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  const keyword = params?.keyword ?? '';
  const type = params?.type;
  // Support both shapes:
  // 1) { success, message, data: T[], pageInfo: { totalElements, ... } }
  // 2) { success, message, data: { content: T[], totalElements } }
  const res = await api.get('/posts', {
    params: { page, size, keyword: keyword || undefined, type: type || undefined },
  });
  const raw = res.data as any;
  const items = Array.isArray(raw?.data) ? raw.data : (raw?.data?.content ?? []);
  const totalElements =
    (raw?.pageInfo?.totalElements as number | undefined) ??
    (raw?.data?.totalElements as number | undefined) ??
    (Array.isArray(items) ? items.length : 0);
  return { content: items, totalElements };
}

type CreatePostInput = {
  title: string;
  content: string;
  category?: string; // UI id or enum
  type?: string; // enum name e.g., GENERAL
  tags?: string[];
  files?: File[];
  onProgress?: (percent: number) => void;
};

function mapCategoryToEnum(category?: string): string {
  if (!category) return 'FREE';
  const key = category.toLowerCase();
  const map: Record<string, string> = {
    all: 'FREE',
    free: 'FREE',
    review: 'TRAVEL_REVIEW',
    tip: 'TRAVEL_TIP',
    question: 'TRAVEL_QNA',
    companion: 'TRAVEL_COMPANION',
    recommend: 'TRAVEL_RECOMMEND',
    photo: 'PHOTO',
    video: 'VIDEO',
    restaurant: 'FOOD',
    accommodation: 'ACCOMMODATION',
    transportation: 'TRANSPORTATION',
    budget: 'BUDGET',
    culture: 'CULTURE',
    shopping: 'SHOPPING',
    emergency: 'EMERGENCY',
  };
  // if already a backend enum, pass through
  const passThrough = [
    'FREE',
    'TRAVEL_REVIEW',
    'TRAVEL_TIP',
    'TRAVEL_QNA',
    'TRAVEL_COMPANION',
    'TRAVEL_RECOMMEND',
    'PHOTO',
    'VIDEO',
    'FOOD',
    'ACCOMMODATION',
    'TRANSPORTATION',
    'BUDGET',
    'CULTURE',
    'SHOPPING',
    'EMERGENCY',
  ];
  if (passThrough.includes(category)) return category;
  return map[key] ?? 'FREE';
}

function mapTypeToEnum(type?: string): string {
  if (!type) return 'GENERAL';
  const upper = type.toUpperCase();
  const allowed = ['GENERAL', 'NOTICE', 'EVENT', 'GUIDE', 'FAQ', 'NEWS'];
  return allowed.includes(upper) ? upper : 'GENERAL';
}

export async function createPost(input: CreatePostInput) {
  // 생성은 멀티파트 표준(requestDto + files)
  const payload = {
    title: input.title,
    content: input.content,
    type: mapTypeToEnum(input.type),
    category: mapCategoryToEnum(input.category),
    tagNames: input.tags || [],
    isCommentAllowed: true,
    isDraft: false,
  } as any;
  const form = new FormData();
  form.append(
    'requestDto',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }) as any,
  );
  for (const f of input.files || []) form.append('files', f);
  const { data } = await api.post('/posts', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (!evt.total) return;
      const percent = Math.round((evt.loaded * 100) / evt.total);
      try { input.onProgress?.(percent); } catch {}
    },
  });
  // unify ApiResponse/Raw shapes
  return data && typeof data === 'object' && 'data' in data ? (data as any).data : data;
}

export async function getPost(postId: number) {
  const { data } = await api.get(`/posts/${postId}`);
  return data?.data ?? data;
}

export async function updatePost(
  postId: number,
  input: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
    newFiles?: File[];
    deletedFileIds?: number[];
  },
) {
  // If files provided, use multipart form; otherwise JSON
  if (input?.newFiles?.length || input?.deletedFileIds?.length) {
    const form = new FormData();
    const payload = {
      title: input.title,
      content: input.content,
      category: mapCategoryToEnum(input.category),
      tags: input.tags,
      deletedFileIds: input.deletedFileIds || [],
    };
    form.append(
      'requestDto',
      new Blob([JSON.stringify(payload)], { type: 'application/json' }) as any,
    );
    for (const f of input.newFiles || []) form.append('files', f);
    const { data } = await api.put(`/posts/${postId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data && typeof data === 'object' && 'data' in data ? (data as any).data : data;
  }
  const { data } = await api.put(`/posts/${postId}`, {
    title: input.title,
    content: input.content,
    category: mapCategoryToEnum(input.category),
    tags: input.tags,
    deletedFileIds: input.deletedFileIds || [],
  });
  return data && typeof data === 'object' && 'data' in data ? (data as any).data : data;
}

export async function deletePost(postId: number) {
  const { data } = await api.delete(`/posts/${postId}`);
  return data;
}

export async function togglePostLike(postId: number) {
  const { data } = await api.put(`/posts/${postId}/like/toggle`);
  return data;
}

export async function togglePostBookmark(postId: number) {
  // 서버가 토글을 지원하지 않는 경우가 있어도 idempotent 하다고 가정
  const { data } = await api.post(`/posts/${postId}/bookmark`);
  return data;
}
