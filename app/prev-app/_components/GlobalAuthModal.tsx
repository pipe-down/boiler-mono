"use client";

import dynamic from "next/dynamic";
import { useUIStore } from "@/src/store/ui";

const AuthModal = dynamic(
  () => import("@/src/features/auth/ui/AuthModal").then((m) => m.AuthModal),
  { ssr: false },
);

export default function GlobalAuthModal() {
  const showAuthModal = useUIStore((s) => s.showAuthModal);
  const setShowAuthModal = useUIStore((s) => s.setShowAuthModal);

  const handleSocialLogin = (provider: "kakao" | "naver" | "google") => {
    try {
      localStorage.setItem("lastOAuthProvider", provider);
    } catch {}
    try {
      document.cookie = `last_oauth_provider=${provider}; Max-Age=15552000; Path=/; SameSite=Lax`;
    } catch {}
    window.location.href = `/oauth2/authorization/${provider}`;
  };

  return (
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      onSocialLogin={handleSocialLogin}
    />
  );
}
