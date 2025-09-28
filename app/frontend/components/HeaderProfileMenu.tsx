'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '@chatstack/ui';
import {
  Activity,
  Calendar,
  Coins,
  LogOut,
  MessageCircle,
  PlusCircle,
  Settings,
  Star,
  TrendingUp,
  User,
  Heart,
} from '@chatstack/ui';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  unreadNotifications: number;
  points?: number;
  level?: number;
  nextLevelPoints?: number;
}

interface HeaderProfileMenuProps {
  user: UserInfo;
  isLoading: boolean;
  onMyActivityClick: () => void;
  onMyPageClick: () => void;
  onWishlistClick: () => void;
  onMyTripsAndMeetupsClick: () => void;
  onMessagesClick: () => void;
  onDashboardClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  wishlistCount?: number;
  tripCount?: number;
  unreadDMCount?: number;
  nf: Intl.NumberFormat;
  pts: number;
  remain: number;
  progress: number;
  userInitials: string;
}

export default function HeaderProfileMenu({
  user,
  isLoading,
  onMyActivityClick,
  onMyPageClick,
  onWishlistClick,
  onMyTripsAndMeetupsClick,
  onMessagesClick,
  onDashboardClick,
  onSettingsClick,
  onLogout,
  wishlistCount,
  tripCount,
  unreadDMCount,
  nf,
  pts,
  remain,
  progress,
  userInitials,
}: HeaderProfileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-ring/30"
          aria-label="사용자 메뉴 열기"
          aria-busy={isLoading ? true : undefined}
          data-testid="header-profile-trigger"
        >
          {isLoading && (
            <span
              role="status"
              aria-label="동기화 중"
              title="동기화 중"
              className="absolute -top-0.5 -left-0.5 inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
            />
          )}
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarImage src={user.avatar} alt={user?.name || '사용자'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user?.name || '사용자'} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-muted-foreground">4.8 · 리뷰 15개</span>
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-600" />
                  <span className="font-medium text-yellow-600">{nf.format(pts)}P</span>
                </div>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-3">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-purple-400/20" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-yellow-500/20 backdrop-blur-sm">
                    <Coins className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300">내 포인트</p>
                    <p className="text-lg font-bold text-yellow-400">{nf.format(pts)}P</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-300">레벨</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-purple-400 fill-current" />
                    <span className="text-sm font-bold text-purple-400">{user.level || 1}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">다음 레벨까지</span>
                  <span className="text-slate-300">{nf.format(remain)}P</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-1">
          <p className="text-xs text-muted-foreground mb-2 px-2">내 활동</p>
          <DropdownMenuItem onClick={onMyActivityClick} className="cursor-pointer">
            <Activity className="mr-3 h-4 w-4" />
            <span>내 활동</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMyPageClick} className="cursor-pointer">
            <User className="mr-3 h-4 w-4" />
            <span>마이페이지</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onWishlistClick} className="cursor-pointer">
            <Heart className="mr-3 h-4 w-4" />
            <span>찜 목록</span>
            {typeof wishlistCount === 'number' && wishlistCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {wishlistCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMyTripsAndMeetupsClick} className="cursor-pointer">
            <Calendar className="mr-3 h-4 w-4" />
            <span>내 여행/모임</span>
            {typeof tripCount === 'number' && tripCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {tripCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMessagesClick} className="cursor-pointer">
            <MessageCircle className="mr-3 h-4 w-4" />
            <span>메시지</span>
            {typeof unreadDMCount === 'number' && unreadDMCount > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {unreadDMCount}
              </Badge>
            )}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-1">
          <p className="text-xs text-muted-foreground mb-2 px-2">도구</p>
          <DropdownMenuItem onClick={onDashboardClick} className="cursor-pointer">
            <TrendingUp className="mr-3 h-4 w-4" />
            <span>통계 대시보드</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <PlusCircle className="mr-3 h-4 w-4" />
            <span>새 여행/모임 만들기</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
            <Settings className="mr-3 h-4 w-4" />
            <span>설정</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={() => onLogout()}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
