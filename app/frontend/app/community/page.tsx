'use client';
export const dynamic = 'force-dynamic';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Alert, AlertDescription, AlertTitle } from '@chatstack/ui';
import { Community } from '@/components/Community';
import type { CommunityPost } from '@/types/community';
import { usePosts } from '@/hooks/api/usePosts';
import { AlertTriangle } from '@chatstack/ui';

export default function CommunityPage() {
  const router = useRouter();
  // 1) 실제 게시글 목록 로딩
  const { data: postsPage, error, isLoading } = usePosts({ page: 0, size: 10 });

  // 2) API 응답을 CommunityPost로 매핑
  const posts: CommunityPost[] = useMemo(() => {
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
  }, [postsPage]);

  // 3) 에러/로딩 상태 처리
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 mb-2">커뮤니티</h1>
            <p className="text-muted-foreground">게시글/댓글/피드가 곧 표시됩니다.</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            ← 메인으로
          </Button>
        </div>
        <div className="animate-pulse h-24 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">커뮤니티</h1>
          <p className="text-muted-foreground">다양한 커뮤니티 게시글을 확인해 보세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/community/new')}>
            + 새 글
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            ← 메인으로
          </Button>
        </div>
      </div>

      {/* 4) 실제 컴포넌트 렌더링 */}
      <Community posts={posts} />
    </>
  );
}
