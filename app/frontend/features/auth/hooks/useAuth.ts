'use client';
import React from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';

export type Me = {
  id: number;
  name: string;
  email?: string;
  profileImageUrl?: string;
  loginId?: string;
  hasLoginId?: boolean;
  role?: string;
  provider?: string;
  createdAt?: string;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  profileCompleteness?: number;
};

type MeCache = { data: Me | null; ts: number };
const ME_CACHE_KEY = 'ME_CACHE';
const ME_CACHE_TTL = 60_000; // 60s

async function fetchMe(): Promise<Me | null> {
  try {
    const u = await api.get("api/users/me").json<any>();
    if (!u) return null;
    return {
      id: Number(u.id),
      name: u.name,
      email: u.email,
      profileImageUrl: u.avatar ?? u.profileImageUrl ?? undefined,
      loginId: u.loginId,
      hasLoginId: u.hasLoginId,
      role: u.role,
      provider: u.provider,
      createdAt: u.createdAt,
      phoneNumber: u.phoneNumber ?? null,
      bio: u.bio ?? null,
      location: u.location ?? null,
      website: u.website ?? null,
      birthDate: u.birthDate ?? null,
      gender: u.gender ?? null,
      profileCompleteness: u.profileCompleteness,
    };
  } catch {
    return null;
  }
}

export function useAuth() {
  const { data, isLoading, isValidating, mutate } = useSWR<Me | null>('me', fetchMe, {
    revalidateOnMount: true, // Ensure initial client-side fetch to reconcile SSR null case after login
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    keepPreviousData: true,
    // Important: avoid client-only fallback at first render to prevent SSR/client mismatch
    fallbackData: undefined,
    // Avoid burst revalidations if multiple instances call mutate simultaneously
    dedupingInterval: 1000,
    // Avoid retry storms on network failures
    shouldRetryOnError: false,
    onSuccess: (d) => {
      try {
        window.localStorage.setItem(
          ME_CACHE_KEY,
          JSON.stringify({ data: d, ts: Date.now() } satisfies MeCache),
        );
      } catch {}
    },
  });

  // React to cross-tab auth events to keep UI in sync
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    let bc: BroadcastChannel | null = null;
    const onMsg = (ev: MessageEvent) => {
      const d: any = (ev as any)?.data ?? (ev as any);
      if (d?.type === 'token-refreshed') {
        mutate();
      } else if (d?.type === 'logged-out') {
        mutate(null, false);
      }
    };
    try {
      bc = new BroadcastChannel('auth-refresh');
      bc.addEventListener('message', onMsg as any);
    } catch {}
    return () => {
      try {
        bc?.removeEventListener('message', onMsg as any);
      } catch {}
      try {
        bc?.close();
      } catch {}
    };
  }, [mutate]);

  return { data, isLoading, isValidating, mutate };
}
