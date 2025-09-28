'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTimeline, useTimelineActions, useTimelineComments } from '@/src/hooks/api/useTimeline';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import {
  useJoinByInviteCode,
  useRequestJoinPublicTrip,
  useValidateInviteCode,
} from '@/src/hooks/api/useTrips';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Textarea } from '@/src/components/ui/textarea';
import { Input } from '@/src/components/ui/input';
import { Separator } from '@/src/components/ui/separator';
import { Heart } from '@/src/components/icons';
import { toast } from 'sonner';

export default function TripTimelinePage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const tripId = params?.id as string;
  const { data: me } = useAuth();
  const timeline = useTimeline(tripId, 10);
  const actions = useTimelineActions(tripId);
  const [message, setMessage] = useState('');

  const joinReq = useRequestJoinPublicTrip();
  const joinByCode = useJoinByInviteCode();
  const validateInvite = useValidateInviteCode();
  const [inviteCode, setInviteCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const errStatus = (timeline as any)?.error?.response?.status as number | undefined;
  const errData = (timeline as any)?.error?.response?.data as any;
  const errHeaders = (timeline as any)?.error?.response?.headers as any;
  const isForbiddenMember = useMemo(() => {
    const code = errData?.errorCode;
    const msg: string | undefined = errData?.message;
    return (
      errStatus === 403 &&
      (code === 'TR002' || (typeof msg === 'string' && msg.includes('여행 멤버가 아닙니다')))
    );
  }, [errStatus, errData]);

  const onAddMessage = async () => {
    if (!message.trim()) return;
    try {
      await actions.addMessage.trigger({ content: message.trim() });
      setMessage('');
      await timeline.mutate();
      toast.success('메시지가 등록되었습니다');
    } catch (e: any) {
      toast.error('등록 실패', { description: e?.response?.data?.message });
    }
  };

  // 게이트: 로그인 필요 또는 멤버 전용
  const showGate = me === null || me === undefined || isForbiddenMember;
  const hasOtherError = !!(timeline as any)?.error && !showGate;
  const [retryLeft, setRetryLeft] = useState(0);

  function parseRetryAfterSeconds(h: any): number | null {
    try {
      const v = h?.['retry-after'] || h?.['Retry-After'];
      if (!v) return null;
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (
      hasOtherError &&
      (errStatus === 429 || (typeof errStatus === 'number' && errStatus >= 500))
    ) {
      const ra = parseRetryAfterSeconds(errHeaders);
      setRetryLeft(ra && ra > 0 ? ra : 5);
      const id = setInterval(() => {
        setRetryLeft((v) => {
          if (v <= 1) {
            clearInterval(id);
            timeline.mutate();
            return 0;
          }
          return v - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    } else {
      setRetryLeft(0);
    }
  }, [hasOtherError, errStatus, errHeaders, timeline]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">타임라인</h1>
        <Button variant="outline" onClick={() => router.push(`/trips/${tripId}`)}>
          ← 상세
        </Button>
      </div>

      {showGate ? (
        <Card>
          <CardContent className="py-6 space-y-4">
            <div className="text-sm text-muted-foreground">
              {me
                ? '이 기능은 멤버 전용입니다. 참여 요청 또는 초대 코드로 가입 후 이용해주세요.'
                : '로그인 후 이용 가능합니다. 상단에서 로그인한 뒤 이용해주세요.'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <div className="text-xs text-muted-foreground mb-1">초대 코드</div>
                <Input
                  placeholder="예: ABCD-1234"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    setInviteStatus('idle');
                  }}
                />
                {inviteStatus !== 'idle' && (
                  <div
                    className={`text-xs mt-1 ${inviteStatus === 'valid' ? 'text-green-600' : 'text-destructive'}`}
                  >
                    {inviteStatus === 'valid' ? '유효한 코드입니다' : '유효하지 않은 코드입니다'}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">닉네임(선택)</div>
                <Input
                  placeholder="표시할 이름"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await validateInvite.trigger(inviteCode.trim());
                      setInviteStatus(res?.valid ? 'valid' : 'invalid');
                    } catch {
                      setInviteStatus('invalid');
                    }
                  }}
                >
                  유효성 확인
                </Button>
                <Button
                  className="flex-1"
                  disabled={inviteStatus !== 'valid'}
                  onClick={async () => {
                    try {
                      await joinByCode.trigger({
                        inviteCode: inviteCode.trim(),
                        nickname: nickname.trim() || undefined,
                      });
                      toast.success('초대 코드로 가입되었습니다');
                      router.replace(`/trips/${tripId}`);
                    } catch (e: any) {
                      toast.error('가입 실패', { description: e?.response?.data?.message });
                    }
                  }}
                >
                  초대코드 가입
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      await joinReq.trigger({
                        tripId: Number(tripId),
                        nickname: nickname.trim() || undefined,
                      });
                      toast.success('참여 요청이 전송되었습니다');
                    } catch (e: any) {
                      toast.error('요청 실패', { description: e?.response?.data?.message });
                    }
                  }}
                >
                  참여 요청
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : hasOtherError ? (
        <Card>
          <CardContent className="py-6 space-y-2">
            <div className="text-sm text-destructive">
              {errStatus === 429
                ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
                : typeof errStatus === 'number' && errStatus >= 500
                  ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                  : '타임라인 데이터를 불러오지 못했습니다.'}
            </div>
            <div className="flex items-center gap-2">
              {retryLeft > 0 && (
                <div className="text-xs text-muted-foreground">자동 재시도 {retryLeft}초 후</div>
              )}
              <Button variant="outline" onClick={() => timeline.mutate()}>
                지금 재시도
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/trips/${tripId}`)}>
                상세로 이동
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const err = (timeline as any)?.error;
                  const status = err?.response?.status;
                  const message = err?.response?.data?.message || err?.message;
                  const path = `/trips/${tripId}/timeline`;
                  const now = new Date();
                  const title = `[버그 제보] 타임라인 오류 (${status ?? 'N/A'})`;
                  const ua = navigator.userAgent;
                  const platform = (navigator as any).platform || '';
                  const lang = navigator.language;
                  const href = window.location.href;
                  const content = [
                    `경로: ${path}`,
                    `URL: ${href}`,
                    `시간: ${now.toLocaleString()} (${now.toISOString()})`,
                    `브라우저/UA: ${ua}`,
                    `플랫폼: ${platform}`,
                    `언어: ${lang}`,
                    `상태코드: ${status ?? 'N/A'}`,
                    `메시지: ${message ?? ''}`,
                    '',
                    '재현 절차:',
                    '1. ',
                    '2. ',
                    '3. ',
                    '',
                    '기대 동작:',
                    '- ',
                    '',
                    '실제 동작:',
                    '- ',
                    '',
                    '추가 정보:',
                    '- ',
                  ].join('\n');
                  router.push(
                    `/community/new?title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`,
                  );
                }}
              >
                피드백 보내기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="py-4 space-y-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="타임라인에 메시지를 남겨보세요..."
              />
              <div className="flex justify-end">
                <Button onClick={onAddMessage}>등록</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {(timeline.items || []).map((a: any) => (
              <ActivityItem
                key={`${a.activityType}-${a.referenceId}-${a.activityTime}`}
                tripId={tripId}
                a={a}
                onMutate={() => timeline.mutate()}
                onToggleLike={async () => {
                  try {
                    await actions.toggleLike.trigger({
                      activityId: a.referenceId,
                      activityType: a.activityType,
                    });
                    await timeline.mutate();
                  } catch {}
                }}
              />
            ))}
            {!timeline.items?.length && (
              <div className="text-sm text-muted-foreground">아직 활동이 없습니다.</div>
            )}
            {!timeline.isReachingEnd && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => timeline.setSize(timeline.size + 1)}>
                  더 보기
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ActivityItem({
  tripId,
  a,
  onMutate,
  onToggleLike,
}: {
  tripId: string;
  a: any;
  onMutate: () => void | Promise<any>;
  onToggleLike: () => void | Promise<any>;
}) {
  const [showComments, setShowComments] = useState(false);
  const comments = useTimelineComments(tripId, a.referenceId, a.activityType, 10);
  const actions = useTimelineActions(tripId);
  const [content, setContent] = useState('');

  const onAddComment = async () => {
    if (!content.trim()) return;
    try {
      await actions.addComment.trigger({
        activityId: a.referenceId,
        activityType: a.activityType,
        content: content.trim(),
      });
      setContent('');
      await Promise.all([comments.mutate(), onMutate()]);
    } catch (e: any) {
      toast.error('댓글 등록 실패', { description: e?.response?.data?.message });
    }
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">{a.title || a.activityType}</div>
          <button
            className="text-muted-foreground text-sm"
            onClick={() => setShowComments((v) => !v)}
          >
            {showComments ? '댓글 접기' : `댓글 보기 (${a.comments?.count ?? 0})`}
          </button>
        </div>
        {a.description && (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {a.userName} · {new Date(a.activityTime).toLocaleString()}
          </div>
          <button className="flex items-center gap-1 hover:text-rose-600" onClick={onToggleLike}>
            <Heart className="h-4 w-4" fill={a.likes?.isLiked ? 'currentColor' : 'none'} />{' '}
            {a.likes?.count ?? 0}
          </button>
        </div>
        {showComments && (
          <div className="mt-3">
            <Separator className="mb-3" />
            <div className="space-y-2">
              {(comments.items || []).map((c: any) => (
                <div key={c.id} className="text-sm">
                  <div className="text-muted-foreground mb-1">
                    {c.author?.name} · {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">{c.content}</div>
                </div>
              ))}
              {!comments.items?.length && (
                <div className="text-sm text-muted-foreground">댓글이 없습니다.</div>
              )}
              {!comments.isReachingEnd && (
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => comments.setSize(comments.size + 1)}
                  >
                    더 보기
                  </Button>
                </div>
              )}
              <div className="flex gap-2 items-start">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="댓글 입력..."
                  rows={2}
                />
                <Button size="sm" onClick={onAddComment}>
                  등록
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
