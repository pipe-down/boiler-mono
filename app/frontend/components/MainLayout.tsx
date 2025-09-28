'use client';

import { Header } from "@/components/Header";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useAuthInterrupts } from "@/features/auth/ui/useAuthInterrupts";
import { useUIStore } from "@/store/ui";
import { AuthModal } from "@/features/auth/ui/AuthModal";
import { Toaster } from "@chatstack/ui";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, mutate } = useAuth();
  useAuthInterrupts();
  const { showAuthModal, setShowAuthModal } = useUIStore();

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
        onNotificationClick={() => {}}
        onMyPageClick={() => router.push('/mypage')}
        onWishlistClick={() => {}}
        onDashboardClick={() => {}}
        onCommunityClick={() => router.push('/community')}
        onMyActivityClick={() => {}}
        onMessagesClick={() => router.push('/chat')}
        onSettingsClick={() => {}}
        onMyTripsAndMeetupsClick={() => {}}
      />
      <main id="main-content" className="container mx-auto px-4 py-6">
        {children}
      </main>
    </>
  );
}
