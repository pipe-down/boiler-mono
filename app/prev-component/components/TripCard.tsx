import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  Heart,
  Star,
  Clock,
  Eye,
  MessageCircle,
} from '@/src/components/icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Trip } from '@/src/types/trip';

interface TripCardProps {
  trip: Trip & {
    rating?: number;
    reviewCount?: number;
    isWished?: boolean;
    urgency?: 'high' | 'medium' | 'low';
    creatorAvatar?: string;
  };
  onClick: () => void;
  onDetailsClick?: () => void;
  onWishToggle?: (tripId: string) => void;
  variant?: 'vertical' | 'horizontal';
}

export function TripCard({
  trip,
  onClick,
  onWishToggle,
  onDetailsClick,
  variant = 'vertical',
}: TripCardProps) {
  const availableSpots = trip.maxParticipants - trip.participants;
  const progressPercentage = (trip.participants / trip.maxParticipants) * 100;

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getUrgencyText = (urgency?: string) => {
    switch (urgency) {
      case 'high':
        return '마감임박';
      case 'medium':
        return '인기';
      default:
        return '';
    }
  };

  if (variant === 'horizontal') {
    return (
      <Card
        className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={onClick}
      >
        <div className="flex">
          <div className="w-48 h-32 relative flex-shrink-0">
            <ImageWithFallback
              src={trip.imageUrl}
              alt={trip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />

            {/* 찜하기 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onWishToggle?.(trip.id);
              }}
            >
              <Heart
                className={`h-3 w-3 transition-all duration-200 ${trip.isWished ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-600 hover:text-red-400'}`}
              />
            </Button>
          </div>

          <CardContent className="p-4 flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium line-clamp-1 flex-1">{trip.title}</h3>
              {trip.rating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 ml-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{trip.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-3 w-3" />
                <span className="truncate">{trip.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3 w-3" />
                <span className="truncate">{trip.dates}</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-3 w-3" />
                <span>
                  {trip.participants}/{trip.maxParticipants}명
                </span>
                {availableSpots <= 3 && availableSpots > 0 && (
                  <span className={`text-xs ${getUrgencyColor('high')}`}>
                    ({availableSpots}자리 남음)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {trip.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={trip.creatorAvatar} alt={trip.createdBy} />
                  <AvatarFallback className="text-xs">{trip.createdBy.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{trip.createdBy}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  (onDetailsClick ?? onClick)();
                }}
              >
                자세히
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group h-[480px] flex flex-col"
      onClick={onClick}
    >
      <div className="aspect-video relative flex-shrink-0">
        <ImageWithFallback
          src={trip.imageUrl}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />

        {/* 카테고리 배지 */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {trip.categories.slice(0, 2).map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="bg-white/90 text-foreground backdrop-blur-sm text-xs"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* 긴급도/인기도 표시 */}
        {trip.urgency && getUrgencyText(trip.urgency) && (
          <div className="absolute top-3 right-3">
            <Badge
              variant="destructive"
              className={`bg-red-500 text-white ${trip.urgency === 'medium' ? 'bg-orange-500' : ''}`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {getUrgencyText(trip.urgency)}
            </Badge>
          </div>
        )}

        {/* 찜하기 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-3 right-3 p-2 bg-white/90 hover:bg-white backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onWishToggle?.(trip.id);
          }}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${trip.isWished ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-600 hover:text-red-400'}`}
          />
        </Button>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium line-clamp-1 flex-1">{trip.title}</h3>
            {trip.rating && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{trip.rating.toFixed(1)}</span>
                {trip.reviewCount && <span>({trip.reviewCount})</span>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-sm">{trip.destination}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-sm">{trip.dates}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <UsersIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                {trip.participants}/{trip.maxParticipants}명
              </span>
              {availableSpots <= 3 && availableSpots > 0 && (
                <span className={`text-xs ${getUrgencyColor('high')}`}>
                  ({availableSpots}자리 남음)
                </span>
              )}
            </div>

            {/* 참여도 프로그레스 바 */}
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <p className="text-muted-foreground line-clamp-2 text-sm flex-1">{trip.description}</p>
        </div>

        <div className="flex items-center justify-between pt-3 mt-auto">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={trip.creatorAvatar} alt={trip.createdBy} />
              <AvatarFallback className="text-xs">{trip.createdBy.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{trip.createdBy}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              (onDetailsClick ?? onClick)();
            }}
          >
            자세히
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
