import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Badge, Card, CardContent } from '@chatstack/ui';
import { CalendarIcon, MapPinIcon, UsersIcon, UserIcon } from '@chatstack/ui';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Trip } from '@/types/trip';

interface TripDetailModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

export function TripDetailModal({ trip, isOpen, onClose }: TripDetailModalProps) {
  const isFullyBooked = trip.participants >= trip.maxParticipants;

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
          <DialogTitle>{trip.title}</DialogTitle>
          <DialogDescription>
            {trip.destination} · {trip.dates} · {trip.participants}/{trip.maxParticipants}명 참여
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <ImageWithFallback
              src={trip.imageUrl}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-1">
              {trip.categories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-white/90 text-foreground backdrop-blur-sm"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-primary" />
                    <span>목적지</span>
                  </div>
                  <p className="pl-7">{trip.destination}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <span>여행 기간</span>
                  </div>
                  <p className="pl-7">{trip.dates}</p>
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
                    {trip.participants}/{trip.maxParticipants}명
                    {isFullyBooked && <span className="text-destructive ml-2">(모집완료)</span>}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-primary" />
                    <span>여행 주최자</span>
                  </div>
                  <p className="pl-7">{trip.createdBy}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h4 className="mb-3">여행 소개</h4>
              <p className="text-muted-foreground leading-relaxed">{trip.description}</p>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-muted-foreground">함께 떠날 준비가 되셨나요?</div>
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
