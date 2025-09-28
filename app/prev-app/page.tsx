'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/src/lib/axios';
import { useSWRConfig } from 'swr';

// Layout Components
import { Toaster } from '@/src/components/ui/sonner';
import { toast } from 'sonner';
import { NotificationCenter } from '@/src/components/NotificationCenter';
import { AuthModal } from '@/src/features/auth/ui/AuthModal';

// Page Components
import { TripCard } from '@/src/components/TripCard';
import { MeetupCard } from '@/src/components/MeetupCard';
import { SearchAndFilter } from '@/src/components/SearchAndFilter';
import { Community } from '@/src/components/Community';
import { CardGridSkeleton, EmptyState } from '@/src/components/LoadingStates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import {
  PlusIcon,
  MapPin,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Star,
  Flame,
  Clock,
  MessageCircle,
  Target,
} from '@/src/components/icons';

// Detail modals on landing page
import { TripDetailModal } from '@/src/components/TripDetailModal';
import { MeetupDetailModal } from '@/src/components/MeetupDetailModal';

// Types and Data
import type { Trip } from '@/src/types/trip';
import type { Meetup } from '@/src/types/meetup';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { useNotifications } from '@/src/hooks/api/useNotifications';
import { useTrips } from '@/src/hooks/api/useTrips';
import { useMeetups } from '@/src/hooks/api/useMeetups';
import { useUIStore } from '@/src/store/ui';

