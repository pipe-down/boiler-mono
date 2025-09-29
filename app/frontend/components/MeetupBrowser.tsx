import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Alert, AlertDescription, AlertTitle } from '@chatstack/ui';
import { MeetupCard } from './MeetupCard';
import { SearchAndFilter } from './SearchAndFilter';
import { CardGridSkeleton, EmptyState, NoSearchResults } from './LoadingStates';
import {
  Users,
  PlusIcon,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  Clock,
  Filter,
  AlertTriangle
} from '@chatstack/ui';
import { Meetup } from '@/types/meetup';

interface MeetupBrowserProps {
  meetups: Meetup[];
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  onMeetupClick: (meetup: Meetup) => void;
  onMeetupDetailClick?: (meetup: Meetup) => void;
  onWishToggle: (meetupId: string) => void;
  onCreateMeetup: () => void;
  isLoading?: boolean;
  error?: unknown;
}

export function MeetupBrowser({
  meetups,
  currentUser,
  onMeetupClick,
  onMeetupDetailClick,
  onWishToggle,
  onCreateMeetup,
  isLoading = false,
  error,
}: MeetupBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [participantFilter, setParticipantFilter] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [locationFilter, setLocationFilter] = useState('all');

  // 필터링 및 정렬 로직
  const getFilteredAndSortedMeetups = () => {
    let filtered = meetups.filter((meetup) => {
      // 검색 필터
      const searchMatch =
        !searchQuery ||
        meetup.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.description.toLowerCase().includes(searchQuery.toLowerCase());

      // 카테고리 필터
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(meetup.category);

      // 참가자 수 필터
      const participantMatch =
        participantFilter === 'all' ||
        (participantFilter === 'small' && meetup.maxParticipants <= 8) ||
        (participantFilter === 'medium' &&
          meetup.maxParticipants >= 9 &&
          meetup.maxParticipants <= 15) ||
        (participantFilter === 'large' && meetup.maxParticipants > 15);

      // 지역 필터
      const locationMatch = locationFilter === 'all' || meetup.location.includes(locationFilter);

      return searchMatch && categoryMatch && participantMatch && locationMatch;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          return (b.rating || 0) - (a.rating || 0);
        case 'deadline':
          return a.maxParticipants - a.participants - (b.maxParticipants - b.participants);
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const allCategories = [...new Set(meetups.map((meetup) => meetup.category))];
  const filteredMeetups = getFilteredAndSortedMeetups();

  // 통계 계산
  const stats = {
    totalMeetups: meetups.length,
    availableSpots: meetups.reduce(
      (sum, meetup) => sum + (meetup.maxParticipants - meetup.participants),
      0,
    ),
    popularLocations: meetups.reduce(
      (acc, meetup) => {
        const location = meetup.location.split(',').pop()?.trim() || '';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    averageRating: meetups.reduce((sum, meetup) => sum + (meetup.rating || 0), 0) / meetups.length,
    todayMeetups: meetups.filter((meetup) => {
      const today = new Date().toDateString();
      const meetupDate = new Date(meetup.date).toDateString();
      return today === meetupDate;
    }).length,
  };

  const topLocations = Object.entries(stats.popularLocations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // 곧 시작하는 모임 (24시간 내)
  const upcomingMeetups = meetups
    .filter((meetup) => {
      const now = new Date();
      const meetupDateTime = new Date(`${meetup.date} ${meetup.time}`);
      const timeDiff = meetupDateTime.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // 24시간 내
    })
    .sort(
      (a, b) =>
        new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime(),
    )
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-green-600">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-slate-900">모임 찾기</h1>
        </div>
        <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
          다양한 취미와 관심사를 가진 사람들과 함께하는 원데이 모임을 찾아보세요. 새로운 친구들과
          즐거운 시간을 보내세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            size="lg"
            onClick={onCreateMeetup}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <PlusIcon className="h-5 w-5 mr-2" />새 모임 만들기
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <Card className="text-center border border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-slate-900">{stats.totalMeetups}</span>
            </div>
            <p className="text-sm text-slate-600">활성 모임</p>
          </CardContent>
        </Card>
        <Card className="text-center border border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">{stats.availableSpots}</span>
            </div>
            <p className="text-sm text-slate-600">참여 가능</p>
          </CardContent>
        </Card>
        <Card className="text-center border border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-slate-900">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-slate-600">평균 평점</p>
          </CardContent>
        </Card>
        <Card className="text-center border border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-slate-900">{stats.todayMeetups}</span>
            </div>
            <p className="text-sm text-slate-600">오늘 모임</p>
          </CardContent>
        </Card>
      </div>

      {/* 곧 시작하는 모임 */}
      {upcomingMeetups.length > 0 && (
        <Card className="max-w-4xl mx-auto border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />곧 시작하는 모임 (24시간 내)
              <Badge variant="destructive">긴급</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingMeetups.map((meetup) => (
                <div
                  key={meetup.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-orange-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onMeetupClick(meetup)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{meetup.title}</h4>
                      <p className="text-sm text-slate-600">{meetup.location}</p>
                      <p className="text-xs text-orange-600 font-medium">
                        {meetup.date} {meetup.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {meetup.category}
                    </Badge>
                    <p className="text-xs text-slate-500">
                      {meetup.participants}/{meetup.maxParticipants}명
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 인기 지역 */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            인기 모임 지역
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topLocations.map(([location, count]) => (
              <Button
                key={location}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300"
                onClick={() => setLocationFilter(location)}
              >
                <MapPin className="h-3 w-3" />
                {location}
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 검색 및 필터 */}
      <div className="max-w-6xl mx-auto">
        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          categories={allCategories}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          participantFilter={participantFilter}
          onParticipantFilterChange={setParticipantFilter}
          type="meetups"
        />
      </div>

      {/* 모임 목록 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              모임 목록 ({filteredMeetups.length}개)
            </h2>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">&quot;{searchQuery}&quot; 검색 결과</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              격자
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              목록
            </Button>
          </div>
        </div>

        {isLoading ? (
          <CardGridSkeleton />
        ) : filteredMeetups.length === 0 ? (
          searchQuery ? (
            <NoSearchResults query={searchQuery} onClearSearch={() => setSearchQuery('')} />
          ) : (
            <EmptyState
              title="등록된 모임이 없습니다"
              description="첫 번째 모임을 만들어보세요!"
              action={
                <Button onClick={onCreateMeetup}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  모임 만들기
                </Button>
              }
              icon={<Users className="h-12 w-12" />}
            />
          )
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredMeetups.map((meetup) => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup}
                onClick={() => onMeetupClick(meetup)}
                onDetailsClick={() => onMeetupDetailClick?.(meetup)}
                onWishToggle={onWishToggle}
                variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
              />
            ))}
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      {filteredMeetups.length > 0 && (
        <div className="text-center pt-8 border-t">
          <Button variant="outline" size="lg" onClick={onCreateMeetup}>
            내 모임도 만들어보세요
          </Button>
        </div>
      )}
    </div>
  );
}
