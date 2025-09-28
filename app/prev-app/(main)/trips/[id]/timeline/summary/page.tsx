'use client';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import {
  useJoinByInviteCode,
  useRequestJoinPublicTrip,
  useValidateInviteCode,
} from '@/src/hooks/api/useTrips';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Separator } from '@/src/components/ui/separator';
import {
  getTimelineSummary,
  getTimelineSummaries,
  getTripTimelineSummary,
} from '@/src/services/api/timeline';

export default function TimelineSummaryPage() {
  const { id } = useParams() as { id?: string };
  const router = useRouter();
  const tripId = id as string;
  const { data: me } = useAuth();
  const [date, setDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastOp, setLastOp] = useState<'none' | 'single' | 'range' | 'trip'>('none');
  const [retryLeft, setRetryLeft] = useState(0);

  const joinReq = useRequestJoinPublicTrip();
  const joinByCode = useJoinByInviteCode();
  const validateInvite = useValidateInviteCode();
  const [inviteCode, setInviteCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const run = async (fn: () => Promise<any>) => {
    setLoading(true);
    try {
      setResult(await fn());
    } catch (e: any) {
      setResult({
        error: e?.response?.data || e?.message,
        status: e?.response?.status,
        retryAfter: e?.response?.headers?.['retry-after'],
      });
    } finally {
      setLoading(false);
    }
  };

  const showGate = me === null || me === undefined;

  function parseRetryAfterSeconds(v: any): number | null {
    try {
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  const resStatus = result?.status;
  const retryAfter = result?.retryAfter;
  useEffect(() => {
    if (resStatus && (resStatus === 429 || resStatus >= 500) && lastOp !== 'none') {
      const ra = parseRetryAfterSeconds(retryAfter);
      setRetryLeft(ra && ra > 0 ? ra : 5);
      const id = setInterval(() => {
        setRetryLeft((v) => {
          if (v <= 1) {
            clearInterval(id);
            if (lastOp === 'single') run(() => getTimelineSummary(tripId, date));
            else if (lastOp === 'range')
              run(() => getTimelineSummaries(tripId, startDate, endDate));
            else if (lastOp === 'trip') run(() => getTripTimelineSummary(tripId));
            return 0;
          }
          return v - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    } else {
      setRetryLeft(0);
    }
  }, [resStatus, retryAfter, lastOp, date, startDate, endDate, tripId]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">타임라인 요약</h1>
        <Button variant="outline" onClick={() => router.push(`/trips/${tripId}`)}>
          ← 상세
        </Button>
      </div>

      {showGate ? (
        <Card>
          <CardContent className="py-6 space-y-4">
            <div className="text-sm text-muted-foreground">
              이 기능은 멤버 전용입니다. 참여 요청 또는 초대 코드로 가입 후 이용해주세요.
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
                      router.replace(`/trips/${tripId}`);
                    } catch {}
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
                    } catch {}
                  }}
                >
                  참여 요청
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-end gap-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">특정 날짜</div>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <Button
                  disabled={!date || loading}
                  onClick={() => {
                    setLastOp('single');
                    return run(() => getTimelineSummary(tripId, date));
                  }}
                >
                  조회
                </Button>
              </div>
              <Separator />
              <div className="flex items-end gap-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">시작일</div>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">종료일</div>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <Button
                  disabled={!startDate || !endDate || loading}
                  onClick={() => {
                    setLastOp('range');
                    return run(() => getTimelineSummaries(tripId, startDate, endDate));
                  }}
                >
                  기간 조회
                </Button>
                <Button
                  variant="secondary"
                  disabled={loading}
                  onClick={() => {
                    setLastOp('trip');
                    return run(() => getTripTimelineSummary(tripId));
                  }}
                >
                  전체기간 요약
                </Button>
              </div>
            </CardContent>
          </Card>

          {result?.status && (
            <Card>
              <CardContent className="py-3 space-y-2">
                <div
                  className={`text-sm ${result.status === 429 ? 'text-orange-600' : result.status >= 500 ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {result.status === 429
                    ? '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
                    : result.status >= 500
                      ? '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                      : '요청 처리 중 문제가 발생했습니다.'}
                </div>
                <div className="flex items-center gap-2">
                  {retryLeft > 0 && (
                    <div className="text-xs text-muted-foreground">
                      자동 재시도 {retryLeft}초 후
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRetryLeft(0);
                      if (lastOp === 'single') run(() => getTimelineSummary(tripId, date));
                      else if (lastOp === 'range')
                        run(() => getTimelineSummaries(tripId, startDate, endDate));
                      else if (lastOp === 'trip') run(() => getTripTimelineSummary(tripId));
                    }}
                  >
                    지금 재시도
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const status = result?.status;
                      const message = result?.error?.message || JSON.stringify(result?.error);
                      const path = `/trips/${tripId}/timeline/summary`;
                      const now = new Date();
                      const title = `[버그 제보] 타임라인 요약 오류 (${status ?? 'N/A'})`;
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
          )}

          <Card>
            <CardContent className="py-4">
              {loading ? (
                <div className="text-muted-foreground">불러오는 중...</div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[60vh]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
