'use client';
import { useRouter, useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  useTrip,
  useTripMembers,
  useRegenerateInviteCode,
  useInviteCode,
} from '@/hooks/api/useTrips';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TripDetailView } from '@/components/TripDetailView';
import { toast } from 'sonner';

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const tripId = params?.id as string;
  const { data: me } = useAuth();
  const trip = useTrip(tripId);
  const members = useTripMembers(tripId);
  const regenInvite = useRegenerateInviteCode();
  const [latestInviteCode, setLatestInviteCode] = useState<string | null>(null);

  // Pre-compute permissions (safe on initial render) and call all hooks before any early return
  const t: any = trip.data;
  const ms: any[] = members.data || [];
  const isCreator = (() => {
    const creatorId = t?.creator?.id || t?.creatorId;
    return creatorId && me && Number(creatorId) === Number(me.id);
  })();
  const isManagerOrCreator = (() => {
    if (!ms || !me) return Boolean(isCreator);
    const self = ms.find((m: any) => String(m.id) === String(me.id));
    return Boolean(isCreator) || self?.role === 'MANAGER' || self?.role === 'CREATOR';
  })();
  const inviteSWR = useInviteCode(tripId, isManagerOrCreator);

  if (trip.isLoading && !trip.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse h-24 bg-muted rounded-lg" />
      </div>
    );
  }
  if (!trip.data) {
    return <div className="container mx-auto px-4 py-8">여행 정보를 가져올 수 없습니다.</div>;
  }

  // Map API shape -> TripDetailView props
  const displayTrip = {
    id: String(t.id ?? tripId),
    title: t.title ?? '',
    destination: t.destination ?? t.location ?? '',
    dates: t.startDate && t.endDate ? `${t.startDate} ~ ${t.endDate}` : (t.dates ?? ''),
    participants: Number(t.currentMembers ?? t.memberCount ?? t.participants ?? 0),
    maxParticipants: Number(t.maxMembers ?? t.maxParticipants ?? 0),
    imageUrl: t.coverImageUrl ?? t.coverImage ?? (t.fileUrls && t.fileUrls[0]) ?? t.imageUrl ?? '',
    description: t.description ?? '',
    createdBy: t.creator?.name ?? t.creatorName ?? t.createdBy ?? '주최자',
    categories: (t.categories ?? []) as string[],
    rating: typeof t.rating === 'number' ? t.rating : undefined,
    reviewCount: typeof t.reviewCount === 'number' ? t.reviewCount : undefined,
    isWished: !!t.isWished,
    urgency: undefined,
    creatorAvatar: t.creator?.profileImageUrl ?? undefined,
    createdAt: t.createdAt ?? new Date().toISOString(),
  } as const;

  const currentUser = me
    ? { id: String(me.id), name: me.name, avatar: me.profileImageUrl as string | undefined }
    : null;

  // Invite code fetch result
  const rawInvite: any = inviteSWR.data || null;
  const invite = rawInvite
    ? {
        code: rawInvite.inviteCode ?? rawInvite.code ?? rawInvite.value ?? undefined,
        expiresAt: rawInvite.expiresAt ?? rawInvite.expiredAt ?? rawInvite.validUntil ?? undefined,
        maxUses: rawInvite.maxUses ?? rawInvite.limit ?? undefined,
        remainingUses:
          rawInvite.remainingUses ??
          (typeof rawInvite.used === 'number' && typeof rawInvite.maxUses === 'number'
            ? Math.max(0, rawInvite.maxUses - rawInvite.used)
            : undefined),
        createdAt: rawInvite.createdAt ?? undefined,
      }
    : undefined;

  return (
    <TripDetailView
      trip={displayTrip as any}
      onBack={() => router.back()}
      onOpenTimeline={() => router.push(`/trips/${tripId}/timeline`)}
      onOpenSummary={() => router.push(`/trips/${tripId}/timeline/summary`)}
      onRegenInvite={
        isManagerOrCreator
          ? async () => {
              try {
                const resp: any = await regenInvite.trigger(tripId);
                const code =
                  resp?.data?.inviteCode ??
                  resp?.inviteCode ??
                  resp?.data?.code ??
                  resp?.code ??
                  null;
                if (code) {
                  setLatestInviteCode(String(code));
                  toast.success('초대 코드가 재발급되었습니다', { description: String(code) });
                } else {
                  toast.success('초대 코드가 재발급되었습니다');
                }
              } catch (e: any) {
                toast.error('재발급 실패', { description: e?.response?.data?.message });
              }
            }
          : undefined
      }
      canManage={isManagerOrCreator}
      inviteCode={latestInviteCode ?? undefined}
      currentUser={currentUser}
    />
  );
}
