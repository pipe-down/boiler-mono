import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import {
  Heart,
  MapPin,
  Users,
  Calendar,
  Star,
  Trophy,
  Target,
  Clock,
  Edit3,
  Settings,
} from '@/src/components/icons';
import type { Trip } from '@/src/types/trip';
import type { Meetup } from '@/src/types/meetup';

interface MyPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    location?: string;
    joinDate: string;
    level: number;
    experience: number;
    nextLevelExp: number;
  };
  myTrips: Trip[];
  myMeetups: Meetup[];
  joinedTrips: Trip[];
  joinedMeetups: Meetup[];
  wishlistTrips: Trip[];
  wishlistMeetups: Meetup[];
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    unlocked: boolean;
    unlockedAt?: string;
  }>;
}

export function MyPage({
  user,
  myTrips,
  myMeetups,
  joinedTrips,
  joinedMeetups,
  wishlistTrips,
  wishlistMeetups,
  achievements,
}: MyPageProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const totalOrganized = myTrips.length + myMeetups.length;
  const totalJoined = joinedTrips.length + joinedMeetups.length;
  const totalWishlisted = wishlistTrips.length + wishlistMeetups.length;
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  const expProgress = user?.nextLevelExp ? (user.experience / user.nextLevelExp) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 사용자 프로필 헤더 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center sm:items-start">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mb-4">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-lg">
                  {user?.name ? user.name.split('').slice(0, 2).join('') : 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                프로필 편집
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2>{user?.name || '사용자'}</h2>
                  <Badge variant="secondary">Lv.{user?.level || 1}</Badge>
                </div>
                {user.bio && <p className="text-muted-foreground mb-2">{user.bio}</p>}
                {user.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
              </div>

              {/* 레벨 진행률 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>경험치</span>
                  <span>
                    {user?.experience || 0} / {user?.nextLevelExp || 100} XP
                  </span>
                </div>
                <Progress value={expProgress} className="h-2" />
              </div>

              {/* 주요 통계 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalOrganized}</div>
                  <div className="text-sm text-muted-foreground">주최</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalJoined}</div>
                  <div className="text-sm text-muted-foreground">참여</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalWishlisted}</div>
                  <div className="text-sm text-muted-foreground">찜한 개수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
                  <div className="text-sm text-muted-foreground">성취</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 메뉴 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="activities">내 활동</TabsTrigger>
          <TabsTrigger value="wishlist">찜 목록</TabsTrigger>
          <TabsTrigger value="achievements">성취</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 최근 주최한 여행/모임 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  최근 주최한 활동
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...myTrips.slice(0, 2), ...myMeetups.slice(0, 2)].map((item) => (
                  <div
                    key={`recent-hosted-${'destination' in item ? 'trip' : 'meetup'}-${item.id}`}
                    className="flex items-center gap-3 p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={item.imageUrl} alt={item.title} />
                      <AvatarFallback>
                        {'destination' in item ? (
                          <MapPin className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.participants}/{item.maxParticipants}명 참여
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {'destination' in item ? '여행' : '모임'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 최근 참여한 활동 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  최근 참여한 활동
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...joinedTrips.slice(0, 2), ...joinedMeetups.slice(0, 2)].map((item) => (
                  <div
                    key={`recent-joined-${'destination' in item ? 'trip' : 'meetup'}-${item.id}`}
                    className="flex items-center gap-3 p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={item.imageUrl} alt={item.title} />
                      <AvatarFallback>
                        {'destination' in item ? (
                          <MapPin className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">by {item.createdBy}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {item.rating?.toFixed(1) || '—'}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Tabs defaultValue="organized" className="space-y-4">
            <TabsList>
              <TabsTrigger value="organized">주최한 활동</TabsTrigger>
              <TabsTrigger value="joined">참여한 활동</TabsTrigger>
            </TabsList>

            <TabsContent value="organized" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>주최한 여행</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myTrips.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        주최한 여행이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {myTrips.map((trip) => (
                          <ActivityItem key={`my-trip-${trip.id}`} item={trip} type="trip" />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>주최한 모임</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myMeetups.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        주최한 모임이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {myMeetups.map((meetup) => (
                          <ActivityItem
                            key={`my-meetup-${meetup.id}`}
                            item={meetup}
                            type="meetup"
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="joined" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>참여한 여행</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {joinedTrips.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        참여한 여행이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {joinedTrips.map((trip) => (
                          <ActivityItem
                            key={`joined-trip-${trip.id}`}
                            item={trip}
                            type="trip"
                            showHost
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>참여한 모임</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {joinedMeetups.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        참여한 모임이 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {joinedMeetups.map((meetup) => (
                          <ActivityItem
                            key={`joined-meetup-${meetup.id}`}
                            item={meetup}
                            type="meetup"
                            showHost
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  찜한 여행
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wishlistTrips.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">찜한 여행이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {wishlistTrips.map((trip) => (
                      <ActivityItem
                        key={`wishlist-trip-${trip.id}`}
                        item={trip}
                        type="trip"
                        showHeart
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  찜한 모임
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wishlistMeetups.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">찜한 모임이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {wishlistMeetups.map((meetup) => (
                      <ActivityItem
                        key={`wishlist-meetup-${meetup.id}`}
                        item={meetup}
                        type="meetup"
                        showHeart
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'opacity-50'}`}
              >
                <CardContent className="pt-6 text-center">
                  <div
                    className={`mx-auto mb-4 ${achievement.unlocked ? 'text-yellow-600' : 'text-muted-foreground'}`}
                  >
                    {achievement.icon}
                  </div>
                  <h3 className="font-medium mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                  {achievement.unlocked ? (
                    <Badge variant="default" className="bg-yellow-500">
                      <Trophy className="h-3 w-3 mr-1" />
                      달성
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      미달성
                    </Badge>
                  )}
                  {achievement.unlockedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(achievement.unlockedAt).toLocaleDateString('ko-KR')} 달성
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ActivityItemProps {
  item: Trip | Meetup;
  type: 'trip' | 'meetup';
  showHost?: boolean;
  showHeart?: boolean;
}

function ActivityItem({ item, type, showHost, showHeart }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={item.imageUrl} alt={item.title} />
        <AvatarFallback>
          {type === 'trip' ? <MapPin className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium line-clamp-1">{item.title}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {type === 'trip' ? (
            <span>{(item as Trip).destination}</span>
          ) : (
            <span>{(item as Meetup).location}</span>
          )}
          <span>•</span>
          <span>
            {item.participants}/{item.maxParticipants}명
          </span>
        </div>
        {showHost && <p className="text-xs text-muted-foreground">by {item.createdBy}</p>}
      </div>
      <div className="flex items-center gap-2">
        {showHeart && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}
        {item.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{item.rating.toFixed(1)}</span>
          </div>
        )}
        <Badge variant="outline" className="text-xs">
          {type === 'trip' ? '여행' : '모임'}
        </Badge>
      </div>
    </div>
  );
}
