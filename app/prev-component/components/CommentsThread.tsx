'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { MentionTextarea } from '@/src/components/mentions/MentionTextarea';
import { Separator } from '@/src/components/ui/separator';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import {
  useCreateComment,
  useDeleteComment,
  useToggleCommentLike,
  useUpdateComment,
} from '@/src/hooks/api/useComments';

type CommentModel = {
  id: number;
  postId: number;
  parentId?: number | null;
  authorId?: number;
  authorName?: string;
  content: string;
  likeCount?: number;
  liked?: boolean;
  createdAt?: string;
  children?: CommentModel[];
};

export function CommentsThread({
  postId,
  comments,
  onMutate,
  onLoadMore,
  canLoadMore,
}: {
  postId: number;
  comments: CommentModel[];
  onMutate: () => Promise<any> | void;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
}) {
  const { data: me } = useAuth();
  const create = useCreateComment(postId);
  const update = useUpdateComment(postId);
  const del = useDeleteComment(postId);
  const toggleLike = useToggleCommentLike(postId);

  function Item({ c, depth = 0 }: { c: CommentModel; depth?: number }) {
    const [showReply, setShowReply] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(c.content);
    const isOwner = me && c.authorId && Number(me.id) === Number(c.authorId);
    const pad = Math.min(depth, 4) * 16;

    const submitReply = async () => {
      if (!me) {
        alert('로그인이 필요합니다.');
        return;
      }
      if (!replyContent.trim()) return;
      // 서버는 대댓글 1단계만 허용 → 자식에 대한 답글도 최상위 부모를 parentId로 사용
      const parentIdToSend = c.parentId ? c.parentId : c.id;
      const contentToSend =
        depth && depth >= 1 && c.authorName
          ? `@${c.authorName} ${replyContent.trim()}`
          : replyContent.trim();
      await create.trigger({ content: contentToSend, parentId: parentIdToSend });
      setReplyContent('');
      setShowReply(false);
      await onMutate?.();
    };

    const submitEdit = async () => {
      if (!editContent.trim()) return;
      await update.trigger({ commentId: c.id, content: editContent.trim() });
      setIsEditing(false);
      await onMutate?.();
    };

    const remove = async () => {
      if (!me || !isOwner) return;
      if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
      await del.trigger(c.id);
      await onMutate?.();
    };

    const like = async () => {
      if (!me) {
        alert('로그인이 필요합니다.');
        return;
      }
      await toggleLike.trigger(c.id);
      await onMutate?.();
    };

    const highlightMentions = (text: string) => {
      const parts = text.split(/(@[^\s]+)/g);
      return parts.map((p, i) =>
        p.startsWith('@') ? (
          <span key={i} className="text-blue-600">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      );
    };

    return (
      <div style={{ marginLeft: pad }} className="relative">
        {depth > 0 && (
          <div className="absolute left-[-8px] top-6 bottom-4 w-px bg-muted" aria-hidden />
        )}
        <Card className="mb-3">
          <CardContent className="py-4">
            <div className="text-sm text-muted-foreground mb-1">
              {c.authorName || '익명'} · {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitEdit}>
                    저장
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">{highlightMentions(c.content)}</div>
            )}
            <div className="mt-2 text-xs text-muted-foreground flex gap-3">
              <button type="button" onClick={like} className="hover:text-red-500">
                좋아요 {c.likeCount ?? 0}
              </button>
              <button
                type="button"
                onClick={() => setShowReply((v) => !v)}
                className="hover:text-blue-600"
              >
                답글
              </button>
              {isOwner && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="hover:text-amber-600"
                  >
                    수정
                  </button>
                  <button type="button" onClick={remove} className="hover:text-rose-600">
                    삭제
                  </button>
                </>
              )}
            </div>
            {showReply && (
              <div className="mt-3 space-y-2">
                <MentionTextarea
                  value={replyContent}
                  onChange={setReplyContent}
                  rows={3}
                  placeholder="답글을 입력하세요... (@사용자명 자동완성)"
                  candidates={(() => {
                    const freq = new Map<string, number>();
                    (comments || []).forEach((cc) => {
                      const n = cc.authorName;
                      if (!n) return;
                      freq.set(n, (freq.get(n) || 0) + 1);
                    });
                    return Array.from(freq.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([name]) => name);
                  })()}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitReply}>
                    등록
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>
                    취소
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {Array.isArray(c.children) && c.children.length > 0 && (
          <div className="space-y-2">
            {c.children.map((cc) => (
              <Item key={cc.id} c={cc} depth={(depth || 0) + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {comments.map((c) => (
          <Item key={c.id} c={c} />
        ))}
        {comments.length === 0 && (
          <div className="text-sm text-muted-foreground">첫 댓글을 작성해 보세요.</div>
        )}
      </div>
      <Separator className="my-4" />
      {canLoadMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore}>
            더 보기
          </Button>
        </div>
      )}
    </div>
  );
}
