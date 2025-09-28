import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Star,
  Heart,
  Award,
  Target,
} from '@/src/components/icons';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    totalTrips: number;
    totalMeetups: number;
    totalUsers: number;
    totalReviews: number;
    averageRating: number;
    popularDestinations: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
    monthlyActivity: Array<{
      month: string;
      trips: number;
      meetups: number;
    }>;
    categoryDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    userEngagement: {
      activeUsers: number;
      returningUsers: number;
      newSignups: number;
    };
  };
}

export function Dashboard({ isOpen, onClose, stats: propsStats }: DashboardProps) {
  // 기본 통계 데이터 설정
  const defaultStats = propsStats || {
    totalTrips: 156,
    totalMeetups: 89,
    totalUsers: 1247,
    totalReviews: 342,
    averageRating: 4.6,
    popularDestinations: [
      { name: '제주도', count: 45, percentage: 85 },
      { name: '부산', count: 32, percentage: 65 },
      { name: '강릉', count: 28, percentage: 55 },
      { name: '경주', count: 24, percentage: 48 },
      { name: '여수', count: 19, percentage: 38 },
    ],
    monthlyActivity: [
      { month: '1월', trips: 12, meetups: 8 },
      { month: '2월', trips: 15, meetups: 12 },
      { month: '3월', trips: 18, meetups: 15 },
      { month: '4월', trips: 22, meetups: 18 },
      { month: '5월', trips: 28, meetups: 25 },
      { month: '6월', trips: 35, meetups: 30 },
    ],
    categoryDistribution: [
      { name: '자연', value: 35, color: '#8884d8' },
      { name: '문화', value: 25, color: '#82ca9d' },
      { name: '음식', value: 20, color: '#ffc658' },
      { name: '액티비티', value: 15, color: '#ff7300' },
      { name: '휴양', value: 5, color: '#8dd1e1' },
    ],
    userEngagement: {
      activeUsers: 842,
      returningUsers: 567,
      newSignups: 126,
    },
  };

  // 기본 활동 피드 데이터
  const defaultActivities = [
    {
      id: '1',
      type: 'trip_created' as const,
      message: '김여행자님이 새로운 제주도 여행을 생성했습니다.',
      timestamp: '2024-03-15T10:00:00Z',
      user: {
        name: '김여행자',
        avatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      },
    },
    {
      id: '2',
      type: 'meetup_created' as const,
      message: '박모임님이 한강 자전거 라이딩 모임을 만들었습니다.',
      timestamp: '2024-03-14T16:30:00Z',
      user: {
        name: '박모임',
        avatar:
          'https://images.unsplash.com/photo-1494790108755-2616b612b913?w=100&h=100&fit=crop&crop=face',
      },
    },
    {
      id: '3',
      type: 'user_joined' as const,
      message: '이참여님이 부산 맛집 투어에 참여했습니다.',
      timestamp: '2024-03-14T14:15:00Z',
      user: {
        name: '이참여',
        avatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      },
    },
    {
      id: '4',
      type: 'review_added' as const,
      message: '최후기님이 강릉 여행에 리뷰를 남겼습니다.',
      timestamp: '2024-03-13T20:45:00Z',
      user: {
        name: '최후기',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      },
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-auto"
        aria-describedby="dashboard-description"
      >
        <DialogHeader>
          <DialogTitle>대시보드</DialogTitle>
          <DialogDescription id="dashboard-description">
            플랫폼의 전체 통계와 활동 현황을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 주요 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="총 여행"
              value={defaultStats.totalTrips}
              icon={<MapPin className="h-4 w-4" />}
              trend="+12%"
              trendUp={true}
            />
            <StatCard
              title="총 모임"
              value={defaultStats.totalMeetups}
              icon={<Users className="h-4 w-4" />}
              trend="+8%"
              trendUp={true}
            />
            <StatCard
              title="평균 평점"
              value={defaultStats.averageRating.toFixed(1)}
              icon={<Star className="h-4 w-4" />}
              trend="+0.2"
              trendUp={true}
            />
            <StatCard
              title="총 리뷰"
              value={defaultStats.totalReviews}
              icon={<Award className="h-4 w-4" />}
              trend="+23%"
              trendUp={true}
            />
          </div>

          {/* 차트 섹션 */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">활동 통계</TabsTrigger>
              <TabsTrigger value="destinations">인기 목적지</TabsTrigger>
              <TabsTrigger value="categories">카테고리</TabsTrigger>
              <TabsTrigger value="engagement">사용자 참여</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>월별 활동</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={defaultStats.monthlyActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="trips" fill="#8884d8" name="여행" />
                        <Bar dataKey="meetups" fill="#82ca9d" name="모임" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <ActivityFeed activities={defaultActivities} />
              </div>
            </TabsContent>

            <TabsContent value="destinations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>인기 여행지</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {defaultStats.popularDestinations.map((destination, index) => (
                      <div key={destination.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {index + 1}. {destination.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {destination.count}회
                          </span>
                        </div>
                        <Progress value={destination.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={defaultStats.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(entry: any) =>
                          `${entry.name} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {defaultStats.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {defaultStats.userEngagement.activeUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">이번 주</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">재방문 사용자</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {defaultStats.userEngagement.returningUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">이번 달</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">신규 가입</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {defaultStats.userEngagement.newSignups}
                    </div>
                    <p className="text-xs text-muted-foreground">이번 달</p>
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

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium">{title}</p>
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p
              className={`text-xs flex items-center gap-1 ${
                trendUp ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className={`h-3 w-3 ${!trendUp ? 'rotate-180' : ''}`} />
              {trend} 이번 달
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 간단한 활동 피드 컴포넌트
export function ActivityFeed({
  activities,
}: {
  activities: Array<{
    id: string;
    type: 'trip_created' | 'meetup_created' | 'user_joined' | 'review_added';
    message: string;
    timestamp: string;
    user: {
      name: string;
      avatar?: string;
    };
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 활동</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
              <AvatarFallback className="text-xs">{activity.user.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{activity.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(activity.timestamp).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
