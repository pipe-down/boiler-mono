'use client';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Skeleton,
  Input,
} from '@chatstack/ui';
import { BellIcon, Menu, Search, Compass } from '@chatstack/ui';
import { CompactThemeToggle } from './ThemeToggle';
import HeaderSearch from './HeaderSearch';
import HeaderProfileMenu from './HeaderProfileMenu';
import HeaderNavLinks from './HeaderNavLinks';

const DevBypassPopover = dynamic(() => import('./DevBypassPopover'), { ssr: false });

interface HeaderProps {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    unreadNotifications: number;
    points?: number;
    level?: number;
    nextLevelPoints?: number;
  } | null;
  onLogin: () => void;
  onLogout: () => void;
  onNotificationClick: (e?: React.MouseEvent) => void;
  onMyPageClick: () => void;
  onWishlistClick: () => void;
  onDashboardClick: () => void;
  onCommunityClick: () => void;
  onMyActivityClick: () => void;
  onMessagesClick: () => void;
  onSettingsClick: () => void;
  onMyTripsAndMeetupsClick: () => void;
  onSearchResults?: (query: string) => void;
  onTripTabClick?: () => void;
  onMeetupTabClick?: () => void;
  isLoading?: boolean;
  // Optional counts to replace hardcoded badges; when undefined, badges are hidden
  wishlistCount?: number;
  tripCount?: number;
  unreadDMCount?: number;
}

