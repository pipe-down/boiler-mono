"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { HeaderUser } from "@/src/lib/auth/session";
import { Header } from "@/src/components/Header";
import { useUIStore } from "@/src/store/ui";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { useNotifications } from "@/src/hooks/api/useNotifications";

/**
 * A thin client wrapper that wires router.refresh() after auth transitions
 * and injects the server-fetched user into the Header as props.
 */
export default function HeaderClient({ user }: { user: HeaderUser }) {
  const router = useRouter();

  // Cross-tab refresh on auth changes (optional but handy)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth:changed") router.refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  const setShowAuthModal = useUIStore((s) => s.setShowAuthModal);
  const setShowNotifications = useUIStore((s) => s.setShowNotifications);

  // Client-side auth/user fallback: prefer client "me" when available
  const { data: me } = useAuth();
  const { unread } = useNotifications();

  const effectiveUser = useMemo(() => {
    if (me === undefined) {
      // Use SSR value directly: if SSR was logged-out (null), show login button immediately.
      // If SSR had user, keep it to avoid any flash.
      return user ?? undefined;
    }
    if (me === null) return null; // logged out
    return {
      id: String(me.id),
      name: me.name,
      email: me.email || "",
      avatar: me.profileImageUrl,
      unreadNotifications: typeof unread.data === "number" ? unread.data : (user?.unreadNotifications ?? 0),
    };
  }, [me, unread.data, user]);

  const headerProps = useMemo(() => ({
    user: effectiveUser,
    onLogin: () => setShowAuthModal(true),
    onLogout: async () => {
      try {
        await fetch('/api/bff/logout', { method: 'POST' });
      } catch {}
      try {
        const { broadcastAuth } = await import('@/src/lib/auth-broadcast');
        broadcastAuth('logged-out');
      } catch {}
      try {
        const { mutate } = await import('swr');
        mutate('me', null, false);
      } catch {}
      try {
        const { invalidateAllApiCaches } = await import('@/src/lib/swr-cache');
        invalidateAllApiCaches();
      } catch {}
      router.refresh();
    },
    // Notifications: default → open modal; with modifiers → navigate
    onNotificationClick: (e?: React.MouseEvent) => {
      const withModifier = !!e && (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || e.button === 1);
      if (withModifier) {
        router.push('/notifications');
        return;
      }
      // Prevent default link/navigation behaviors
      try { e?.preventDefault?.(); e?.stopPropagation?.(); } catch {}
      // open modal
      setShowAuthModal(false);
      setShowNotifications(true);
    },
    onMyPageClick: () => router.push("/my"),
    onWishlistClick: () => router.push("/my"),
    onDashboardClick: () => router.push("/dashboard"),
    onCommunityClick: () => router.push("/community"),
    onMyActivityClick: () => router.push("/my/activities"),
    onMessagesClick: () => router.push("/messages"),
    onSettingsClick: () => router.push("/settings"),
    onMyTripsAndMeetupsClick: () => router.push("/my/activities"),
    onSearchResults: (q: string) => router.push(`/search?q=${encodeURIComponent(q)}`),
    onTripTabClick: () => router.push("/trips"),
    onMeetupTabClick: () => router.push("/meetups"),
  }), [router, effectiveUser, setShowAuthModal, setShowNotifications]);

  return <Header {...headerProps} user={effectiveUser ?? null} />;
}
