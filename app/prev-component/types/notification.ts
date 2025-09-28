export interface Notification {
  id: string;
  type:
    | 'trip_joined'
    | 'meetup_joined'
    | 'review'
    | 'message'
    | 'reminder'
    | 'trip_full'
    | 'new_trip'
    | 'new_meetup';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  tripId?: string;
  meetupId?: string;
  actionUrl?: string;
}
