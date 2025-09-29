'use client';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import {
  getTrips,
  getMyTrips,
  getTripById,
  requestJoinPublicTrip,
  joinTripByInviteCode,
  validateInviteCode,
  getTripMembers,
  updateMemberRole,
  removeMember,
  updateTripStatus,
  regenerateInviteCode,
  leaveTrip,
  getInviteCode,
} from '@/lib/services/trips';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useTrips(params?: { page?: number; size?: number; keyword?: string }) {
  const key = ['trips', params?.page ?? 0, params?.size ?? 12, params?.keyword ?? ''] as const;
  const swr = useSWR(key, () => getTrips(params), {
    revalidateOnFocus: false,
    shouldRetryOnError: (error) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return true;
    },
  });
  return swr;
}

export function useMyTrips(params?: {
  isCreator?: boolean;
  isMember?: boolean;
  keyword?: string;
  status?: string;
  visibility?: string;
  page?: number;
  size?: number;
}) {
  const { data: me } = useAuth();
  const key = me
    ? ([
        'my-trips',
        params?.isCreator ?? false,
        params?.isMember ?? true,
        params?.keyword ?? '',
        params?.status ?? '',
        params?.visibility ?? '',
        params?.page ?? 0,
        params?.size ?? 20,
      ] as const)
    : null;
  return useSWR(key, () => getMyTrips(params), { revalidateOnFocus: false });
}

export function useTrip(tripId?: string | number) {
  return useSWR(tripId ? ['trip', String(tripId)] : null, () => getTripById(String(tripId)), {
    revalidateOnFocus: false,
  });
}

// Mutations
export function useRequestJoinPublicTrip() {
  return useSWRMutation(
    ['trips', 'request-join'],
    (_k, { arg }: { arg: { tripId: number; nickname?: string } }) =>
      requestJoinPublicTrip(arg.tripId, arg.nickname),
  );
}

export function useJoinByInviteCode() {
  return useSWRMutation(
    ['trips', 'join-invite'],
    (_k, { arg }: { arg: { inviteCode: string; nickname?: string } }) =>
      joinTripByInviteCode(arg.inviteCode, arg.nickname),
  );
}

export function useValidateInviteCode() {
  return useSWRMutation(['trips', 'validate-invite'], (_k, { arg: inviteCode }: { arg: string }) =>
    validateInviteCode(inviteCode),
  );
}

export function useTripMembers(tripId?: string | number) {
  const { data: me } = useAuth();
  return useSWR(
    me && tripId ? ['trip-members', String(tripId)] : null,
    () => getTripMembers(String(tripId)),
    { revalidateOnFocus: false },
  );
}

export function useUpdateMemberRole() {
  return useSWRMutation(
    ['trips', 'update-role'],
    (_k, { arg }: { arg: { tripId: string | number; userId: string | number; role: string } }) =>
      updateMemberRole(arg.tripId, arg.userId, arg.role),
  );
}

export function useRemoveMember() {
  return useSWRMutation(
    ['trips', 'remove-member'],
    (_k, { arg }: { arg: { tripId: string | number; userId: string | number } }) =>
      removeMember(arg.tripId, arg.userId),
  );
}

export function useUpdateTripStatus() {
  return useSWRMutation(
    ['trips', 'status'],
    (_k, { arg }: { arg: { tripId: string | number; status: string } }) =>
      updateTripStatus(arg.tripId, arg.status),
  );
}

export function useRegenerateInviteCode() {
  return useSWRMutation(
    ['trips', 'invite-regenerate'],
    (_k, { arg: tripId }: { arg: string | number }) => regenerateInviteCode(tripId),
  );
}

export function useLeaveTrip() {
  return useSWRMutation(['trips', 'leave'], (_k, { arg: tripId }: { arg: string | number }) =>
    leaveTrip(tripId),
  );
}

export function useInviteCode(tripId?: string | number, enabled = true) {
  const key = enabled && tripId ? (['trip-invite', String(tripId)] as const) : null;
  return useSWR(key, async ([, id]) => getInviteCode(String(id)), { revalidateOnFocus: false });
}
