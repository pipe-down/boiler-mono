'use client';
import useSWR from 'swr';
import { getMeetups } from '@/src/services/api/meetups';

export function useMeetups(params?: { page?: number; size?: number; keyword?: string }) {
  const key = ['meetups', params?.page ?? 0, params?.size ?? 12, params?.keyword ?? ''] as const;
  const swr = useSWR(key, () => getMeetups(params), { revalidateOnFocus: false });
  return swr;
}
