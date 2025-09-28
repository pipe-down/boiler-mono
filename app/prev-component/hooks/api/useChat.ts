'use client';
import useSWR from 'swr';
import { getChatRooms, getChatMessages } from '@/src/services/api/chats';
import { useAuth } from '@/src/features/auth/hooks/useAuth';

export function useChatRooms() {
  const { data: me } = useAuth();
  return useSWR(me ? ['chats', 'rooms'] : null, () => getChatRooms(), {
    revalidateOnFocus: false,
    shouldRetryOnError: (error: any) => error?.response?.status !== 401,
    errorRetryCount: 0,
  });
}

export function useChatMessages(roomId?: number, params?: { page?: number; size?: number }) {
  const { data: me } = useAuth();
  const key =
    me && roomId
      ? (['chats', 'messages', roomId, params?.page ?? 0, params?.size ?? 50] as const)
      : null;
  return useSWR(key, () => getChatMessages(roomId!, params), {
    revalidateOnFocus: false,
    shouldRetryOnError: (error: any) => error?.response?.status !== 401,
    errorRetryCount: 0,
  });
}
