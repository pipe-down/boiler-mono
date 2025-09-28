import { api } from '@/src/lib/axios';

type ApiResponse<T> = { data: T };
type PageableResponse<T> = { content: T[]; totalElements: number };

// Trips (hosted & joined) from backend /trips/my
export async function getMyTrips() {
  const { data } = await api.get<ApiResponse<PageableResponse<any>>>('/trips/my', {
    params: { page: 0, size: 100, sort: ['createdAt,DESC'] },
  });
  return data.data?.content ?? [];
}

// Meetups are treated as EVENT posts; use /posts/me filtered by type=EVENT
export async function getMyMeetups() {
  const { data } = await api.get<ApiResponse<PageableResponse<any>>>('/posts/me', {
    params: { type: 'EVENT', page: 0, size: 100, sort: ['publishedAt,DESC'] },
  });
  return data.data?.content ?? [];
}
