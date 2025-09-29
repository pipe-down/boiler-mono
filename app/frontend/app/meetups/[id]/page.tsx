'use client';
export const dynamic = 'force-dynamic';

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Badge, Card, CardContent } from '@chatstack/ui';
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Users as UsersIcon,
  User as UserIcon,
} from '@chatstack/ui';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import type { Meetup } from '@/types/meetup';
import { usePost } from '@/hooks/api/usePosts';

export default function MeetupDetailPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const id = params?.id;
  const postId = id ? Number(id) : undefined;
  const { data: post, isLoading } = usePost(postId);

  const meetup: Meetup | null = useMemo(() => {
    if (!post) return null;
    const createdAt: string = post.createdAt || post.publishedAt || new Date().toISOString();
    const date = new Date(createdAt);
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return {
      id: String(post.id ?? id ?? ''),
      title: post.title ?? '제목 없음',
      location: post.category || '미정',
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${mi}`,
      participants: post.likeCount ?? 0,
      maxParticipants: 0,
      imageUrl: post.coverImageUrl || '',
      description: post.summary || post.content || '',
      createdBy: post.authorName || '',
      category: post.category || '기타',
      createdAt,
    };
  }, [post, id]);

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
    const [hours, minutes] = (timeString || '00:00').split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${ampm} ${displayHour}:${minutes}`;
  };

  if (isLoading && !meetup)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse h-24 bg-muted rounded-lg" />
      </div>
    );
  if (!meetup)
    return <div className="container mx-auto px-4 py-8">모임 정보를 가져올 수 없습니다.</div>;

  const isFullyBooked = meetup.participants >= meetup.maxParticipants;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{meetup.title}</h1>
          <p className="text-muted-foreground">
            {meetup.location} · {formatDate(meetup.date)} {formatTime(meetup.time)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/meetups')}>
            ← 목록
          </Button>
          <Button disabled={isFullyBooked}>{isFullyBooked ? '모집완료' : '참여하기'}</Button>
        </div>
      </div>

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
            <p className="pl-7">{meetup.createdBy || '알 수 없음'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3">모임 소개</h4>
          <p className="text-muted-foreground leading-relaxed">
            {meetup.description || '설명이 없습니다.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
