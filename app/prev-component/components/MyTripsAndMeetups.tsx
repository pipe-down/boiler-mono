import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  Settings,
  MoreVertical,
  Share2,
  Edit3,
  Trash2,
  UserPlus,
  MessageCircle,
  Star,
  TrendingUp,
  Award,
  Filter,
  Search,
  Plus,
} from '@/src/components/icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Trip {
  id: string;
  title: string;
  destination: string;
  dates: string;
  participants: number;
  maxParticipants: number;
  imageUrl: string;
  description: string;
  createdBy: string;
  categories: string[];
  rating?: number;
  reviewCount?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

interface Meetup {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  participants: number;
  maxParticipants: number;
  imageUrl: string;
  description: string;
  createdBy: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

interface MyTripsAndMeetupsProps {
  isLoading?: boolean;
  error?: any;
  hostedTrips: Trip[];
  hostedMeetups: Meetup[];
  joinedTrips: Trip[];
  joinedMeetups: Meetup[];
  onTripClick: (trip: Trip) => void;
  onMeetupClick: (meetup: Meetup) => void;
  onEditTrip: (trip: Trip) => void;
  onEditMeetup: (meetup: Meetup) => void;
  onCancelTrip: (tripId: string) => void;
  onCancelMeetup: (meetupId: string) => void;
  onInviteParticipants: (id: string, type: 'trip' | 'meetup') => void;
  onCreateTrip: () => void;
  onCreateMeetup: () => void;
}

export function MyTripsAndMeetups({
  isLoading,
  error,
  hostedTrips,
  hostedMeetups,
  joinedTrips,
  joinedMeetups,
  onTripClick,
  onMeetupClick,
  onEditTrip,
  onEditMeetup,
  onCancelTrip,
  onCancelMeetup,
  onInviteParticipants,
  onCreateTrip,
  onCreateMeetup,
}: MyTripsAndMeetupsProps) {
  const [activeTab, setActiveTab] = useState('hosted');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            예정됨
          </Badge>
        );
      case 'ongoing':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            진행중
          </Badge>
        );
      case 'completed':
        return <Badge variant="secondary">완료됨</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'border-l-blue-500';
      case 'ongoing':
        return 'border-l-green-500';
      case 'completed':
        return 'border-l-gray-500';
      case 'cancelled':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy.MM.dd', { locale: ko });
    } catch {
      return dateString;
    }
  };

  const TripCard = ({ trip, isHost = false }: { trip: Trip; isHost?: boolean }) => (
    <Card
      className={`border-l-4 ${getStatusColor(trip.status)} hover:shadow-md transition-shadow cursor-pointer`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-slate-900 line-clamp-1">{trip.title}</h3>
              {getStatusBadge(trip.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{trip.destination}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{trip.dates}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {trip.participants}/{trip.maxParticipants}명
                </span>
              </div>
              {trip.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{trip.rating}</span>
                  <span className="text-slate-400">({trip.reviewCount || 0})</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isHost && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInviteParticipants(trip.id, 'trip');
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTrip(trip);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="p-2"
              onClick={(e) => {
                e.stopPropagation();
                // 더보기 메뉴
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {trip.categories.slice(0, 3).map((category) => (
            <Badge key={category} variant="outline" className="text-xs">
              {category}
            </Badge>
          ))}
        </div>

        {isHost && trip.status === 'upcoming' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onInviteParticipants(trip.id, 'trip');
              }}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              참가자 초대
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEditTrip(trip);
              }}
            >
              <Settings className="h-4 w-4 mr-1" />
              관리
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const MeetupCard = ({ meetup, isHost = false }: { meetup: Meetup; isHost?: boolean }) => (
    <Card
      className={`border-l-4 ${getStatusColor(meetup.status)} hover:shadow-md transition-shadow cursor-pointer`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-slate-900 line-clamp-1">{meetup.title}</h3>
              {getStatusBadge(meetup.status)}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{meetup.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{meetup.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{meetup.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {meetup.participants}/{meetup.maxParticipants}명
                </span>
              </div>
              {meetup.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{meetup.rating}</span>
                  <span className="text-slate-400">({meetup.reviewCount || 0})</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isHost && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInviteParticipants(meetup.id, 'meetup');
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditMeetup(meetup);
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="p-2"
              onClick={(e) => {
                e.stopPropagation();
                // 더보기 메뉴
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Badge variant="outline" className="text-xs mb-3">
          {meetup.category}
        </Badge>

        {isHost && meetup.status === 'upcoming' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onInviteParticipants(meetup.id, 'meetup');
              }}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              참가자 초대
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEditMeetup(meetup);
              }}
            >
              <Settings className="h-4 w-4 mr-1" />
              관리
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">내 여행/모임</h1>
          <p className="text-muted-foreground">내가 주최하고 참여한 여행과 모임을 관리해보세요.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCreateTrip} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            여행 만들기
          </Button>
          <Button onClick={onCreateMeetup} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            모임 만들기
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          내 활동을 불러오지 못했습니다. 잠시 후 다시 시도하세요.
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <div className="h-7 w-10 bg-accent animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{hostedTrips.length}</p>
                )}
                <p className="text-sm text-slate-600">주최한 여행</p>
              </div>
              <MapPin className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <div className="h-7 w-10 bg-accent animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{hostedMeetups.length}</p>
                )}
                <p className="text-sm text-slate-600">주최한 모임</p>
              </div>
              <Users className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <div className="h-7 w-10 bg-accent animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{joinedTrips.length}</p>
                )}
                <p className="text-sm text-slate-600">참여한 여행</p>
              </div>
              <TrendingUp className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <div className="h-7 w-10 bg-accent animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{joinedMeetups.length}</p>
                )}
                <p className="text-sm text-slate-600">참여한 모임</p>
              </div>
              <Award className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hosted" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            내가 주최한
          </TabsTrigger>
          <TabsTrigger value="joined" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            내가 참여한
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hosted" className="space-y-6 m-0">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">내가 주최한 여행</h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 w-2/3 bg-accent animate-pulse rounded" />
                        <div className="flex gap-4 text-sm">
                          <div className="h-4 w-24 bg-accent animate-pulse rounded" />
                          <div className="h-4 w-28 bg-accent animate-pulse rounded" />
                          <div className="h-4 w-20 bg-accent animate-pulse rounded" />
                        </div>
                        <div className="h-8 w-48 bg-accent animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : hostedTrips.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="font-medium mb-2">아직 주최한 여행이 없습니다</h4>
                    <p className="text-muted-foreground text-center mb-4">
                      새로운 여행을 만들어 사람들과 함께 특별한 추억을 만들어보세요.
                    </p>
                    <Button onClick={onCreateTrip}>
                      <Plus className="h-4 w-4 mr-2" />첫 여행 만들기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hostedTrips.map((trip) => (
                    <div key={trip.id} onClick={() => onTripClick(trip)}>
                      <TripCard trip={trip} isHost={true} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-4">내가 주최한 모임</h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 w-2/3 bg-accent animate-pulse rounded" />
                        <div className="flex gap-4 text-sm">
                          <div className="h-4 w-24 bg-accent animate-pulse rounded" />
                          <div className="h-4 w-28 bg-accent animate-pulse rounded" />
                          <div className="h-4 w-20 bg-accent animate-pulse rounded" />
                        </div>
                        <div className="h-8 w-48 bg-accent animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : hostedMeetups.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="font-medium mb-2">아직 주최한 모임이 없습니다</h4>
                    <p className="text-muted-foreground text-center mb-4">
                      새로운 모임을 만들어 동네 사람들과 함께 활동해보세요.
                    </p>
                    <Button onClick={onCreateMeetup} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />첫 모임 만들기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hostedMeetups.map((meetup) => (
                    <div key={meetup.id} onClick={() => onMeetupClick(meetup)}>
                      <MeetupCard meetup={meetup} isHost={true} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="joined" className="space-y-6 m-0">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-4">참여한 여행</h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 w-2/3 bg-accent animate-pulse rounded" />
                        <div className="flex gap-4 text-sm">
                          <div className="h-4 w-24 bg-accent animate-pulse rounded" />
                          <div className="h-4 w-28 bg-accent animate-pulse rounded" />
                          <div className="h-4 w-20 bg-accent animate-pulse rounded" />
                        </div>
                        <div className="h-8 w-48 bg-accent animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : joinedTrips.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="font-medium mb-2">참여한 여행이 없습니다</h4>
                    <p className="text-muted-foreground text-center">
                      관심있는 여행을 찾아 참여해보세요.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joinedTrips.map((trip) => (
                    <div key={trip.id} onClick={() => onTripClick(trip)}>
                      <TripCard trip={trip} isHost={false} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-4">참여한 모임</h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 w-2/3 bg-accent animate-pulse rounded" />
                        <div className="flex gap-4 text-sm">
                          <div className="h-4 w-24 bg-accent animate-pulse rounded" />
                          <div className="h-4 w-28 bg-accent animate-pulse rounded" />
                          <div className="h-4 w-20 bg-accent animate-pulse rounded" />
                        </div>
                        <div className="h-8 w-48 bg-accent animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : joinedMeetups.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="font-medium mb-2">참여한 모임이 없습니다</h4>
                    <p className="text-muted-foreground text-center">
                      관심있는 모임을 찾아 참여해보세요.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joinedMeetups.map((meetup) => (
                    <div key={meetup.id} onClick={() => onMeetupClick(meetup)}>
                      <MeetupCard meetup={meetup} isHost={false} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
