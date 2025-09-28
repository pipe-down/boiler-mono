import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, UserIcon } from '@/src/components/icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Meetup } from '@/src/types/meetup';

interface MeetupDetailModalProps {
  meetup: Meetup;
  isOpen: boolean;
  onClose: () => void;
}

export function MeetupDetailModal({ meetup, isOpen, onClose }: MeetupDetailModalProps) {
  const isFullyBooked = meetup.participants >= meetup.maxParticipants;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${ampm} ${displayHour}:${minutes}`;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setTimeout(() => {
            onClose();
          }, 0);
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{meetup.title}</DialogTitle>
          <DialogDescription>
            {meetup.location} · {formatDate(meetup.date)} {formatTime(meetup.time)} ·{' '}
            {meetup.participants}/{meetup.maxParticipants}명 참여
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <ImageWithFallback
              src={meetup.imageUrl}
              alt={meetup.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-white/90 text-foreground backdrop-blur-sm">
                {meetup.category}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-primary" />
                    <span>모임 장소</span>
                  </div>
                  <p className="pl-7">{meetup.location}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <span>모임 날짜</span>
                  </div>
                  <p className="pl-7">{formatDate(meetup.date)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-primary" />
                    <span>모임 시간</span>
                  </div>
                  <p className="pl-7">{formatTime(meetup.time)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-primary" />
                    <span>참여자</span>
                  </div>
                  <p className="pl-7">
                    {meetup.participants}/{meetup.maxParticipants}명
                    {isFullyBooked && <span className="text-destructive ml-2">(모집완료)</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <span>모임 주최자</span>
                </div>
                <p className="pl-7">{meetup.createdBy}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h4 className="mb-3">모임 소개</h4>
              <p className="text-muted-foreground leading-relaxed">{meetup.description}</p>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-muted-foreground">함께 참여하시겠어요?</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                닫기
              </Button>
              <Button disabled={isFullyBooked}>{isFullyBooked ? '모집완료' : '참여하기'}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
