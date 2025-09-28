import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Loader2 } from '@/src/components/icons';

// 카드 스켈레톤
export function CardSkeleton() {
  return (
    <Card className="overflow-hidden h-[480px] flex flex-col animate-pulse">
      <CardHeader className="p-0 flex-shrink-0">
        <Skeleton className="h-48 w-full rounded-t-lg bg-gradient-to-r from-muted via-muted/50 to-muted" />
      </CardHeader>
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-6 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-4 w-2/3 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-4 w-4/5 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 mt-auto">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted" />
            <Skeleton className="h-4 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

// 여행/모임 카드 목록 스켈레톤
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// 리뷰 스켈레톤
export function ReviewSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-4" />
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 프로필 스켈레톤
export function ProfileSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-16" />
              ))}
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-12" />
              ))}
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 중앙 로딩 스피너
export function CenterLoadingSpinner({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

// 빈 상태 컴포넌트
export function EmptyState({
  title = '항목이 없습니다',
  description = '아직 등록된 항목이 없어요.',
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

// 검색 결과 없음
export function NoSearchResults({
  query,
  onClearSearch,
}: {
  query: string;
  onClearSearch: () => void;
}) {
  return (
    <EmptyState
      title="검색 결과가 없습니다"
      description={`"${query}"에 대한 검색 결과가 없어요. 다른 검색어를 시도해보세요.`}
      action={
        <button onClick={onClearSearch} className="text-primary hover:underline">
          검색 초기화
        </button>
      }
    />
  );
}

// 네트워크 오류
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      title="네트워크 오류"
      description="인터넷 연결을 확인하고 다시 시도해주세요."
      action={
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          다시 시도
        </button>
      }
    />
  );
}
