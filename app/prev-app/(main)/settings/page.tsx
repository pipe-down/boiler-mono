'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Settings } from '@/src/components/Settings';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { updateMyProfile } from '@/src/services/api/users';
import {
  useMyGeneralSettings,
  useMyNotificationSettings,
  useMyPrivacySettings,
} from '@/src/hooks/api/useMySettings';

export default function SettingsPage() {
  const router = useRouter();
  const { data: me, mutate } = useAuth();
  const user = me && {
    id: String(me.id),
    name: me.name,
    email: me.email ?? '',
    avatar: me.profileImageUrl,
    bio: '',
    location: '대한민국',
    phone: '',
    birthDate: '',
    interests: [],
    verified: true,
    joinDate: '',
  };

  const { data: notif, update: updateNotif } = useMyNotificationSettings();
  const { data: privacy, update: updatePrivacy } = useMyPrivacySettings();
  const { data: general, update: updateGeneral } = useMyGeneralSettings();

  const notificationSettings = notif ?? {
    email: {
      newMessages: true,
      tripUpdates: true,
      meetupReminders: true,
      communityActivity: true,
      marketing: false,
    },
    push: { newMessages: true, tripUpdates: true, meetupReminders: true, communityActivity: true },
    inApp: { sound: true, desktop: true, mobile: true },
  };
  const privacySettings = privacy ?? {
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: 'everyone',
    showOnlineStatus: true,
    dataTracking: true,
    analyticsOptOut: false,
  };
  const appearanceSettings = {
    theme: 'system' as const,
    language: general?.language || 'ko',
    timezone: general?.timezone || 'Asia/Seoul',
    dateFormat: general?.dateFormat || 'YYYY.MM.DD',
    currency: general?.currency || 'KRW',
  };

  return (
    <ErrorBoundary>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">설정</h1>
          <p className="text-muted-foreground">계정 및 알림 설정을 관리하세요.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')}>
          ← 메인으로
        </Button>
      </div>

      {user && (
        <Settings
          user={user}
          notificationSettings={notificationSettings}
          privacySettings={privacySettings}
          appearanceSettings={appearanceSettings}
          onUpdateProfile={async (updated) => {
            try {
              await updateMyProfile({ name: updated.name, profileImageUrl: updated.avatar });
              await mutate();
              toast.success('프로필이 저장되었습니다.');
            } catch {
              toast.error('프로필 저장 중 문제가 발생했습니다');
            }
          }}
          onUpdateNotifications={async (settings) => {
            try {
              await updateNotif(settings);
              toast.success('알림 설정이 저장되었습니다.');
            } catch {
              toast.error('알림 설정 저장 실패');
            }
          }}
          onUpdatePrivacy={async (settings) => {
            try {
              await updatePrivacy(settings);
              toast.success('개인정보 설정이 저장되었습니다.');
            } catch {
              toast.error('개인정보 설정 저장 실패');
            }
          }}
          onUpdateAppearance={async (settings) => {
            try {
              await updateGeneral({
                language: settings.language,
                timezone: settings.timezone,
                dateFormat: settings.dateFormat,
                currency: settings.currency,
              });
              toast.success('표시 설정이 저장되었습니다.');
            } catch {
              toast.error('표시 설정 저장 실패');
            }
          }}
          onDeleteAccount={() => toast.error('계정 삭제는 추후 지원 예정입니다.')}
          onExportData={() => toast.message('데이터 내보내기 기능은 추후 제공됩니다.')}
        />
      )}
    </ErrorBoundary>
  );
}
