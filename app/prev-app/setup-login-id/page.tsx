'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/src/lib/axios';
import { useAuth } from '@/src/features/auth/hooks/useAuth';

function SetupLoginIdClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: me } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = params.get('accessToken') || '';
  const needsLoginId = (params.get('needsLoginId') || '').toLowerCase() === 'true';


  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const v = loginId.trim();
    return v.length >= 4 && v.length <= 20 && /^[A-Za-z0-9_-]+$/.test(v);
  }, [loginId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.post('/users/me/login-id', { loginId: loginId.trim() });
      toast.success('로그인 ID가 설정되었습니다');
      router.replace('/');
    } catch (e: any) {
      const msg = e?.response?.data?.message || '설정에 실패했습니다. 다른 ID를 시도해 주세요.';
      toast.error('로그인 ID 설정 실패', { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // 백엔드에서 잘못 needsLoginId=true를 붙여도, 실제 사용자 상태가 hasLoginId=true면 홈으로 돌려보냄
    if (me && me.hasLoginId) {
      router.replace('/');
      return;
    }
    if (!needsLoginId) {
      // 필요 없으면 홈으로 이동
      router.replace('/');
    }
  }, [needsLoginId, router, me]);

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>로그인 ID 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm mb-2 block">원하는 로그인 ID</label>
              <div className="flex items-start gap-2">
                <Input
                  className="flex-1"
                  value={loginId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z0-9_-]/g, '');
                    setLoginId(value);
                    setIsAvailable(null);
                    setCheckError(null);
                  }}
                  placeholder="예: travel_joe"
                  required
                  minLength={4}
                  maxLength={20}
                  pattern="[A-Za-z0-9_\-]+"
                  inputMode="text"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  title="영문 대/소문자, 숫자, 밑줄(_), 하이픈(-)만 사용 가능 (4-20자)"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const v = loginId.trim();
                    if (!/^[A-Za-z0-9_-]{4,20}$/.test(v)) {
                      toast.error('형식이 올바르지 않습니다', {
                        description: '영문 대/소문자, 숫자, 밑줄(_), 하이픈(-) 4-20자',
                      });
                      setIsAvailable(null);
                      setCheckError('영문 대/소문자, 숫자, 밑줄(_), 하이픈(-) 4-20자');
                      return;
                    }
                    setChecking(true);
                    try {
                      const res = await api.get('/users/check-login-id', {
                        params: { loginId: v },
                      });
                      const success = res?.data?.success;
                      const available = Boolean(res?.data?.data);
                      if (success) {
                        setCheckError(null);
                        setIsAvailable(available);
                        if (available) {
                          toast.success('사용 가능한 ID입니다.');
                        } else {
                          toast.error('이미 사용중인 ID입니다.');
                        }
                      } else {
                        const msg = res?.data?.message || '중복 체크에 실패했습니다.';
                        toast.error('중복 체크 실패', { description: msg });
                        setIsAvailable(null);
                        setCheckError(msg);
                      }
                    } catch (e: any) {
                      const msg = e?.response?.data?.message || '중복 체크에 실패했습니다.';
                      toast.error('중복 체크 실패', { description: msg });
                      setIsAvailable(null);
                      setCheckError(msg);
                    } finally {
                      setChecking(false);
                    }
                  }}
                  disabled={checking || !/^[A-Za-z0-9_-]{4,20}$/.test(loginId.trim())}
                >
                  {checking ? '확인 중...' : '중복 체크'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                영문 대/소문자, 숫자, 밑줄(_), 하이픈(-) 4-20자
              </p>
              {isAvailable === true && (
                <p className="text-xs text-green-600 mt-1">사용 가능한 ID입니다.</p>
              )}
              {isAvailable === false && (
                <p className="text-xs text-red-600 mt-1">이미 사용중인 ID입니다.</p>
              )}
              {checkError && <p className="text-xs text-red-600 mt-1">{checkError}</p>}
            </div>
            <Button type="submit" disabled={!canSubmit || submitting} className="w-full">
              {submitting ? '저장 중...' : '저장하기'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupLoginIdPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12">로딩 중...</div>}>
      <SetupLoginIdClient />
    </Suspense>
  );
}
