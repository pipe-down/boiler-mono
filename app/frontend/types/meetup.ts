export interface Meetup {
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
  isWished?: boolean;
  urgency?: 'high' | 'medium' | 'low';
  creatorAvatar?: string;
  createdAt: string;
}
