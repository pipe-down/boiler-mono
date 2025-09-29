import { api } from '@/lib/api';
import type { Trip } from '@/types/trip';

type ApiResponse<T> = {
  success?: boolean;
  code?: number;
  message?: string;
  data: T;
};

type ApiTrip = {
  id: number;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  destination?: string;
  location?: string;
  coverImageUrl?: string;
  coverImage?: string;
  fileUrls?: string[];
  currentMembers?: number;
  memberCount?: number;
  maxMembers?: number;
  creatorName?: string;
  createdAt?: string;
};

type ApiPage<T> = {
  content: T[];
  totalElements: number;
};

export async function getTrips(params?: { page?: number; size?: number; keyword?: string }) {
  const page = params?.page ?? 0;
  const size = params?.size ?? 8;
  const keyword = params?.keyword ?? '';

  const url = 'trips/public/search';
  const data: ApiResponse<ApiPage<ApiTrip>> = await api.get(url, {
    searchParams: {
      keyword: keyword || undefined,
      page,
      size,
      condition: '{}',
    },
  }).json();

  const items: Trip[] = (data.data?.content ?? []).map((t) => ({
    id: String(t.id),
    title: t.title,
    destination: t.destination || t.location || '미정',
    dates: t.startDate && t.endDate ? `${t.startDate} - ${t.endDate}` : '',
    participants: t.currentMembers ?? t.memberCount ?? 0,
    maxParticipants: t.maxMembers ?? 0,
    imageUrl: t.coverImageUrl || t.coverImage || (t.fileUrls && t.fileUrls[0]) || '',
    description: t.description || '',
    createdBy: t.creatorName || '',
    categories: [],
    createdAt: t.createdAt || new Date().toISOString(),
  }));

  return { items, total: data.data?.totalElements ?? items.length };
}

export async function createTrip(input: {
  title: string;
  destination?: string;
  dates?: string;
  maxParticipants?: number;
  description?: string;
  coverImageUrl?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const body = {
    title: input.title,
    description: input.description || '',
    startDate: today,
    endDate: today,
    destination: input.destination || '',
    visibility: 'PUBLIC',
    coverImageUrl: input.coverImageUrl || '',
    maxMembers: input.maxParticipants || 10,
  };
  const form = new FormData();
  form.append('requestDto', new Blob([JSON.stringify(body)], { type: 'application/json' }) as any);
  const data = await api.post('trips', { body: form }).json();
  return data;
}

// My trips (hosted / member)
export async function getMyTrips(params?: {
  isCreator?: boolean;
  isMember?: boolean;
  keyword?: string;
  status?: string;
  visibility?: string;
  page?: number;
  size?: number;
}) {
  const data: ApiResponse<ApiPage<ApiTrip>> = await api.get('trips/my', {
    searchParams: {
      isCreator: params?.isCreator,
      isMember: params?.isMember,
      keyword: params?.keyword || undefined,
      status: params?.status || undefined,
      visibility: params?.visibility || undefined,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  }).json();

  const items: Trip[] = (data.data?.content ?? []).map((t) => ({
    id: String(t.id),
    title: t.title,
    destination: t.destination || t.location || '미정',
    dates: t.startDate && t.endDate ? `${t.startDate} - ${t.endDate}` : '',
    participants: t.currentMembers ?? t.memberCount ?? 0,
    maxParticipants: t.maxMembers ?? 0,
    imageUrl: t.coverImageUrl || t.coverImage || (t.fileUrls && t.fileUrls[0]) || '',
    description: t.description || '',
    createdBy: t.creatorName || '',
    categories: [],
    createdAt: t.createdAt || new Date().toISOString(),
  }));

  return { items, total: data.data?.totalElements ?? items.length };
}

// Trip detail — try auth first, fallback to public if unauthorized
export async function getTripById(tripId: string | number) {
  try {
    const data: ApiResponse<ApiTrip> = await api.get(`trips/${tripId}`).json();
    return data.data;
  } catch (e: any) {
    const status = e?.response?.status;
    const err = await e.response.json().catch(() => ({}));
    const code = err?.errorCode || err?.code;
    const msg: string | undefined = err?.message;
    // Fallback for unauthorized or not-a-member
    if (
      status === 401 ||
      (status === 403 &&
        (code === 'TR002' || (typeof msg === 'string' && msg.includes('여행 멤버가 아닙니다'))))
    ) {
      const data: ApiResponse<ApiTrip> = await api.get(`trips/public/${tripId}`).json();
      return data.data;
    }
    throw e;
  }
}

// Join/request/invite
export async function requestJoinPublicTrip(tripId: number, nickname?: string) {
  const params = new URLSearchParams();
  if (nickname) params.set('nickname', nickname);
  const data = await api.post(
    `trips/${tripId}/request-join?${params.toString() || ''}`,
  ).json();
  return data;
}

export async function joinTripByInviteCode(inviteCode: string, nickname?: string) {
  const params = new URLSearchParams();
  params.set('inviteCode', inviteCode);
  if (nickname) params.set('nickname', nickname);
  const data = await api.post(`/trips/join?${params.toString()}`).json();
  return data;
}

export async function validateInviteCode(inviteCode: string) {
  const data: ApiResponse<{ valid: boolean; tripId?: number; tripTitle?: string; creatorName?: string }> = await api.get(`/trips/invite-code/${inviteCode}/validate`).json();
  return data.data;
}

// Members/roles
export async function getTripMembers(tripId: string | number) {
  const data: ApiResponse<any[]> = await api.get(`/trips/${tripId}/members`).json();
  return data.data || [];
}

export async function updateMemberRole(
  tripId: string | number,
  targetUserId: string | number,
  role: string,
) {
  const params = new URLSearchParams();
  params.set('newRole', role);
  const data = await api.put(
    `/trips/${tripId}/members/${targetUserId}/role?${params.toString()}`,
  ).json();
  return data;
}

export async function removeMember(tripId: string | number, targetUserId: string | number) {
  const data = await api.delete(`/trips/${tripId}/members/${targetUserId}`).json();
  return data;
}

// Status/leave/invite
export async function updateTripStatus(tripId: string | number, status: string) {
  const params = new URLSearchParams();
  params.set('newStatus', status);
  const data = await api.put(`/trips/${tripId}/status?${params.toString()}`).json();
  return data;
}

export async function regenerateInviteCode(tripId: string | number) {
  const data = await api.post(`/trips/${tripId}/invite-code/regenerate`).json();
  return data;
}

export async function getInviteCode(tripId: string | number) {
  const data: any = await api.get(`/trips/${tripId}/invite-code`).json();
  return data?.data ?? data;
}

export async function leaveTrip(tripId: string | number) {
  const data = await api.delete(`/trips/${tripId}/leave`).json();
  return data;
}
