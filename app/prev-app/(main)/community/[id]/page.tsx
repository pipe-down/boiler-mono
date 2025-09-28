'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { usePost } from '@/src/hooks/api/usePosts';
import { useComments, useCreateComment } from '@/src/hooks/api/useComments';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { MentionTextarea } from '@/src/components/mentions/MentionTextarea';
import { Separator } from '@/src/components/ui/separator';
import { toast } from 'sonner';
import { CommentsThread } from '@/src/components/CommentsThread';
import { Dialog, DialogContent } from '@/src/components/ui/dialog';
import Image from 'next/image';

export default function CommunityPostDetailPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const id = Number(params?.id || 0);
  const {
    data: post,
    isLoading: postLoading,
    error: postError,
    mutate,
  } = usePost(Number.isFinite(id) ? id : undefined);
  const commentsState = useComments(Number.isFinite(id) ? id : 0, 20) as any;
  const { items: comments, mutate: mutateComments, setSize, size, isReachingEnd } = commentsState;
  const createComment = useCreateComment(Number.isFinite(id) ? id : 0);

  const [content, setContent] = useState('');

  // Derived fields computed early so hooks can stay above early returns
  const title = (post as any)?.title ?? (post as any)?.data?.title ?? '';
  const contentBody = (post as any)?.content ?? (post as any)?.data?.content ?? '';
  const likeCount = (post as any)?.likeCount ?? (post as any)?.data?.likeCount ?? 0;
  const likedByMe = Boolean(
    (post as any)?.likedByCurrentUser ?? (post as any)?.data?.likedByCurrentUser,
  );
  const bookmarkCount = (post as any)?.bookmarkCount ?? 0;
  const bookmarkedByMe = Boolean(
    (post as any)?.bookmarkedByCurrentUser ?? (post as any)?.data?.bookmarkedByCurrentUser,
  );
  const category = ((post as any)?.category ?? '').toString();
  const tags: string[] = Array.isArray((post as any)?.tags)
    ? (post as any).tags.map((t: any) => t?.name || t).filter(Boolean)
    : [];
  const attachments: any[] = (post as any)?.attachments ?? (post as any)?.data?.attachments ?? [];
  const imageUrls: string[] = (attachments || [])
    .map((a: any) => a?.downloadUri || a?.url || a?.downloadURL)
    .filter((u: any) => typeof u === 'string' && /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(u));
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  // 키보드 네비게이션
  useEffect(() => {
    if (!lightbox.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox((s) => ({ ...s, open: false }));
      if (e.key === 'ArrowRight')
        setLightbox((s) => ({ ...s, index: (s.index + 1) % Math.max(1, imageUrls.length) }));
      if (e.key === 'ArrowLeft')
        setLightbox((s) => ({
          ...s,
          index: (s.index - 1 + Math.max(1, imageUrls.length)) % Math.max(1, imageUrls.length),
        }));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox.open, imageUrls.length]);

  useEffect(() => {
    if (postError) toast.error('게시글을 불러오지 못했습니다.');
  }, [postError]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await createComment.trigger({ content: content.trim() });
      setContent('');
      await mutateComments();
    } catch (e: any) {
      toast.error('댓글 작성 실패', { description: e?.response?.data?.message });
    }
  };

  if (postLoading && !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse h-24 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">게시글을 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => router.push('/community')}>
              ← 목록으로
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  const onToggleLike = async () => {
    try {
      // optimistic: toggle and +/-1
      await mutate(
        (prev: any) => ({
          ...(prev || {}),
          likeCount: (prev?.likeCount ?? 0) + (likedByMe ? -1 : 1),
          likedByCurrentUser: !likedByMe,
        }),
        { revalidate: false },
      );
      const res = await fetch(`/api/v1/posts/${id}/like/toggle`, { method: 'PUT' });
      if (!res.ok) throw new Error('toggle failed');
      await mutate();
    } catch (e: any) {
      toast.error('좋아요 처리 실패');
      await mutate();
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다');
    } catch (_) {
      toast.error('클립보드 복사 실패');
    }
  };

  const onToggleBookmark = async () => {
    try {
      // optimistic
      await mutate(
        (prev: any) => ({
          ...(prev || {}),
          bookmarkCount: (prev?.bookmarkCount ?? 0) + (bookmarkedByMe ? -1 : 1),
          bookmarkedByCurrentUser: !bookmarkedByMe,
        }),
        { revalidate: false },
      );

      const res = await fetch(`/api/v1/posts/${id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('toggle bookmark failed');
      await mutate();
      toast.success('북마크 상태가 변경되었습니다');
    } catch (e: any) {
      toast.error('북마크 처리 실패');
      await mutate();
    }
  };

  const sharePage = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title, text: title, url: window.location.href });
      } else {
        await copyLink();
      }
    } catch (_) {
      /* user cancelled or unsupported */
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {category && (
            <Badge variant="outline" className="text-xs capitalize">
              {category.toLowerCase()}
            </Badge>
          )}
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sharePage}>
            공유
          </Button>
          <Button variant="outline" onClick={() => router.push('/community')}>
            ← 목록
          </Button>
        </div>
      </div>

      {/* 본문 */}
      <Card className="mb-4">
        <CardContent className="py-6">
          <div className="prose max-w-none whitespace-pre-wrap">{contentBody}</div>
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {imageUrls.map((u, i) => (
                <button
                  key={u}
                  type="button"
                  className="aspect-video rounded overflow-hidden ring-1 ring-border hover:opacity-90"
                  onClick={() => setLightbox({ open: true, index: i })}
                >
                  <img src={u} alt={`attachment-${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((t) => (
                <Badge key={t} variant="secondary">
                  #{t}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-4">
            <Button size="sm" variant={likedByMe ? 'secondary' : 'outline'} onClick={onToggleLike}>
              좋아요 {likeCount}
            </Button>
            <Button size="sm" variant={bookmarkedByMe ? 'secondary' : 'outline'} onClick={onToggleBookmark}>
              북마크 {bookmarkCount}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const el = document.getElementById('comments');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              댓글로 이동
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <section id="comments">
        <h2 className="text-lg font-medium mb-3">댓글</h2>
        <form onSubmit={onSubmit} className="mb-4 space-y-2">
          <MentionTextarea
            value={content}
            onChange={setContent}
            placeholder="댓글을 입력하세요... (@사용자명 자동완성)"
            candidates={(() => {
              const freq = new Map<string, number>();
              (comments || []).forEach((c: any) => {
                const n = c?.authorName;
                if (!n) return;
                freq.set(n, (freq.get(n) || 0) + 1);
              });
              return Array.from(freq.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([name]) => name);
            })() as string[]}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!content.trim()}>
              댓글 작성
            </Button>
          </div>
        </form>
        <Separator className="mb-4" />
        <CommentsThread
          postId={id}
          comments={comments || []}
          onMutate={mutateComments}
          canLoadMore={!isReachingEnd}
          onLoadMore={() => setSize(size + 1)}
        />
      </section>

      {/* 라이트박스 */}
      <Dialog open={lightbox.open} onOpenChange={(o) => setLightbox((s) => ({ ...s, open: o }))}>
        <DialogContent className="bg-transparent border-0 shadow-none sm:max-w-5xl p-0">
          {imageUrls.length > 0 && (
            <div className="relative w-[min(90vw,80rem)] h-[min(80vh,60rem)] mx-auto">
              <Image
                src={imageUrls[lightbox.index]}
                alt={`image-${lightbox.index + 1}`}
                fill
                className="object-contain"
                sizes="80vw"
                priority
              />
              {imageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="이전"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 border rounded-md px-2 py-1"
                    onClick={() =>
                      setLightbox((s) => ({ ...s, index: (s.index - 1 + imageUrls.length) % imageUrls.length }))
                    }
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="다음"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 border rounded-md px-2 py-1"
                    onClick={() => setLightbox((s) => ({ ...s, index: (s.index + 1) % imageUrls.length }))}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
