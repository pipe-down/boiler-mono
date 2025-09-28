import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import {
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  Heart,
  Star,
  Trophy,
  Coins,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Gift,
  Target,
  Award,
  Activity,
} from '@/src/components/icons';
import { Trip } from '@/src/types/trip';
import { Meetup } from '@/src/types/meetup';

interface MyActivityProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    points: number;
    level: number;
    nextLevelPoints: number;
  };
  myTrips?: Trip[];
  myMeetups?: Meetup[];
  joinedTrips?: Trip[];
  joinedMeetups?: Meetup[];
  recentActivities?: ActivityItem[];
  pointHistory?: PointTransaction[];
}

interface ActivityItem {
  id: string;
  type:
    | 'trip_created'
    | 'meetup_created'
    | 'trip_joined'
    | 'meetup_joined'
    | 'review_written'
    | 'post_created'
    | 'comment_added';
  title: string;
  description: string;
  timestamp: string;
  points?: number;
  relatedId?: string;
  status: 'completed' | 'ongoing' | 'cancelled';
}

interface PointTransaction {
  id: string;
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  timestamp: string;
  category: 'travel' | 'community' | 'reward' | 'bonus';
}

export function MyActivity({
  isOpen,
  onClose,
  user,
  myTrips = [],
  myMeetups = [],
  joinedTrips = [],
  joinedMeetups = [],
  recentActivities = [],
  pointHistory = [],
}: MyActivityProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // 기본 사용자 정보 설정
  const defaultUser = user || {
    id: '1',
    name: '김여행자',
    email: 'traveler@example.com',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
    points: 2340,
    level: 5,
    nextLevelPoints: 3000,
  };

  // 기본 데이터 설정
  const defaultRecentActivities: ActivityItem[] =
    recentActivities.length > 0
      ? recentActivities
      : [
          {
            id: '1',
            type: 'trip_created',
            title: '제주도 힐링 여행 생성',
            description: '새로운 제주도 여행을 만들었습니다.',
            timestamp: '2024-03-15T10:00:00Z',
            points: 100,
            status: 'ongoing',
          },
          {
            id: '2',
            type: 'meetup_joined',
            title: '한강 자전거 라이딩 참여',
            description: '한강 자전거 라이딩 모임에 참여했습니다.',
            timestamp: '2024-03-14T16:00:00Z',
            points: 50,
            status: 'completed',
          },
          {
            id: '3',
            type: 'review_written',
            title: '여행 후기 작성',
            description: '부산 여행에 대한 후기를 작성했습니다.',
            timestamp: '2024-03-13T14:30:00Z',
            points: 30,
            status: 'completed',
          },
        ];

  const defaultPointHistory: PointTransaction[] =
    pointHistory.length > 0
      ? pointHistory
      : [
          {
            id: '1',
            type: 'earned',
            amount: 100,
            reason: '제주도 힐링 여행 생성',
            timestamp: '2024-03-15T10:00:00Z',
            category: 'travel',
          },
          {
            id: '2',
            type: 'earned',
            amount: 50,
            reason: '한강 자전거 라이딩 참여',
            timestamp: '2024-03-14T16:00:00Z',
            category: 'travel',
          },
          {
            id: '3',
            type: 'earned',
            amount: 30,
            reason: '여행 후기 작성',
            timestamp: '2024-03-13T14:30:00Z',
            category: 'community',
          },
          {
            id: '4',
            type: 'earned',
            amount: 20,
            reason: '커뮤니티 게시글 작성',
            timestamp: '2024-03-12T09:15:00Z',
            category: 'community',
          },
        ];

  const totalActivities =
    myTrips.length + myMeetups.length + joinedTrips.length + joinedMeetups.length;
  const completedActivities = defaultRecentActivities.filter(
    (a) => a.status === 'completed',
  ).length;
  const ongoingActivities = defaultRecentActivities.filter((a) => a.status === 'ongoing').length;

  const progressToNextLevel = ((defaultUser.points % 1000) / 1000) * 100;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trip_created':
      case 'trip_joined':
        return <MapPin className="h-4 w-4" />;
      case 'meetup_created':
      case 'meetup_joined':
        return <Users className="h-4 w-4" />;
      case 'review_written':
        return <Star className="h-4 w-4" />;
      case 'post_created':
      case 'comment_added':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'trip_created':
      case 'trip_joined':
        return 'text-blue-600 bg-blue-100';
      case 'meetup_created':
      case 'meetup_joined':
        return 'text-green-600 bg-green-100';
      case 'review_written':
        return 'text-yellow-600 bg-yellow-100';
      case 'post_created':
      case 'comment_added':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ongoing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPointIcon = (category: string) => {
    switch (category) {
      case 'travel':
        return <MapPin className="h-4 w-4" />;
      case 'community':
        return <MessageCircle className="h-4 w-4" />;
      case 'reward':
        return <Gift className="h-4 w-4" />;
      case 'bonus':
        return <Star className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-auto"
        aria-describedby="my-activity-description"
      >
        <DialogHeader>
          <DialogTitle>내 활동</DialogTitle>
          <DialogDescription id="my-activity-description">
            나의 여행 활동 내역과 포인트 현황을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 헤더 및 포인트 시스템 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 사용자 정보 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={defaultUser.avatar} alt={defaultUser.name} />
                    <AvatarFallback className="bg-slate-900 text-white text-lg">
                      {defaultUser.name.split('').slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-bold">{defaultUser.name}</h2>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        레벨 {defaultUser.level}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{defaultUser.email}</p>

                    {/* 레벨 진행도 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">다음 레벨까지</span>
                        <span className="font-medium">
                          {defaultUser.nextLevelPoints - defaultUser.points}P 남음
                        </span>
                      </div>
                      <Progress value={progressToNextLevel} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* 포인트 정보 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-600" />내 포인트
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-3">
                  <div className="text-3xl font-bold text-yellow-600">
                    {defaultUser.points.toLocaleString()}P
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      이번 달 +320P
                    </div>
                  </div>
                  <Button size="sm" className="w-full" variant="outline">
                    <Gift className="h-4 w-4 mr-2" />
                    포인트 사용하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 활동 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalActivities}</div>
                  <p className="text-sm text-muted-foreground">총 활동</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedActivities}</div>
                  <p className="text-sm text-muted-foreground">완료한 활동</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{ongoingActivities}</div>
                  <p className="text-sm text-muted-foreground">진행 중</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {myTrips.length + myMeetups.length}
                  </div>
                  <p className="text-sm text-muted-foreground">내가 만든</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 탭 콘텐츠 */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">전체</TabsTrigger>
              <TabsTrigger value="created">내가 만든</TabsTrigger>
              <TabsTrigger value="joined">참여한</TabsTrigger>
              <TabsTrigger value="points">포인트</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    최근 활동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {defaultRecentActivities.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm line-clamp-1">{activity.title}</h4>
                            <div className="flex items-center gap-2">
                              {activity.points && (
                                <Badge variant="secondary" className="text-xs">
                                  +{activity.points}P
                                </Badge>
                              )}
                              {getStatusIcon(activity.status)}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="created" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 내가 만든 여행 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      내가 만든 여행 ({myTrips.length}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {myTrips.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          만든 여행이 없습니다.
                        </p>
                      ) : (
                        myTrips.slice(0, 5).map((trip) => (
                          <div
                            key={trip.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                          >
                            <Avatar className="h-10 w-10 rounded-lg">
                              <AvatarImage src={trip.imageUrl} alt={trip.title} />
                              <AvatarFallback>
                                <MapPin className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm line-clamp-1">{trip.title}</h5>
                              <p className="text-xs text-muted-foreground">{trip.destination}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {trip.participants}/{trip.maxParticipants}명
                                </Badge>
                                {trip.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs">{trip.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 내가 만든 모임 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      내가 만든 모임 ({myMeetups.length}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {myMeetups.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          만든 모임이 없습니다.
                        </p>
                      ) : (
                        myMeetups.slice(0, 5).map((meetup) => (
                          <div
                            key={meetup.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                          >
                            <Avatar className="h-10 w-10 rounded-lg">
                              <AvatarImage src={meetup.imageUrl} alt={meetup.title} />
                              <AvatarFallback>
                                <Users className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm line-clamp-1">{meetup.title}</h5>
                              <p className="text-xs text-muted-foreground">{meetup.location}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {meetup.participants}/{meetup.maxParticipants}명
                                </Badge>
                                <span className="text-xs text-muted-foreground">{meetup.date}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="joined" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 참여한 여행 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      참여한 여행 ({joinedTrips.length}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {joinedTrips.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          참여한 여행이 없습니다.
                        </p>
                      ) : (
                        joinedTrips.slice(0, 5).map((trip) => (
                          <div
                            key={trip.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                          >
                            <Avatar className="h-10 w-10 rounded-lg">
                              <AvatarImage src={trip.imageUrl} alt={trip.title} />
                              <AvatarFallback>
                                <MapPin className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm line-clamp-1">{trip.title}</h5>
                              <p className="text-xs text-muted-foreground">
                                주최자: {trip.createdBy}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {trip.participants}/{trip.maxParticipants}명
                                </Badge>
                                {trip.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs">{trip.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 참여한 모임 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      참여한 모임 ({joinedMeetups.length}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {joinedMeetups.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          참여한 모임이 없습니다.
                        </p>
                      ) : (
                        joinedMeetups.slice(0, 5).map((meetup) => (
                          <div
                            key={meetup.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                          >
                            <Avatar className="h-10 w-10 rounded-lg">
                              <AvatarImage src={meetup.imageUrl} alt={meetup.title} />
                              <AvatarFallback>
                                <Users className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm line-clamp-1">{meetup.title}</h5>
                              <p className="text-xs text-muted-foreground">
                                주최자: {meetup.createdBy}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {meetup.participants}/{meetup.maxParticipants}명
                                </Badge>
                                <span className="text-xs text-muted-foreground">{meetup.date}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="points" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 포인트 가이드 */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-yellow-600" />
                      포인트 가이드
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">여행/모임 생성</span>
                        <Badge variant="secondary">+100P</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">여행/모임 참여</span>
                        <Badge variant="secondary">+50P</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">리뷰 작성</span>
                        <Badge variant="secondary">+30P</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">커뮤니티 게시글</span>
                        <Badge variant="secondary">+20P</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">댓글 작성</span>
                        <Badge variant="secondary">+10P</Badge>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">포인트 사용처</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 프리미엄 기능 해제</li>
                        <li>• 여행 상품 할인</li>
                        <li>• 굿즈 교환</li>
                        <li>• 이벤트 참여</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* 포인트 내역 */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-600" />
                      포인트 내역
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {defaultPointHistory.slice(0, 10).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                transaction.category === 'travel'
                                  ? 'text-blue-600 bg-blue-100'
                                  : transaction.category === 'community'
                                    ? 'text-purple-600 bg-purple-100'
                                    : transaction.category === 'reward'
                                      ? 'text-green-600 bg-green-100'
                                      : 'text-yellow-600 bg-yellow-100'
                              }`}
                            >
                              {getPointIcon(transaction.category)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{transaction.reason}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.timestamp).toLocaleDateString('ko-KR')}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`font-bold ${
                              transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {transaction.type === 'earned' ? '+' : '-'}
                            {transaction.amount}P
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
