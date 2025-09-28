import { create } from 'zustand';

type UIState = {
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (open: boolean) => void;
  authExpired: boolean;
  authBannerMessage?: string;
  setAuthExpired: (open: boolean, message?: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  showAuthModal: false,
  setShowAuthModal: (open) => set({ showAuthModal: open }),
  showNotifications: false,
  setShowNotifications: (open) => set({ showNotifications: open }),
  authExpired: false,
  authBannerMessage: undefined,
  setAuthExpired: (open, message) => set({ authExpired: open, authBannerMessage: message }),
}));
