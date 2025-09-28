import { api } from '@/src/lib/axios';
import type { Meetup } from '@/src/types/meetup';

type PostSummary = {
  id: number;
  title: string;
  summary?: string;
  authorName?: string;
  category?: string;
  likeCount?: number;
  viewCount?: number;
  publishedAt?: string;
};

type PageableResponse<T> = {
  content: T[];
  totalElements: number;
};

type ApiResponse<T> = {
  success?: boolean;
  code?: number;
  message?: string;
  data: T;
};

export async function getMeetups(params?: { page?: number; size?: number; keyword?: string }) {
  const page = params?.page ?? 0;
  const size = params?.size ?? 12;
  const keyword = params?.keyword ?? '';

  // Meetups는 백엔드에서 EVENT 타입 게시글로 간주하여 매핑합니다.
  const { data } = await api.get<ApiResponse<PageableResponse<PostSummary>>>('/posts', {
    params: {
      type: 'EVENT',
      keyword: keyword || undefined,
      page,
      size,
      sort: 'publishedAt,DESC',
    },
  });

  const items: Meetup[] = (data.data?.content ?? []).map((p) => ({
    id: String(p.id),
    title: p.title,
    location: p.category || '미정',
    date: (p.publishedAt || '').slice(0, 10),
    time: (p.publishedAt || '').slice(11, 16),
    participants: p.likeCount ?? 0,
    maxParticipants: 0,
    imageUrl: '',
    description: p.summary || '',
    createdBy: p.authorName || '',
    category: p.category || '기타',
    createdAt: p.publishedAt || new Date().toISOString(),
  }));

  return { items, total: data.data?.totalElements ?? items.length };
}
