'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { MyTripsAndMeetups } from '@/src/components/MyTripsAndMeetups';
import { useMyActivities } from '@/src/hooks/api/useMyActivities';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

export default function MyActivitiesPage() {
  const router = useRouter();
  const { isLoading, error, hostedTrips, hostedMeetups, joinedTrips, joinedMeetups } =
    useMyActivities();

  return (
    <ErrorBoundary>
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/')}>
          ← 메인으로
        </Button>
      </div>

      <MyTripsAndMeetups
        isLoading={isLoading}
        error={error}
        hostedTrips={hostedTrips as any}
        hostedMeetups={hostedMeetups as any}
        joinedTrips={joinedTrips as any}
        joinedMeetups={joinedMeetups as any}
        onTripClick={(trip: any) => router.push(`/trips/${trip.id}`)}
        onMeetupClick={(meetup: any) => router.push(`/meetups/${meetup.id}`)}
        onEditTrip={(trip: any) => toast.info('여행 수정 준비 중')}
        onEditMeetup={(meetup: any) => toast.info('모임 수정 준비 중')}
        onCancelTrip={(id: string) => toast.info('여행 취소 준비 중')}
        onCancelMeetup={(id: string) => toast.info('모임 취소 준비 중')}
        onInviteParticipants={(id, type) => toast.success('초대 링크 생성됨')}
        onCreateTrip={() => toast.message('여행 만들기 준비 중')}
        onCreateMeetup={() => toast.message('모임 만들기 준비 중')}
      />
      {/* 페이지 레벨 보조 메시지 (컴포넌트 내부 스켈레톤 처리) */}
      {isLoading && (
        <div className="mt-4 text-sm text-muted-foreground">내 활동을 불러오는 중...</div>
      )}
    </ErrorBoundary>
  );
}