export function Header({
                         user,
                         onLogin,
                         onLogout,
                         onNotificationClick,
                         onMyPageClick,
                         onWishlistClick,
                         onDashboardClick,
                         onCommunityClick,
                         onMyActivityClick,
                         onMessagesClick,
                         onSettingsClick,
                         onMyTripsAndMeetupsClick,
                         onSearchResults,
                         onTripTabClick,
                         onMeetupTabClick,
                         isLoading = false,
                         wishlistCount,
                         tripCount,
                         unreadDMCount,
                       }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const headerRef = useRef<HTMLElement | null>(null);

  const updateHeaderHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    const node = headerRef.current;
    if (!node) return;
    const height = Math.round(node.getBoundingClientRect().height);
    try {
      document.documentElement.style.setProperty('--app-header-height', `${height}px`);
    } catch {}
  }, []);

  useLayoutEffect(() => {
    updateHeaderHeight();
    const node = headerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      if (typeof window !== 'undefined') window.addEventListener('resize', updateHeaderHeight);
      return () => {
        if (typeof window !== 'undefined') window.removeEventListener('resize', updateHeaderHeight);
      };
    }

    const ro = new ResizeObserver(() => updateHeaderHeight());
    ro.observe(node);
    if (typeof window !== 'undefined') window.addEventListener('resize', updateHeaderHeight);

    return () => {
      try {
        ro.disconnect();
      } catch {}
      if (typeof window !== 'undefined') window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [updateHeaderHeight]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = React.useRef('');
  const [isPending, startTransition] = React.useTransition();
  const pathname = usePathname();

  // Build-time dev guard (보수적으로 잠금)
  const __DEV_BYPASS__ =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_PAGES === 'true';

  // Number formatting and progress clamp
  const nf = React.useMemo(() => new Intl.NumberFormat('ko-KR'), []);
  const pts = user?.points ?? 0;
  const next = Math.max(1, user?.nextLevelPoints ?? 3000);
  const remain = Math.max(0, next - pts);
  const progress = Math.min(Math.max((pts / next) * 100, 0), 100);

  // Safely compute user initials (이모지/조합문자 대응)
  const userInitials = React.useMemo(() => {
    const base = (user?.name ?? user?.email ?? 'U').trim();
    // @ts-ignore: Intl.Segmenter가 런타임엔 존재하나 TS 타입에 없을 수 있음
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      // @ts-ignore
      const seg = new Intl.Segmenter('ko', { granularity: 'grapheme' });
      return Array.from(seg.segment(base)).slice(0, 2).map((s: any) => s.segment).join('');
    }
    return base.slice(0, 2);
  }, [user?.name, user?.email]);

  const handleLogin = React.useCallback(() => onLogin(), [onLogin]);
  const handleLogout = React.useCallback(() => onLogout(), [onLogout]);

  const runSearch = React.useCallback(
    (q: string) => {
      if (!q || q === lastQueryRef.current) return;
      lastQueryRef.current = q;
      startTransition(() => onSearchResults?.(q));
    },
    [onSearchResults],
  );

  const handleSearchSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      const q = searchQuery.trim();
      if (q) runSearch(q);
    },
    [searchQuery, runSearch],
  );

  const handleSearchInput = React.useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        const q = value.trim();
        if (q.length > 2) runSearch(q);
      }, 250);
    },
    [runSearch],
  );

  // 키보드 단축키: Cmd/Ctrl+K, '/' 로 검색 열기
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const isSlash = e.key === '/' && !e.metaKey && !e.ctrlKey && !inEditable;
      if (isCmdK || isSlash) {
        e.preventDefault();
        setShowMobileSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 라우트 변경 시 모달 자동 닫기
  React.useEffect(() => {
    setShowMobileSearch(false);
  }, [pathname]);

  // 디바운스 클린업
  React.useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // 접근성: aria-describedby 안전 id
  const descId = React.useId();

  return (
    <header
      ref={headerRef}
      className="border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 shadow-sm pt-[calc(env(safe-area-inset-top,0px))]"
    >
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2"
      >
        본문으로 건너뛰기
      </a>

      <div className="container mx-auto px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-4">
          {/* 로고 (헤더의 맨왼쪽) */}
          <Link
            href="/"
            aria-label="홈으로 이동"
            prefetch={false}
            className="flex items-center gap-3 min-w-fit"
            data-testid="header-logo-link"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-foreground">Getmoim</span>
              <p className="text-xs text-muted-foreground leading-tight">함께하는 여행</p>
            </div>
          </Link>

          {/* 검색바 (데스크톱) */}
          <HeaderSearch
            query={searchQuery}
            onChange={handleSearchInput}
            onSubmit={handleSearchSubmit}
          />

          {/* 네비게이션 */}
          <nav aria-label="주요 탐색" className="hidden xl:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
              asChild
            >
              <Link
                href="/trips"
                prefetch={false}
                aria-label="여행 찾기 페이지로 이동"
                onClick={onTripTabClick}
                data-testid="header-nav-trips"
              >
                여행 찾기
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
              asChild
            >
              <Link
                href="/meetups"
                prefetch={false}
                aria-label="모임 찾기 페이지로 이동"
                onClick={onMeetupTabClick}
                data-testid="header-nav-meetups"
              >
                모임 찾기
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
              asChild
            >
              <Link
                href="/activity"
                prefetch={false}
                aria-label="내 활동 페이지로 이동"
                onClick={onMyActivityClick}
                data-testid="header-nav-activity"
              >
                내 활동
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
              asChild
            >
              <Link
                href="/community"
                prefetch={false}
                aria-label="커뮤니티 페이지로 이동"
                onClick={onCommunityClick}
                data-testid="header-nav-community"
              >
                커뮤니티
              </Link>
            </Button>
          </nav>

          {/* 사용자 영역 (오른쪽 사이드) */}
          <div className="flex items-center gap-2">
            {/* ▼ 프로필 영역의 맨왼쪽에 BYPASS 배치 */}
            {__DEV_BYPASS__ && <DevBypassPopover />}

            {/* Theme toggle (design parity) */}
            <CompactThemeToggle />

            {typeof user === 'undefined' ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ) : user ? (
              <>
                {/* 알림 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 hover:bg-accent transition-all duration-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onNotificationClick?.(e); }}
                  onAuxClick={(e: React.MouseEvent) => {
                    // Middle-click support → open in new tab
                    if (e.button === 1) onNotificationClick?.(e as any);
                  }}
                  aria-label="알림 열기"
                  data-testid="header-notifications"
                >
                  <BellIcon className="h-5 w-5 text-muted-foreground" />
                  {user.unreadNotifications > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <span className="sr-only">
                        읽지 않은 알림 {user.unreadNotifications}개
                      </span>
                      {user.unreadNotifications > 99 ? '99+' : user.unreadNotifications}
                    </Badge>
                  )}
                </Button>

                {/* 사용자 프로필 드롭다운 */}
                <HeaderProfileMenu
                  user={user}
                  isLoading={isLoading}
                  onMyActivityClick={onMyActivityClick}
                  onMyPageClick={onMyPageClick}
                  onWishlistClick={onWishlistClick}
                  onMyTripsAndMeetupsClick={onMyTripsAndMeetupsClick}
                  onMessagesClick={onMessagesClick}
                  onDashboardClick={onDashboardClick}
                  onSettingsClick={onSettingsClick}
                  onLogout={handleLogout}
                  wishlistCount={wishlistCount}
                  tripCount={tripCount}
                  unreadDMCount={unreadDMCount}
                  nf={nf}
                  pts={pts}
                  remain={remain}
                  progress={progress}
                  userInitials={userInitials}
                />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  로그인
                </Button>
                {/*<Button onClick={onLogin} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
                  회원가입
                </Button>*/}
              </div>
            )}

            {/* 검색 버튼 (모바일) */}
            <Button
              ref={mobileSearchBtnRef}
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 hover:bg-accent"
              onClick={() => setShowMobileSearch(true)}
              aria-label="검색 열기"
              aria-haspopup="dialog"
              aria-expanded={showMobileSearch}
              aria-controls="mobile-search"
              data-testid="header-mobile-search-trigger"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* 모바일 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="xl:hidden p-2 hover:bg-accent"
                  aria-label="메인 메뉴 열기"
                >
                  <Menu className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <HeaderNavLinks
                  onTripTabClick={onTripTabClick}
                  onMeetupTabClick={onMeetupTabClick}
                  onMyActivityClick={onMyActivityClick}
                  onCommunityClick={onCommunityClick}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 모바일 검색 모달 */}
      <Dialog
        open={showMobileSearch}
        onOpenChange={(open) => {
          setShowMobileSearch(open);
          if (!open) requestAnimationFrame(() => mobileSearchBtnRef.current?.focus());
        }}
      >
        <DialogContent
          id="mobile-search"
          className="top-[10%] sm:top-[20%] sm:max-w-md"
          aria-describedby={descId}
        >
          <DialogHeader>
            <DialogTitle>검색</DialogTitle>
          </DialogHeader>
          <div id={descId} className="sr-only">
            여행지, 모임을 검색할 수 있습니다.
          </div>
          <form
            onSubmit={(e) => {
              handleSearchSubmit(e);
              setShowMobileSearch(false);
            }}
            className="space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="여행지, 모임을 검색해보세요..."
                className="pl-10 pr-4"
                data-testid="header-search-input"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowMobileSearch(false)}>
                취소
              </Button>
              <Button type="submit" disabled={!searchQuery.trim() || isPending}>
                {isPending ? '검색 중…' : '검색'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
