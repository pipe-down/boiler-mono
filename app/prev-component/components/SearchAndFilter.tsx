import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Filter, X } from '@/src/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  categories: string[];
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  participantFilter: string;
  onParticipantFilterChange: (participants: string) => void;
  type: 'trips' | 'meetups';
}

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoriesChange,
  categories,
  priceRange,
  onPriceRangeChange,
  dateFilter,
  onDateFilterChange,
  participantFilter,
  onParticipantFilterChange,
  type,
}: SearchAndFilterProps) {
  const activeFilterCount =
    selectedCategories.length +
    (dateFilter !== 'all' ? 1 : 0) +
    (participantFilter !== 'all' ? 1 : 0);

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoriesChange(newCategories);
  };

  const clearAllFilters = () => {
    onCategoriesChange([]);
    onDateFilterChange('all');
    onParticipantFilterChange('all');
  };

  return (
    <div className="space-y-4">
      {/* 검색바 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={type === 'trips' ? '여행지, 제목으로 검색...' : '장소, 제목으로 검색...'}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 필터 및 정렬 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 정렬 */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">최신순</SelectItem>
            <SelectItem value="popular">인기순</SelectItem>
            <SelectItem value="deadline">마감임박순</SelectItem>
            <SelectItem value="price">가격순</SelectItem>
          </SelectContent>
        </Select>

        {/* 필터 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              필터
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4>필터</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                  >
                    전체 초기화
                  </Button>
                )}
              </div>
              <Separator />

              {/* 카테고리 필터 */}
              <div>
                <label className="mb-2 block">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {categories &&
                    categories.map((category) => (
                      <Badge
                        key={category}
                        variant={selectedCategories.includes(category) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => handleCategoryToggle(category)}
                      >
                        {category}
                        {selectedCategories.includes(category) && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* 날짜 필터 */}
              <div>
                <label className="mb-2 block">기간</label>
                <Select value={dateFilter} onValueChange={onDateFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="week">이번 주</SelectItem>
                    <SelectItem value="month">이번 달</SelectItem>
                    <SelectItem value="3months">3개월 이내</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 참가자 수 필터 */}
              <div>
                <label className="mb-2 block">참가 가능 인원</label>
                <Select value={participantFilter} onValueChange={onParticipantFilterChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="small">1-5명</SelectItem>
                    <SelectItem value="medium">6-10명</SelectItem>
                    <SelectItem value="large">11명 이상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 선택된 필터 표시 */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <Badge key={category} variant="secondary" className="gap-1">
                {category}
                <button
                  onClick={() => handleCategoryToggle(category)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {dateFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {dateFilter === 'week'
                  ? '이번 주'
                  : dateFilter === 'month'
                    ? '이번 달'
                    : '3개월 이내'}
                <button
                  onClick={() => onDateFilterChange('all')}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {participantFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {participantFilter === 'small'
                  ? '1-5명'
                  : participantFilter === 'medium'
                    ? '6-10명'
                    : '11명 이상'}
                <button
                  onClick={() => onParticipantFilterChange('all')}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
