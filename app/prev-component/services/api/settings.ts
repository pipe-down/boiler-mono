import { api } from '@/src/lib/axios';

export type NotificationSettings = {
  email: {
    newMessages: boolean;
    tripUpdates: boolean;
    meetupReminders: boolean;
    communityActivity: boolean;
    marketing: boolean;
  };
  push: {
    newMessages: boolean;
    tripUpdates: boolean;
    meetupReminders: boolean;
    communityActivity: boolean;
  };
  inApp: {
    sound: boolean;
    desktop: boolean;
    mobile: boolean;
  };
};

export type PrivacySettings = {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowMessages: 'everyone' | 'friends' | 'none';
  showOnlineStatus: boolean;
  dataTracking: boolean;
  analyticsOptOut: boolean;
};

export type GeneralSettings = {
  language?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await api.get('/users/me/settings/notifications');
  return data?.data ?? data;
}

export async function updateNotificationSettings(input: NotificationSettings) {
  const { data } = await api.put('/users/me/settings/notifications', input);
  return data;
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const { data } = await api.get('/users/me/settings/privacy');
  return data?.data ?? data;
}

export async function updatePrivacySettings(input: PrivacySettings) {
  const { data } = await api.put('/users/me/settings/privacy', input);
  return data;
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const { data } = await api.get('/users/me/settings/general');
  return data?.data ?? data;
}

export async function updateGeneralSettings(input: GeneralSettings) {
  const { data } = await api.put('/users/me/settings/general', input);
  return data;
}