export default function HomePage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  // Avoid hydration mismatch by deferring any auth-dependent header swap until after mount
  const [hydrated, setHydrated] = useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  // 인증/알림: 전역 훅 사용
  const { data: me } = useAuth();
  const { list, unread, readOne, readAll, removeOne } = useNotifications();
  const showNotifications = useUIStore((s) => s.showNotifications);
  const setShowNotifications = useUIStore((s) => s.setShowNotifications);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
    } catch {}
    try {
      await api.post('/auth/logout');
    } catch {}
    try {
      const bc = new BroadcastChannel('auth-refresh');
      bc.postMessage({ type: 'logged-out' });
      bc.close();
    } catch {}
    await mutate('me', null, false);
    toast.success('로그아웃되었습니다.');
    router.push('/');
  };

  const handleSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    const providerNames = { kakao: '카카오', naver: '네이버', google: '구글' };
    setShowAuthModal(false);
    try {
      localStorage.setItem('lastOAuthProvider', provider);
    } catch {}
    try {
      document.cookie = `last_oauth_provider=${provider}; Max-Age=15552000; Path=/; SameSite=Lax`;
    } catch {}
    toast.success(`${providerNames[provider]} 로그인 진행 중`, {
      description: '로그인 페이지로 이동합니다.',
    });
    // Initiate OAuth through BFF to ensure cookies are set for FE domain
    window.location.href = `/api/oauth2/authorization/${provider}`;
  };

  // State for the main page UI
  const [activeTab, setActiveTab] = useState('trips');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [participantFilter, setParticipantFilter] = useState('all');
  const [wishlist, setWishlist] = useState<string[]>([]);

  // 상세 모달 상태 관리
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);

  // 메인 섹션 데이터: 실제 API 연동
  const { data: tripsData, isLoading: tripsLoading } = useTrips({ page: 0, size: 8 });
  const { data: meetupsData, isLoading: meetupsLoading } = useMeetups({ page: 0, size: 8 });
  const trips = useMemo(() => tripsData?.items ?? [], [tripsData]);
  const meetups = useMemo(() => meetupsData?.items ?? [], [meetupsData]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* 메인 히어로 섹션 */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-slate-900">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-slate-900">함께하는 여행의 새로운 경험</h1>
            </div>
            <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
              전국의 여행러들과 함께 특별한 추억을 만들어보세요. 새로운 친구들과 잊지 못할 여행을
              시작하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button
                size="lg"
                onClick={() => router.push('/trips')}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <MapPin className="h-5 w-5 mr-2" />
                여행 찾기
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/meetups')}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Users className="h-5 w-5 mr-2" />
                모임 찾기
              </Button>
            </div>
          </div>

          {/* 카테고리 빠른 탐색 */}
          <div className="mb-8">
            <h2 className="text-center text-foreground mb-6">인기 카테고리</h2>

            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {[
                { name: '자연', icon: '🏔️' },
                { name: '문화', icon: '🎭' },
                { name: '음식', icon: '🍜' },
                { name: '스포츠', icon: '⚽' },
                { name: '사진', icon: '📷' },
                { name: '역사', icon: '🏛️' },
                { name: '액티비티', icon: '🎪' },
                { name: '휴양', icon: '🏖️' },
              ].map((category) => (
                <div
                  key={category.name}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => router.push(`/trips?category=${category.name}`)}
                >
                  <div className="w-16 h-16 bg-card hover:bg-muted rounded-full flex items-center justify-center mb-2 transition-all duration-200 group-hover:scale-110 group-hover:shadow-md border border-border">
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <Card className="text-center border border-border bg-card hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold text-foreground">{trips.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">활성 여행</p>
              </CardContent>
            </Card>
            <Card className="text-center border border-border bg-card hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold text-foreground">{meetups.length}</span>
                </div>
                <p className="text-sm text-muted-foreground">진행 중 모임</p>
              </CardContent>
            </Card>
            <Card className="text-center border border-border bg-card hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-foreground">4.8</span>
                </div>
                <p className="text-sm text-muted-foreground">평균 평점</p>
              </CardContent>
            </Card>
            <Card className="text-center border border-border bg-card hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold text-foreground">1.2K</span>
                </div>
                <p className="text-sm text-muted-foreground">활성 사용자</p>
              </CardContent>
            </Card>
          </div>

          {/* 추천 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 인기 여행 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  인기 여행
                  <Badge variant="secondary">HOT</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trips.slice(0, 2).map((trip, index) => (
                    <div
                      key={trip.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/trips/${trip.id}`)}
                    >
                      <div className="text-orange-500 font-bold text-lg min-w-[24px]">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{trip.title}</p>
                        <p className="text-sm text-muted-foreground">{trip.destination}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{trip.rating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {trip.participants}/{trip.maxParticipants}명
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 인기 모임 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />곧 시작하는 모임
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {meetups.slice(0, 2).map((meetup) => (
                    <div
                      key={meetup.id}
                      className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/meetups/${meetup.id}`)}
                    >
                      <p className="font-medium text-sm line-clamp-1">{meetup.title}</p>
                      <p className="text-xs text-muted-foreground">{meetup.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-blue-600">{meetup.date}</span>
                        <Badge variant="outline" className="text-xs">
                          {meetup.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 탭 시스템 */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="trips" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  여행
                </TabsTrigger>
                <TabsTrigger value="meetups" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  모임
                </TabsTrigger>
                <TabsTrigger value="community" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  커뮤니티
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${activeTab}`)}
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  전체보기
                </Button>
              </div>
            </div>

            <TabsContent value="trips" className="space-y-4">
              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                participantFilter={participantFilter}
                onParticipantFilterChange={setParticipantFilter}
                categories={[
                  '자연',
                  '문화',
                  '역사',
                  '음식',
                  '액티비티',
                  '휴양',
                  '도시',
                  '배낭여행',
                ]}
                type="trips"
              />

              {tripsLoading ? (
                <CardGridSkeleton />
              ) : trips.length === 0 ? (
                <EmptyState
                  title="아직 여행이 없습니다"
                  description="첫 번째 여행을 만들어보세요!"
                  action={<Button onClick={() => router.push('/trips')}>여행 만들기</Button>}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trips.slice(0, 3).map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={{ ...trip, isWished: wishlist.includes(trip.id) }}
                      onClick={() => router.push(`/trips/${trip.id}`)}
                      onDetailsClick={() => setSelectedTrip(trip)}
                      onWishToggle={(id) => {
                        setWishlist((prev) =>
                          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="meetups" className="space-y-4">
              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                participantFilter={participantFilter}
                onParticipantFilterChange={setParticipantFilter}
                categories={[
                  '스포츠',
                  '문화',
                  '음식',
                  '사진',
                  '게임',
                  '스터디',
                  '네트워킹',
                  '봉사',
                ]}
                type="meetups"
              />

              {meetupsLoading ? (
                <CardGridSkeleton />
              ) : meetups.length === 0 ? (
                <EmptyState
                  title="아직 모임이 없습니다"
                  description="첫 번째 모임을 만들어보세요!"
                  action={<Button onClick={() => router.push('/meetups')}>모임 만들기</Button>}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {meetups.slice(0, 3).map((meetup) => (
                    <MeetupCard
                      key={meetup.id}
                      meetup={{ ...meetup, isWished: wishlist.includes(meetup.id) }}
                      onClick={() => router.push(`/meetups/${meetup.id}`)}
                      onDetailsClick={() => setSelectedMeetup(meetup)}
                      onWishToggle={(id) => {
                        setWishlist((prev) =>
                          prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
                        );
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="community" className="space-y-4">
              <Community />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Toaster position="top-right" expand richColors closeButton />
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={list.items}
        onMarkAsRead={async (id) => {
          await readOne.trigger(id);
          await Promise.all([list.mutate(), unread.mutate()]);
        }}
        onMarkAllAsRead={async () => {
          await readAll.trigger();
          await Promise.all([list.mutate(), unread.mutate()]);
        }}
        onDeleteNotification={async (id) => {
          await removeOne.trigger(id);
          await Promise.all([list.mutate(), unread.mutate()]);
        }}
        onNotificationClick={async (n) => {
          setShowNotifications(false);
          if (!n.isRead) {
            await readOne.trigger(n.id);
            await Promise.all([list.mutate(), unread.mutate()]);
          }
          if (n.actionUrl) router.push(n.actionUrl);
        }}
        onViewAllClick={() => {
          setShowNotifications(false);
          router.push('/notifications');
        }}
      />
      {/* Detail Modals */}
      {selectedTrip && (
        <TripDetailModal trip={selectedTrip} isOpen onClose={() => setSelectedTrip(null)} />
      )}
      {selectedMeetup && (
        <MeetupDetailModal meetup={selectedMeetup} isOpen onClose={() => setSelectedMeetup(null)} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSocialLogin={handleSocialLogin}
      />
    </div>
  );
}
