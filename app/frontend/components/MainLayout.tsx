'use client';

import { Header } from "@/components/Header";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAuthInterrupts } from "@/features/auth/ui/useAuthInterrupts";
import { useUIStore } from "@/store/ui";
import { AuthModal } from "@/features/auth/ui/AuthModal";
import { Toaster } from "@chatstack/ui";
import { useNotifications } from "@/hooks/api/useNotifications";
import { NotificationCenter } from "./NotificationCenter";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, mutate } = useAuth();
  useAuthInterrupts();
  const { showAuthModal, setShowAuthModal, showNotifications, setShowNotifications } = useUIStore();

  const { list, unread, readOne, readAll, removeOne } = useNotifications();

  const handleLogout = async () => {
    await fetch('/api/bridge/api/auth/logout', { method: 'POST' });
    mutate(null, false); // Revalidate user data to null
    router.push('/');
  };

  return (
    <>
      <Toaster />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSocialLogin={(provider) => {
          window.location.href = `/oauth2/authorization/${provider}`;
        }}
      />
      <Header
        user={user}
        onLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onNotificationClick={() => setShowNotifications(!showNotifications)}
        onMyPageClick={() => router.push('/my-page')}
        onWishlistClick={() => {}}
        onDashboardClick={() => {}}
        onCommunityClick={() => router.push('/community')}
        onMyActivityClick={() => router.push('/my-activity')}
        onMessagesClick={() => router.push('/chat')}
        onSettingsClick={() => router.push('/settings')}
        onMyTripsAndMeetupsClick={() => {}}
      />
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={list.items}
        onMarkAsRead={async (id) => {
          await readOne.trigger(id);
          await Promise.all([list.mutate(), unread.mutate()]);
        }}
        onMarkAllAsRead={async () => {
          await readAll.trigger();
          await Promise.all([list.mutate(), unread.mutate()]);
        }}
        onDeleteNotification={async (id) => {
          await removeOne.trigger(id);
          await Promise.all([list.mutate(), unread.mutate()]);
        }}
        onNotificationClick={async (n) => {
          setShowNotifications(false);
          if (!n.isRead) {
            await readOne.trigger(n.id);
            await Promise.all([list.mutate(), unread.mutate()]);
          }
          if (n.actionUrl) router.push(n.actionUrl);
        }}
        onViewAllClick={() => {
          setShowNotifications(false);
          router.push('/notifications');
        }}
      />
      <main id="main-content" className="container mx-auto px-4 py-6">
        {children}
      </main>
    </>
  );
}
