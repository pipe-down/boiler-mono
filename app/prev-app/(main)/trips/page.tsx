'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { TripBrowser } from '@/src/components/TripBrowser';
import { CreateTripModal } from '@/src/components/CreateTripModal';
import { TripDetailModal } from '@/src/components/TripDetailModal';
import type { Trip } from '@/src/types/trip';
import { useTrips } from '@/src/hooks/api/useTrips';
import { createTrip } from '@/src/services/api/trips';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { toast } from 'sonner';

export default function TripsPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useTrips({ page: 0, size: 12 }) as any;
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const trips = data?.items ?? [];
  const [wishlist, setWishlist] = useState<string[]>([]);

  return (
    <ErrorBoundary>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 mb-2">여행 찾기</h1>
            <p className="text-muted-foreground">관심 있는 여행을 찾아 참여해보세요.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            ← 메인으로
          </Button>
        </div>
      </div>

      <TripBrowser
        trips={trips}
        currentUser={{ id: '1', name: '김여행자', avatar: undefined }}
        onTripClick={(trip) => router.push(`/trips/${trip.id}`)}
        onTripDetailClick={(trip) => setSelectedTrip(trip)}
        onWishToggle={(id) =>
          setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
        }
        onCreateTrip={() => setShowCreateTrip(true)}
        isLoading={isLoading}
        error={error}
      />

      <CreateTripModal
        isOpen={showCreateTrip}
        onClose={() => setShowCreateTrip(false)}
        onSubmit={async (trip) => {
          try {
            await createTrip({
              title: trip.title,
              destination: trip.destination,
              description: trip.description,
              maxParticipants: trip.maxParticipants,
              coverImageUrl: trip.imageUrl,
            });
            await mutate();
            setShowCreateTrip(false);
            toast.success('여행이 생성되었습니다');
          } catch {
            toast.error('생성에 실패했습니다');
          }
        }}
      />

      {selectedTrip && (
        <TripDetailModal trip={selectedTrip} isOpen onClose={() => setSelectedTrip(null)} />
      )}
    </ErrorBoundary>
  );
}
