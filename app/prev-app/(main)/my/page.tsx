'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MyPage as MyPageView } from '@/src/components/MyPage';
import type { Trip } from '@/src/types/trip';
import type { Meetup } from '@/src/types/meetup';
import { Button } from '@/src/components/ui/button';
import { useUIStore } from '@/src/store/ui';
import { Users, Trophy, MapPin, Heart, Star, Compass } from '@/src/components/icons';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useMyActivities } from '@/src/hooks/api/useMyActivities';

export default function MyPage() {
  const router = useRouter();
  const setShowAuthModal = useUIStore((s) => s.setShowAuthModal);

  // 실제 API 연동
  const { data: me } = useAuth();
  const { hostedTrips, hostedMeetups, joinedTrips, joinedMeetups } = useMyActivities();

  // 마이페이지 뷰에 전달할 데이터 구성
  const myPageData = useMemo(() => {
    const trips: Trip[] = hostedTrips ?? [];
    const meetups: Meetup[] = hostedMeetups ?? [];
    return {
      user: me && {
        id: String(me.id),
        name: me.name,
        email: me.email ?? '',
        avatar: me.profileImageUrl,
        bio: '프로필 소개는 설정에서 수정할 수 있습니다.',
        location: '대한민국',
        joinDate: '---',
        level: 1,
        experience: 0,
        nextLevelExp: 100,
      },
      myTrips: trips,
      myMeetups: meetups,
      joinedTrips: joinedTrips ?? [],
      joinedMeetups: joinedMeetups ?? [],
      wishlistTrips: [],
      wishlistMeetups: [],
      achievements: [],
    };
  }, [me, hostedTrips, hostedMeetups, joinedTrips, joinedMeetups]);

  return (
    <ErrorBoundary>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">마이페이지</h1>
          <p className="text-muted-foreground">나의 여행 활동과 정보를 확인해보세요.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')}>
          ← 메인으로
        </Button>
      </div>

      {me ? (
        <MyPageView
          user={myPageData.user!}
          myTrips={myPageData.myTrips}
          myMeetups={myPageData.myMeetups}
          joinedTrips={myPageData.joinedTrips}
          joinedMeetups={myPageData.joinedMeetups}
          wishlistTrips={myPageData.wishlistTrips}
          wishlistMeetups={myPageData.wishlistMeetups}
          achievements={myPageData.achievements}
        />
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
          <p className="text-muted-foreground mb-4">마이페이지를 확인하려면 로그인해주세요.</p>
          <Button onClick={() => setShowAuthModal(true)}>로그인하기</Button>
        </div>
      )}
    </ErrorBoundary>
  );
}
