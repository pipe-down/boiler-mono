import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import {
  Star,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Heart,
  Sparkles,
  Target,
  Zap,
  Calendar,
  Award,
} from '@/src/components/icons';
import { Meetup } from '@/src/types/meetup';

interface MeetupRecommendationsProps {
  meetups: Meetup[];
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
    interests?: string[];
    location?: string;
  } | null;
  onMeetupClick: (meetup: Meetup) => void;
  onWishToggle: (meetupId: string) => void;
}

export function MeetupRecommendations({
  meetups,
  currentUser,
  onMeetupClick,
  onWishToggle,
}: MeetupRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<{
    forYou: Meetup[];
    trending: Meetup[];
    nearby: Meetup[];
    urgent: Meetup[];
  }>({
    forYou: [],
    trending: [],
    nearby: [],
    urgent: [],
  });

  // 추천 알고리즘
  useEffect(() => {
    const generateRecommendations = () => {
      // 사용자 맞춤 추천 (관심사 기반)
      const userInterests = currentUser?.interests || ['스포츠', '맛집', '사진'];
      const forYou = meetups
        .filter((meetup) => userInterests.includes(meetup.category))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 4);

      // 인기 트렌딩 모임 (평점과 참가자 수 기반)
      const trending = meetups
        .filter(
          (meetup) =>
            (meetup.rating || 0) >= 4.5 && meetup.participants >= meetup.maxParticipants * 0.6,
        )
        .sort((a, b) => {
          const scoreA = (a.rating || 0) * 0.7 + (a.participants / a.maxParticipants) * 0.3;
          const scoreB = (b.rating || 0) * 0.7 + (b.participants / b.maxParticipants) * 0.3;
          return scoreB - scoreA;
        })
        .slice(0, 4);

      // 근처 모임 (서울 기준으로 시뮬레이션)
      const nearby = meetups
        .filter(
          (meetup) =>
            meetup.location.includes('서울') ||
            meetup.location.includes('강남') ||
            meetup.location.includes('한강'),
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4);

      // 긴급 모집 모임
      const urgent = meetups
        .filter(
          (meetup) =>
            meetup.urgency === 'high' || meetup.maxParticipants - meetup.participants <= 2,
        )
        .sort((a, b) => {
          // 마감 임박 순으로 정렬
          const urgencyScore = (meetup: Meetup) => {
            const remaining = meetup.maxParticipants - meetup.participants;
            const urgencyWeight =
              meetup.urgency === 'high' ? 10 : meetup.urgency === 'medium' ? 5 : 1;
            return remaining + urgencyWeight;
          };
          return urgencyScore(a) - urgencyScore(b);
        })
        .slice(0, 4);

      setRecommendations({ forYou, trending, nearby, urgent });
    };

    generateRecommendations();
  }, [meetups, currentUser]);

  const RecommendationCard = ({ meetup, reason }: { meetup: Meetup; reason?: string }) => {
    const remainingSpots = meetup.maxParticipants - meetup.participants;
    const fillPercentage = (meetup.participants / meetup.maxParticipants) * 100;
    const isUrgent = meetup.urgency === 'high' || remainingSpots <= 2;

    return (
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200"
        onClick={() => onMeetupClick(meetup)}
      >
        <div className="relative">
          <div className="aspect-[16/9] overflow-hidden rounded-t-lg">
            <img
              src={meetup.imageUrl}
              alt={meetup.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* 상태 배지들 */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {isUrgent && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <Zap className="h-3 w-3" />
                긴급
              </Badge>
            )}
            {meetup.rating && meetup.rating >= 4.5 && (
              <Badge className="bg-yellow-500 text-white text-xs flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                인기
              </Badge>
            )}
          </div>

          {/* 찜하기 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 h-8 w-8 p-0 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onWishToggle(meetup.id);
            }}
          >
            <Heart
              className={`h-4 w-4 ${meetup.isWished ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </Button>
        </div>

        <CardContent className="p-4">
          {reason && (
            <div className="flex items-center gap-1 mb-2">
              <Sparkles className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">{reason}</span>
            </div>
          )}

          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {meetup.title}
          </h3>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{meetup.location}</span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {meetup.date} {meetup.time}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>
                  {meetup.participants}/{meetup.maxParticipants}명
                </span>
              </div>

              {meetup.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span>{meetup.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* 모집 현황 프로그레스 바 */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">모집 현황</span>
              <span className="text-xs text-muted-foreground">{fillPercentage.toFixed(0)}%</span>
            </div>
            <Progress
              value={fillPercentage}
              className={`h-2 ${isUrgent ? 'bg-red-100' : 'bg-gray-100'}`}
            />
            {remainingSpots <= 3 && (
              <p className="text-xs text-orange-600 mt-1 font-medium">{remainingSpots}자리 남음!</p>
            )}
          </div>

          {/* 주최자 정보 */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <Avatar className="h-6 w-6">
              <AvatarImage src={meetup.creatorAvatar} alt={meetup.createdBy} />
              <AvatarFallback className="text-xs">{meetup.createdBy[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{meetup.createdBy}</span>
            <Badge variant="outline" className="text-xs ml-auto">
              {meetup.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">맞춤 추천을 받아보세요</h3>
          <p className="text-sm text-muted-foreground mb-4">
            로그인하시면 취향에 맞는 모임을 추천해드려요
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-medium mb-2 flex items-center justify-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          {currentUser.name}님을 위한 추천 모임
        </h2>
        <p className="text-sm text-muted-foreground">
          취향과 활동 패턴을 분석해 맞춤형 모임을 추천해드려요
        </p>
      </div>

      <Tabs defaultValue="forYou" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forYou" className="text-xs">
            <Sparkles className="h-4 w-4 mr-1" />
            맞춤 추천
          </TabsTrigger>
          <TabsTrigger value="trending" className="text-xs">
            <TrendingUp className="h-4 w-4 mr-1" />
            인기 모임
          </TabsTrigger>
          <TabsTrigger value="nearby" className="text-xs">
            <MapPin className="h-4 w-4 mr-1" />내 근처
          </TabsTrigger>
          <TabsTrigger value="urgent" className="text-xs">
            <Zap className="h-4 w-4 mr-1" />
            긴급 모집
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forYou" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">관심사 기반 맞춤 모임</span>
          </div>
          {recommendations.forYou.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.forYou.map((meetup) => (
                <RecommendationCard key={meetup.id} meetup={meetup} reason="관심사 일치" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2" />
              <p>맞춤 추천 모임이 없습니다</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">지금 뜨는 인기 모임</span>
          </div>
          {recommendations.trending.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.trending.map((meetup) => (
                <RecommendationCard key={meetup.id} meetup={meetup} reason="인기 급상승" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <p>인기 모임이 없습니다</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="nearby" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">내 근처 모임</span>
          </div>
          {recommendations.nearby.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.nearby.map((meetup) => (
                <RecommendationCard key={meetup.id} meetup={meetup} reason="가까운 거리" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p>근처 모임이 없습니다</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">마감 임박 긴급 모집</span>
          </div>
          {recommendations.urgent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.urgent.map((meetup) => (
                <RecommendationCard key={meetup.id} meetup={meetup} reason="마감 임박" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2" />
              <p>긴급 모집 모임이 없습니다</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
