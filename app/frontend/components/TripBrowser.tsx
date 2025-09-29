import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Alert, AlertDescription, AlertTitle } from '@chatstack/ui';
import { TripCard } from './TripCard';
import { SearchAndFilter } from './SearchAndFilter';
import { CardGridSkeleton, EmptyState, NoSearchResults } from './LoadingStates';
import {
  MapPin,
  PlusIcon,
  TrendingUp,
  Star,
  Users,
  Calendar,
  Filter,
  AlertTriangle
} from '@chatstack/ui';
import { Trip } from '@/types/trip';

interface TripBrowserProps {
  trips: Trip[];
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  onTripClick: (trip: Trip) => void;
  onTripDetailClick?: (trip: Trip) => void;
  onWishToggle: (tripId: string) => void;
  onCreateTrip: () => void;
  isLoading?: boolean;
  error?: unknown;
}

export function TripBrowser({
  trips,
  currentUser,
  onTripClick,
  onTripDetailClick,
  onWishToggle,
  onCreateTrip,
  isLoading = false,
  error,
}: TripBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [participantFilter, setParticipantFilter] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 필터링 및 정렬 로직
  const getFilteredAndSortedTrips = () => {
    let filtered = trips.filter((trip) => {
      // 검색 필터
      const searchMatch =
        !searchQuery ||
        trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchQuery.toLowerCase());

      // 카테고리 필터
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => trip.categories.includes(cat));

      // 참가자 수 필터
      const participantMatch =
        participantFilter === 'all' ||
        (participantFilter === 'small' && trip.maxParticipants <= 5) ||
        (participantFilter === 'medium' &&
          trip.maxParticipants >= 6 &&
          trip.maxParticipants <= 10) ||
        (participantFilter === 'large' && trip.maxParticipants > 10);

      return searchMatch && categoryMatch && participantMatch;
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
        case 'alphabetical':
          return a.title.localeCompare(b.title);
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

  const allCategories = [...new Set(trips.flatMap((trip) => trip.categories))];
  const filteredTrips = getFilteredAndSortedTrips();

  // 통계 계산
  const stats = {
    totalTrips: trips.length,
    availableSpots: trips.reduce(
      (sum, trip) => sum + (trip.maxParticipants - trip.participants),
      0,
    ),
    popularDestinations: trips.reduce(
      (acc, trip) => {
        const destination = trip.destination.split(',')[0];
        acc[destination] = (acc[destination] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    averageRating: trips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / trips.length,
  };

  const topDestinations = Object.entries(stats.popularDestinations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-blue-600">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-slate-900">여행 찾기</h1>
        </div>
        <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
          전국의 여행러들과 함께 특별한 추억을 만들어보세요. 새로운 목적지를 탐험하고 멋진 동행을
          찾아보세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            size="lg"
            onClick={onCreateTrip}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusIcon className="h-5 w-5 mr-2" />새 여행 계획 만들기
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <Card className="text-center border border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">{stats.totalTrips}</span>
            </div>
            <p className="text-sm text-slate-600">활성 여행</p>
          </CardContent>
        </Card>
        <Card className="text-center border border-slate-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
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
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-slate-900">
                {topDestinations[0]?.[0] || 'N/A'}
              </span>
            </div>
            <p className="text-sm text-slate-600">인기 목적지</p>
          </CardContent>
        </Card>
      </div>

      {/* 인기 목적지 */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            인기 여행 목적지
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topDestinations.map(([destination, count]) => (
              <Button
                key={destination}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
                onClick={() => setSearchQuery(destination)}
              >
                <MapPin className="h-3 w-3" />
                {destination}
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
          type="trips"
        />
      </div>

      {/* 여행 목록 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              여행 목록 ({filteredTrips.length}개)
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
        ) : filteredTrips.length === 0 ? (
          searchQuery ? (
            <NoSearchResults query={searchQuery} onClearSearch={() => setSearchQuery('')} />
          ) : (
            <EmptyState
              title="등록된 여행이 없습니다"
              description="첫 번째 여행을 만들어보세요!"
              action={
                <Button onClick={onCreateTrip}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  여행 만들기
                </Button>
              }
              icon={<MapPin className="h-12 w-12" />}
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
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => onTripClick(trip)}
                onDetailsClick={() => onTripDetailClick?.(trip)}
                onWishToggle={onWishToggle}
                variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
              />
            ))}
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      {filteredTrips.length > 0 && (
        <div className="text-center pt-8 border-t">
          <Button variant="outline" size="lg" onClick={onCreateTrip}>
            내 여행도 공유해보세요
          </Button>
        </div>
      )}
    </div>
  );
}
