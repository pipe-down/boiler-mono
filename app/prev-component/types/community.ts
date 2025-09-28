export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
  };
  images?: string[];
  likes: number;
  comments: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  tags: string[];
  location?: string;
  tripId?: string;
  meetupId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
  };
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}
