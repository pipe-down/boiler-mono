import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useMyTrips } from '@/src/hooks/api/useTrips';

export function TripSelector({ onSelect }: { onSelect: (id: number) => void }) {
  const { data, isLoading } = useMyTrips({ isMember: true }) as any;
  const trips = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  if (!trips?.length) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? '로딩 중...' : '참여 중인 모임 없음'} />
        </SelectTrigger>
        <SelectContent />
      </Select>
    );
  }
  return (
    <Select onValueChange={(v) => onSelect(Number(v))}>
      <SelectTrigger>
        <SelectValue placeholder="모임 선택" />
      </SelectTrigger>
      <SelectContent>
        {trips.map((t: any) => (
          <SelectItem key={t.id} value={String(t.id)}>
            {t.title || t.name || `Trip #${t.id}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
