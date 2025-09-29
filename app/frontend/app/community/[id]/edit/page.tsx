'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePost, useUpdatePost, useDeletePost } from '@/hooks/api/usePosts';
import { Card, CardContent, CardHeader, CardTitle, Input, Textarea, Button, Label, Separator } from '@chatstack/ui';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function EditPostPage() {
  const { id } = useParams() as { id?: string };
  const router = useRouter();
  const postId = Number(id || 0);
  const { data: post, isLoading, error } = usePost(Number.isFinite(postId) ? postId : undefined);
  const { data: me } = useAuth();
  const updateMut = useUpdatePost();
  const deleteMut = useDeletePost();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (post) {
      setTitle(post.title || post.data?.title || '');
      setContent(post.content || post.data?.content || '');
      const t = (post.tags || post.data?.tags || []) as string[];
      setTags(t.join(','));
    }
  }, [post]);

  if (error)
    return <div className="container mx-auto px-4 py-8">게시글을 불러오지 못했습니다.</div>;
  if (isLoading && !post)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse h-24 bg-muted rounded-lg" />
      </div>
    );
  if (!post) return <div className="container mx-auto px-4 py-8">게시글이 없습니다.</div>;

  const ownerId = Number((post as any).authorId || (post as any)?.data?.authorId || NaN);
  const isOwner = me && Number(me.id) === ownerId;

  if (me && ownerId && !isOwner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">본인 게시글만 수정할 수 있습니다.</p>
            <Button variant="outline" onClick={() => router.push(`/community/${postId}`)}>
              ← 상세로
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attachments: Array<{ id: number; originalFileName?: string }> =
    post.attachments || post.data?.attachments || [];

  const onToggleDelete = (fid: number, checked: boolean) => {
    setDeletedIds((prev) =>
      checked ? Array.from(new Set([...prev, fid])) : prev.filter((x) => x !== fid),
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const files = Array.from(fileRef.current?.files || []);
      await updateMut.trigger({
        postId,
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        newFiles: files as any,
        deletedFileIds: deletedIds,
      });
      toast.success('게시글이 수정되었습니다.');
      router.replace(`/community/${postId}`);
    } catch (e: any) {
      toast.error('수정 실패', { description: e?.response?.data?.message });
    }
  };

  const onDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteMut.trigger(postId);
      toast.success('삭제되었습니다.');
      router.replace('/community');
    } catch (e: any) {
      toast.error('삭제 실패', { description: e?.response?.data?.message });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>게시글 수정</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/community/${postId}`)}>
              취소
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              삭제
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <Label>제목</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div>
              <Label>내용</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                required
              />
            </div>
            <div>
              <Label>태그(쉼표 구분)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <Separator />
            <div>
              <Label>기존 첨부파일</Label>
              <div className="mt-2 space-y-2">
                {attachments.length === 0 && (
                  <div className="text-sm text-muted-foreground">첨부파일 없음</div>
                )}
                {attachments.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      onChange={(e) => onToggleDelete(f.id, e.target.checked)}
                    />
                    <span>{f.originalFileName || `파일 #${f.id}`}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>새 파일 추가</Label>
              <Input type="file" multiple ref={fileRef} />
            </div>
            <div className="flex justify-end">
              <Button type="submit">저장</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
