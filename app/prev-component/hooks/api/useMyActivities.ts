'use client';
import useSWR from 'swr';
import { getMyTrips, getMyMeetups } from '@/src/services/api/my-activities';
import { useAuth } from '@/src/features/auth/hooks/useAuth';

type Trip = {
  id: string;
  title: string;
  destination: string;
  dates: string;
  participants: number;
  maxParticipants: number;
  imageUrl: string;
  description: string;
  createdBy: string;
  categories: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
};

type Meetup = {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  participants: number;
  maxParticipants: number;
  imageUrl: string;
  description: string;
  createdBy: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
};

function mapTrip(raw: any): Trip {
  const status = (raw.status as string) ?? 'upcoming';
  return {
    id: String(raw.id),
    title: raw.title ?? raw.name ?? '여행',
    destination: raw.destination ?? raw.location ?? '미정',
    dates: raw.dateRange ?? raw.dates ?? '',
    participants: raw.participants ?? raw.memberCount ?? 0,
    maxParticipants: raw.maxParticipants ?? raw.capacity ?? 0,
    imageUrl: raw.thumbnailUrl ?? raw.imageUrl ?? '',
    description: raw.description ?? '',
    createdBy: raw.hostName ?? raw.createdBy ?? '',
    categories: raw.categories ?? raw.tags ?? [],
    status: ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)
      ? (status as Trip['status'])
      : 'upcoming',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

function mapMeetup(raw: any): Meetup {
  return {
    id: String(raw.id),
    title: raw.title ?? '모임',
    location: raw.category ?? raw.location ?? '미정',
    date: (raw.publishedAt || raw.date || '').slice(0, 10),
    time: (raw.publishedAt || raw.time || '').slice(11, 16),
    participants: raw.likeCount ?? raw.participants ?? 0,
    maxParticipants: raw.maxParticipants ?? 0,
    imageUrl: raw.imageUrl ?? '',
    description: raw.summary ?? raw.description ?? '',
    createdBy: raw.authorName ?? raw.createdBy ?? '',
    category: raw.category ?? '기타',
    status: 'upcoming',
    createdAt: raw.publishedAt ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export function useMyActivities() {
  const { data: me } = useAuth();
  const tripsSWR = useSWR(me ? ['me', 'trips'] : null, getMyTrips, { revalidateOnFocus: false });
  const meetupsSWR = useSWR(me ? ['me', 'meetups'] : null, getMyMeetups, {
    revalidateOnFocus: false,
  });

  const hostedTrips: Trip[] = (tripsSWR.data ?? [])
    .filter((t: any) => t.isHost === true || t.role === 'HOST')
    .map(mapTrip);
  const joinedTrips: Trip[] = (tripsSWR.data ?? [])
    .filter((t: any) => !(t.isHost === true || t.role === 'HOST'))
    .map(mapTrip);

  const hostedMeetups: Meetup[] = (meetupsSWR.data ?? [])
    .filter((m: any) => m.isMine === true || m.author === 'ME')
    .map(mapMeetup);
  const joinedMeetups: Meetup[] = []; // 참여 모임 API가 명확치 않아 우선 비워둠

  const isLoading =
    (tripsSWR.isLoading || meetupsSWR.isLoading) && !tripsSWR.error && !meetupsSWR.error;
  const error = tripsSWR.error || meetupsSWR.error;

  return {
    isLoading,
    error,
    hostedTrips,
    hostedMeetups,
    joinedTrips,
    joinedMeetups,
    mutate: () => Promise.all([tripsSWR.mutate(), meetupsSWR.mutate()]),
  };
}
