import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Separator } from '@/src/components/ui/separator';
import { Textarea } from '@/src/components/ui/textarea';
import { Progress } from '@/src/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import {
  ArrowLeft,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  UserIcon,
  Heart,
  Share2,
  Star,
  MessageCircle,
  Camera,
  Clock,
} from '@/src/components/icons';
import { ImageWithFallback } from '@/src/components/figma/ImageWithFallback';
import type { Trip } from '@/src/types/trip';

interface TripDetailViewProps {
  trip: Trip & { creatorAvatar?: string };
  onBack: () => void;
  onOpenTimeline?: () => void;
  onOpenSummary?: () => void;
  onRegenInvite?: () => void;
  canManage?: boolean;
  inviteCode?: string;
  invite?: {
    code?: string;
    expiresAt?: string;
    maxUses?: number;
    remainingUses?: number;
    createdAt?: string;
  };
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  createdAt: string;
  images?: string[];
}

export function TripDetailView({
  trip,
  onBack,
  onOpenTimeline,
  onOpenSummary,
  onRegenInvite,
  canManage,
  inviteCode,
  invite,
  currentUser,
}: TripDetailViewProps) {
  const [showInviteQR, setShowInviteQR] = useState(false);
  const [isWished, setIsWished] = useState(trip.isWished || false);
  const [newReview, setNewReview] = useState('');
  const [userRating, setUserRating] = useState(0);

  const isFullyBooked = trip.participants >= trip.maxParticipants;
  const participationRate = (trip.participants / trip.maxParticipants) * 100;

  // TODO: Replace with real reviews API
  const reviews: Review[] = [];

  const handleWishToggle = () => {
    setIsWished(!isWished);
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>

            <div className="flex items-center gap-2">
              {(onOpenTimeline || onOpenSummary || (canManage && onRegenInvite)) && (
                <div className="hidden md:flex items-center gap-2 mr-2">
                  {onOpenTimeline && (
                    <Button variant="secondary" size="sm" onClick={onOpenTimeline}>
                      타임라인
                    </Button>
                  )}
                  {onOpenSummary && (
                    <Button variant="outline" size="sm" onClick={onOpenSummary}>
                      요약
                    </Button>
                  )}
                  {canManage && onRegenInvite && (
                    <Button variant="outline" size="sm" onClick={onRegenInvite}>
                      초대 코드 재발급
                    </Button>
                  )}
                  {(invite?.code || inviteCode) && (
                    <div
                      className="flex items-center gap-2 px-2 py-1 rounded bg-accent text-xs items-center"
                      aria-live="polite"
                    >
                      <span className="font-mono">{invite?.code ?? inviteCode}</span>
                      {invite?.expiresAt &&
                        (() => {
                          const msLeft = new Date(invite.expiresAt).getTime() - Date.now();
                          const hoursLeft = Math.floor(msLeft / 3600000);
                          const urgent = msLeft > 0 && msLeft <= 3600000;
                          return (
                            <span className={urgent ? 'text-red-600' : 'text-muted-foreground'}>
                              유효기간: {new Date(invite.expiresAt).toLocaleString()}{' '}
                              {urgent ? '(1시간 미만 남음)' : ''}
                            </span>
                          );
                        })()}
                      {typeof invite?.remainingUses === 'number' &&
                        typeof invite?.maxUses === 'number' && (
                          <span className="text-muted-foreground">
                            남은 횟수: {invite.remainingUses}/{invite.maxUses}
                          </span>
                        )}
                      <Button
                        aria-label="초대 코드 복사"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(invite?.code ?? inviteCode!);
                          } catch {}
                        }}
                      >
                        복사
                      </Button>
                      <Button
                        aria-label="초대 링크 공유"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={async () => {
                          try {
                            const code = invite?.code ?? inviteCode!;
                            const url = `${window.location.origin}/trips/join?code=${encodeURIComponent(code)}`;
                            if ((navigator as any).share) {
                              await (navigator as any).share({
                                title: '여행 초대',
                                text: '여행에 초대합니다',
                                url,
                              });
                            } else {
                              await navigator.clipboard.writeText(url);
                            }
                          } catch {}
                        }}
                      >
                        공유
                      </Button>
                      <Button
                        aria-label="초대 QR 코드"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => setShowInviteQR(true)}
                      >
                        QR
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWishToggle}
                className={isWished ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 ${isWished ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 메인 이미지 및 기본 정보 */}
        <div className="space-y-6">
          <div className="aspect-[16/9] relative rounded-xl overflow-hidden">
            <ImageWithFallback
              src={trip.imageUrl}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {(trip.categories || []).map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="bg-white/90 text-foreground backdrop-blur-sm"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
              <h1 className="text-white mb-2">{trip.title}</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  {trip.rating && renderStars(trip.rating)}
                  {trip.rating && <span className="text-sm ml-1">{trip.rating}</span>}
                </div>
                {typeof trip.reviewCount !== 'undefined' && (
                  <span className="text-sm">리뷰 {trip.reviewCount}개</span>
                )}
              </div>
            </div>
          </div>

          {/* 주요 정보 카드들 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <MapPinIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">목적지</p>
                <p className="font-medium">{trip.destination}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <CalendarIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">여행 기간</p>
                <p className="font-medium">{trip.dates}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <UsersIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">참여자</p>
                <p className="font-medium">
                  {trip.participants}/{trip.maxParticipants}명
                </p>
                <Progress value={participationRate} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <UserIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">주최자</p>
                <p className="font-medium">{trip.createdBy}</p>
              </CardContent>
            </Card>
          </div>

          {/* 여행 소개 */}
          <Card>
            <CardHeader>
              <CardTitle>여행 소개</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {trip.description}
              </p>
            </CardContent>
          </Card>

          {/* 주최자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>주최자 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={trip.creatorAvatar} />
                  <AvatarFallback>{trip.createdBy?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium">{trip.createdBy}</h4>
                  <p className="text-muted-foreground text-sm mb-2">여행 전문가</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>주최한 여행 다수</span>
                    {trip.rating && <span>평점 {trip.rating}/5</span>}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  메시지
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 리뷰 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>리뷰 ({reviews.length})</span>
                <div className="flex items-center gap-2">
                  {trip.rating && renderStars(trip.rating)}
                  {trip.rating && (
                    <span className="text-sm text-muted-foreground">평균 {trip.rating}/5</span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 리뷰 작성 (로그인한 경우) */}
              {currentUser && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>{currentUser.name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{currentUser.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">평점:</span>
                        {renderStars(userRating, true, setUserRating)}
                      </div>
                    </div>
                  </div>
                  <Textarea
                    placeholder="여행 경험을 공유해주세요..."
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-1" />
                      사진 추가
                    </Button>
                    <Button size="sm">리뷰 작성</Button>
                  </div>
                </div>
              )}

              {/* 기존 리뷰들 - 현재는 비어 있음 */}
              {reviews.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-6">
                  아직 리뷰가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm">
                {isFullyBooked ? '모집이 완료되었습니다' : '함께 떠날 준비가 되셨나요?'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {trip.participants}명이 참여 중
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleWishToggle}
                className={isWished ? 'text-red-500 border-red-200' : ''}
              >
                <Heart className={`h-4 w-4 mr-1 ${isWished ? 'fill-current' : ''}`} />
                {isWished ? '찜 해제' : '찜하기'}
              </Button>
              <Button disabled={isFullyBooked} size="lg">
                {isFullyBooked ? '모집완료' : '참여하기'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite QR Dialog */}
      <Dialog open={showInviteQR} onOpenChange={setShowInviteQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>초대 QR 코드</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {(() => {
              const code = invite?.code ?? inviteCode;
              if (!code)
                return <div className="text-sm text-muted-foreground">초대 코드가 없습니다.</div>;
              const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/trips/join?code=${encodeURIComponent(code)}`;
              const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
              return (
                <>
                  <img
                    src={qr}
                    alt="초대 QR 코드"
                    width={220}
                    height={220}
                    className="rounded border"
                  />
                  <div className="text-xs text-muted-foreground break-all text-center">{url}</div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
