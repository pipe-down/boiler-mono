'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MeetupBrowser } from '@/components/MeetupBrowser';
import { CreateMeetupModal } from '@/components/CreateMeetupModal';
import { MeetupDetailModal } from '@/components/MeetupDetailModal';
import type { Meetup } from '@/types/meetup';
import { useMeetups } from '@/hooks/api/useMeetups';
import { createMeetup } from '@/lib/services/meetups-create';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toast } from 'sonner';

export default function MeetupsPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useMeetups({ page: 0, size: 12 }) as any;
  const [showCreateMeetup, setShowCreateMeetup] = useState(false);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);
  const meetups = data?.items ?? [];
  const [wishlist, setWishlist] = useState<string[]>([]);

  return (
    <ErrorBoundary>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 mb-2">모임 찾기</h1>
            <p className="text-muted-foreground">함께할 모임을 찾아 참여해보세요.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            ← 메인으로
          </Button>
        </div>
      </div>

      <MeetupBrowser
        meetups={meetups}
        currentUser={{ id: '1', name: '김여행자', avatar: undefined }}
        onMeetupClick={(m) => router.push(`/meetups/${m.id}`)}
        onMeetupDetailClick={(m) => setSelectedMeetup(m)}
        onWishToggle={(id) =>
          setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
        }
        onCreateMeetup={() => setShowCreateMeetup(true)}
        isLoading={isLoading}
        error={error}
      />

      <CreateMeetupModal
        isOpen={showCreateMeetup}
        onClose={() => setShowCreateMeetup(false)}
        onSubmit={async (meetup) => {
          try {
            await createMeetup({
              title: meetup.title,
              content: meetup.description,
              category: meetup.category,
            });
            await mutate();
            setShowCreateMeetup(false);
            toast.success('모임이 생성되었습니다');
          } catch {
            toast.error('생성에 실패했습니다');
          }
        }}
      />

      {selectedMeetup && (
        <MeetupDetailModal meetup={selectedMeetup} isOpen onClose={() => setSelectedMeetup(null)} />
      )}
    </ErrorBoundary>
  );
}
