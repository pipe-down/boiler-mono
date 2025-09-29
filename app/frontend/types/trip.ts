export interface Trip {
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
  isWished?: boolean;
  urgency?: 'high' | 'medium' | 'low';
  creatorAvatar?: string;
  createdAt: string;
}
