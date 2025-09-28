'use client';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import {
  getNotificationSettings,
  getPrivacySettings,
  getGeneralSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  updateGeneralSettings,
} from '@/src/services/api/settings';
import { useAuth } from '@/src/features/auth/hooks/useAuth';

export function useMyNotificationSettings() {
  const { data: me } = useAuth();
  const swr = useSWR(me ? ['me', 'settings', 'notifications'] : null, getNotificationSettings, {
    revalidateOnFocus: false,
  });
  const mut = useSWRMutation(
    ['me', 'settings', 'notifications', 'update'],
    (_k, { arg }: { arg: any }) => updateNotificationSettings(arg),
  );
  return { ...swr, update: mut.trigger };
}

export function useMyPrivacySettings() {
  const { data: me } = useAuth();
  const swr = useSWR(me ? ['me', 'settings', 'privacy'] : null, getPrivacySettings, {
    revalidateOnFocus: false,
  });
  const mut = useSWRMutation(['me', 'settings', 'privacy', 'update'], (_k, { arg }: { arg: any }) =>
    updatePrivacySettings(arg),
  );
  return { ...swr, update: mut.trigger };
}

export function useMyGeneralSettings() {
  const { data: me } = useAuth();
  const swr = useSWR(me ? ['me', 'settings', 'general'] : null, getGeneralSettings, {
    revalidateOnFocus: false,
  });
  const mut = useSWRMutation(['me', 'settings', 'general', 'update'], (_k, { arg }: { arg: any }) =>
    updateGeneralSettings(arg),
  );
  return { ...swr, update: mut.trigger };
}
