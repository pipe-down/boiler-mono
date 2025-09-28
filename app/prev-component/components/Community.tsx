import React, { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Separator } from './ui/separator';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Award,
  MapPin,
  Users,
  Camera,
  MessageSquare,
  ThumbsUp,
  Eye,
  Plus,
} from '@/src/components/icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { CommunityPost, Comment } from '@/src/types/community';
import {
  usePosts,
  useCreatePost,
  useTogglePostBookmark,
  useTogglePostLike,
} from '@/src/hooks/api/usePosts';
import { validateAndDedupeFiles } from '@/src/lib/file-utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from '@/src/components/icons';

interface CommunityProps {
  posts?: CommunityPost[];
  onCreatePost?: (
    post: Omit<
      CommunityPost,
      'id' | 'likes' | 'comments' | 'views' | 'isLiked' | 'isBookmarked' | 'createdAt'
    >,
  ) => void;
  onLikePost?: (postId: string) => void;
  onBookmarkPost?: (postId: string) => void;
  onCommentPost?: (postId: string, content: string) => void;
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
  } | null;
}

export function Community({
  posts: propsPosts,
  onCreatePost,
  onLikePost,
  onBookmarkPost,
  onCommentPost,
  currentUser: propsCurrentUser,
}: CommunityProps = {}) {
  const { data: postsPage, error, isLoading, mutate } = usePosts({ page: 0, size: 10 });
  const { trigger: createPostMut } = useCreatePost();
  const { trigger: toggleLikeMut } = useTogglePostLike();
  const { trigger: toggleBookmarkMut } = useTogglePostBookmark();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    location: '',
    images: '',
  });
  const [modalFiles, setModalFiles] = useState<File[]>([]);

  // 기본 데이터 설정 (props > API > 빈 배열)
  const posts: CommunityPost[] = useMemo(() => {
    if (propsPosts && propsPosts.length) return propsPosts;
    const fromApi: CommunityPost[] | undefined = postsPage?.content?.map((p: any) => ({
      id: String(p.id),
      title: p.title,
      content: p.summary || p.content || '',
      category: (p.category || 'GENERAL')?.toString().toLowerCase(),
      author: { id: String(p.authorId ?? '0'), name: p.authorName || '작성자', level: 1 },
      likes: p.likeCount || 0,
      comments: p.commentCount || 0,
      views: p.viewCount || 0,
      isLiked: Boolean(p.likedByCurrentUser),
      isBookmarked: false,
      createdAt: p.createdAt || new Date().toISOString(),
      tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t?.name).filter(Boolean) : [],
    }));
    return fromApi ?? [];
  }, [propsPosts, postsPage]);

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-3xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>오류 발생</AlertTitle>
        <AlertDescription>커뮤니티 글을 불러오는 중 문제가 발생했습니다.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading && posts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse h-24 bg-muted rounded-lg" />
      </div>
    );
  }

  const handleCreatePost = async () => {
    if (onCreatePost) {
      onCreatePost({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        location: formData.location,
        images: formData.images,
      } as any);
      return;
    }
    await createPostMut({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setShowCreatePost(false);
    await mutate();
  };

  const handleLike = async (postId: string) => {
    if (onLikePost) return onLikePost(postId);
    await toggleLikeMut({ postId: Number(postId) });
    await mutate();
  };

  const handleBookmark = async (postId: string) => {
    if (onBookmarkPost) return onBookmarkPost(postId);
    await toggleBookmarkMut({ postId: Number(postId) });
    await mutate();
  };

  const currentUser = propsCurrentUser || {
    id: '1',
    name: '김여행자',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
    level: 5,
  };

  const categories = [
    { id: 'all', name: '전체', icon: '📋', enum: 'ALL' },
    { id: 'review', name: '여행후기', icon: '✈️', enum: 'TRAVEL_REVIEW' },
    { id: 'tip', name: '여행팁', icon: '💡', enum: 'TRAVEL_TIP' },
    { id: 'question', name: '질문', icon: '❓', enum: 'TRAVEL_QNA' },
    { id: 'companion', name: '동행구함', icon: '👥', enum: 'TRAVEL_COMPANION' },
    { id: 'photo', name: '사진', icon: '📸', enum: 'PHOTO' },
    { id: 'restaurant', name: '맛집', icon: '🍽️', enum: 'FOOD' },
    { id: 'accommodation', name: '숙소', icon: '🏨', enum: 'ACCOMMODATION' },
    { id: 'free', name: '자유', icon: '💬', enum: 'FREE' },
  ];

  const getFilteredPosts = () => {
    if (!posts || posts.length === 0) return [];

    let filtered = posts.filter((post) => {
      const searchMatch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.tags &&
          post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      const categoryMatch = selectedCategory === 'all' || post.category === selectedCategory;

      return searchMatch && categoryMatch;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          return b.likes - a.likes;
        case 'discussed':
          return b.comments - a.comments;
        case 'views':
          return b.views - a.views;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getFilteredPostsByCategory = (categoryId: string) => {
    if (!posts || posts.length === 0) return [];

    let filtered = posts.filter((post) => {
      const searchMatch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.tags &&
          post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      const categoryMatch = categoryId === 'all' || post.category === categoryId;

      return searchMatch && categoryMatch;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular':
          return b.likes - a.likes;
        case 'discussed':
          return b.comments - a.comments;
        case 'views':
          return b.views - a.views;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.icon || '📋';
  };

  const filteredPosts = getFilteredPosts();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            커뮤니티
          </h2>
          <p className="text-muted-foreground">여행자들과 소중한 경험을 나누어 보세요</p>
        </div>
        {/* 메인 헤더의 글쓰기 버튼은 페이지 라우팅으로 대체 (/community/new). */}
      </div>

      {/* 상단 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-lg">{posts?.length || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground">총 게시글</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="font-bold text-lg">
                {posts?.reduce((sum, post) => sum + post.likes, 0) || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">총 좋아요</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="font-bold text-lg">
                {posts?.reduce((sum, post) => sum + post.comments, 0) || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">총 댓글</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="font-bold text-lg">
                {posts?.reduce((sum, post) => sum + post.views, 0) || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">총 조회수</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setSelectedCategory(value);
        }}
      >
        {/* 카테고리 탭 */}
        <div className="space-y-4">
          {/* 탭 리스트 */}
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1 min-w-0 flex-shrink-0"
                  onClick={() => {
                    setActiveTab(category.id);
                    setSelectedCategory(category.id);
                  }}
                >
                  <span className="text-base leading-none">{category.icon}</span>
                  <span className="text-sm truncate">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
                <SelectItem value="discussed">댓글순</SelectItem>
                <SelectItem value="views">조회순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 게시글 목록 */}
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4 mt-6">
            {getFilteredPostsByCategory(category.id).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-lg font-medium mb-2">{category.name} 게시글이 없습니다</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? '검색 결과가 없습니다.'
                      : `첫 번째 ${category.name} 게시글을 작성해보세요!`}
                  </p>
                  {currentUser && !searchQuery && (
                    <Button
                      className="bg-slate-900 hover:bg-slate-800"
                      onClick={() => {
                        // 모달은 유지하지만 서버가 요구하는 enum 값을 저장
                        setFormData((prev) => ({
                          ...prev,
                          category: (category as any).enum || 'FREE',
                        }));
                        setShowCreatePost(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      글쓰기
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {getFilteredPostsByCategory(category.id).map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => handleLike(post.id)}
                    onBookmark={() => handleBookmark(post.id)}
                    onComment={() => setSelectedPost(post)}
                    formatDate={formatDate}
                    getCategoryName={getCategoryName}
                    getCategoryIcon={getCategoryIcon}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 글쓰기 모달 */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => {
          setShowCreatePost(false);
          setFormData({
            title: '',
            content: '',
            category: '',
            tags: '',
            location: '',
            images: '',
          });
          setModalFiles([]);
        }}
        onSubmit={async (p) => {
          await createPostMut({
            title: p.title,
            content: p.content,
            category: p.category,
            tags: p.tags,
            files: p.files,
          });
          setShowCreatePost(false);
          await mutate();
        }}
        categories={categories.filter((cat) => cat.id !== 'all')}
        currentUser={currentUser}
        initialData={formData}
      />

      {/* 게시글 상세 모달 */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={() => handleLike(selectedPost.id)}
          onBookmark={() => handleBookmark(selectedPost.id)}
          onComment={async (content) => {
            if (onCommentPost) {
              onCommentPost(selectedPost.id, content);
            } else {
              // 기본 처리: 로컬 카운트 증가 후 목록 갱신
              setSelectedPost((prev) => (prev ? { ...prev, comments: prev.comments + 1 } : null));
              await mutate();
            }
          }}
          currentUser={currentUser}
          formatDate={formatDate}
          getCategoryName={getCategoryName}
          getCategoryIcon={getCategoryIcon}
        />
      )}
    </div>
  );
}

// 게시글 카드 컴포넌트
interface PostCardProps {
  post: CommunityPost;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  formatDate: (date: string) => string;
  getCategoryName: (categoryId: string) => string;
  getCategoryIcon: (categoryId: string) => string;
}

import Link from 'next/link';

function PostCard({
  post,
  onLike,
  onBookmark,
  onComment,
  formatDate,
  getCategoryName,
  getCategoryIcon,
}: PostCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onComment}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{post.author.name}</span>
              <Badge variant="secondary" className="text-xs">
                Lv.{post.author.level}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getCategoryIcon(post.category)} {getCategoryName(post.category)}
              </Badge>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
            </div>

            {/* 제목 */}
            <h3 className="font-medium mb-2 line-clamp-1">{post.title}</h3>

            {/* 내용 */}
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{post.content}</p>

            {/* 이미지 */}
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                {post.images.slice(0, 3).map((image, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={image}
                      alt={`${post.title} 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 2 && post.images!.length > 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
                        +{post.images!.length - 3}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 태그 */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 위치 정보 */}
            {post.location && (
              <div className="flex items-center gap-1 mb-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{post.location}</span>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComment();
                }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark();
                }}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  post.isBookmarked ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                <Eye className="h-4 w-4" />
                <span>{post.views}</span>
              </div>

              <Link
                href={`/community/${post.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-600 hover:underline"
              >
                자세히
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 글쓰기 모달 컴포넌트
interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
    files?: File[];
  }) => void;
  categories: Array<{ id: string; name: string; icon: string }>;
  currentUser: { id: string; name: string; avatar?: string; level: number } | null;
  initialData?: {
    title: string;
    content: string;
    category: string;
    tags: string;
    location: string;
    images: string;
  };
}

function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  currentUser,
  initialData,
}: CreatePostModalProps) {
  const [formData, setFormData] = useState(
    initialData || {
      title: '',
      content: '',
      category: '',
      tags: '',
      location: '',
      images: '',
    },
  );
  const [files, setFiles] = useState<File[]>([]);

  // initialData가 변경될 때 formData 업데이트
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.category || !currentUser) return;

    onSubmit({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags
        ? formData.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
      files,
    });

    setFormData({
      title: '',
      content: '',
      category: '',
      tags: '',
      location: '',
      images: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-describedby="create-post-description">
        <DialogHeader>
          <DialogTitle>새 게시글 작성</DialogTitle>
        </DialogHeader>
        <div id="create-post-description" className="sr-only">
          커뮤니티에 새로운 게시글을 작성할 수 있습니다.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">카테고리 *</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2">위치 (선택)</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="예: 제주도, 서울 강남구"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2">제목 *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block mb-2">내용 *</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="내용을 입력하세요"
              rows={6}
              required
            />
          </div>

          <div>
            <label className="block mb-2">첨부파일 (선택, 최대 10개, 개별 10MB)</label>
            <Input
              type="file"
              multiple
              onChange={(e) => {
                const list = Array.from(e.target.files || []);
                setFiles(validateAndDedupeFiles(list, files));
              }}
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, idx) => (
                  <li key={idx} className="text-sm flex items-center justify-between gap-2">
                    <span className="truncate">
                      {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      제거
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block mb-2">태그 (선택)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="태그를 쉼표로 구분하여 입력하세요"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">게시하기</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 게시글 상세 모달 컴포넌트
interface PostDetailModalProps {
  post: CommunityPost;
  isOpen: boolean;
  onClose: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onComment: (content: string) => void;
  currentUser: { id: string; name: string; avatar?: string; level: number } | null;
  formatDate: (date: string) => string;
  getCategoryName: (categoryId: string) => string;
  getCategoryIcon: (categoryId: string) => string;
}

function PostDetailModal({
  post,
  isOpen,
  onClose,
  onLike,
  onBookmark,
  onComment,
  currentUser,
  formatDate,
  getCategoryName,
  getCategoryIcon,
}: PostDetailModalProps) {
  const [commentText, setCommentText] = useState('');

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(commentText);
    setCommentText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-auto"
        aria-describedby="post-detail-description"
      >
        <DialogHeader>
          <DialogTitle>{post.title}</DialogTitle>
        </DialogHeader>
        <div id="post-detail-description" className="sr-only">
          게시글의 상세 내용과 댓글을 확인할 수 있습니다.
        </div>

        <div className="space-y-6">
          {/* 게시글 정보 */}
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{post.author.name}</span>
                <Badge variant="secondary" className="text-xs">
                  Lv.{post.author.level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getCategoryIcon(post.category)} {getCategoryName(post.category)}
                </Badge>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">조회 {post.views}</span>
              </div>

              {post.location && (
                <div className="flex items-center gap-1 mb-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{post.location}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 게시글 내용 */}
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* 이미지 */}
            {post.images && post.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.images.map((image, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={image}
                      alt={`${post.title} 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 태그 */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 액션 버튼 */}
          <div className="flex items-center gap-6">
            <button
              onClick={onLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                post.isLiked ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50 text-muted-foreground'
              }`}
            >
              <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>좋아요 {post.likes}</span>
            </button>

            <button
              onClick={onBookmark}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                post.isBookmarked
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50 text-muted-foreground'
              }`}
            >
              <Bookmark className={`h-5 w-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
              <span>북마크</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-muted-foreground transition-colors">
              <Share2 className="h-5 w-5" />
              <span>공유</span>
            </button>
          </div>

          <Separator />

          {/* 댓글 섹션 */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              댓글 {post.comments}개
            </h4>

            {/* 댓글 작성 */}
            {currentUser && (
              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={!commentText.trim()}>
                      댓글 작성
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* 예시 댓글 */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>김</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">김댓글</span>
                    <Badge variant="secondary" className="text-xs">
                      Lv.3
                    </Badge>
                    <span className="text-xs text-muted-foreground">2시간 전</span>
                  </div>
                  <p className="text-sm">
                    정말 도움이 되는 글이네요! 저도 비슷한 경험이 있어서 공감됩니다.
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500">
                      <ThumbsUp className="h-3 w-3" />
                      <span>12</span>
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-blue-500">
                      답글
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
