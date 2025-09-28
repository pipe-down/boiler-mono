import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/src/providers/WebSocketProvider';

export type MemberLocation = {
  userId: string;
  name: string;
  lat: number;
  lng: number;
  profileImageUrl?: string;
};

export function useMemberLocation(
  tripId: string | number,
  onLocation?: (loc: MemberLocation) => void,
) {
  const { subscribe, connected, topics } = useWebSocket();
  const lastRef = useRef<MemberLocation | null>(null);

  useEffect(() => {
    if (!tripId || !connected) return;
    const sub = subscribe(topics.tripLocation(tripId), (payload) => {
      const loc = payload as MemberLocation;
      lastRef.current = loc;
      onLocation?.(loc);
    });
    return () => {
      sub?.unsubscribe();
    };
  }, [tripId, connected, subscribe, onLocation, topics]);

  return { connected, last: lastRef.current };
}
