'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@chatstack/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@chatstack/ui';
import { Input } from '@chatstack/ui';
import { Label } from '@chatstack/ui';
import { Alert, AlertDescription, AlertTitle } from '@chatstack/ui';
import { AlertTriangle, CheckCircle } from '@chatstack/ui';

export default function Register() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('데모');
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo1234');
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setOk(null);
    setError(null);
    setLoading(true);
    try {
      await api.post('auth/register', { json: { displayName, email, password } });
      setOk('가입 완료. 2초 후 로그인으로 이동합니다.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (e: any) {
      const errorJson = await e.response?.json().catch(() => null);
      setError(errorJson?.message || e.message || '가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>계정 정보를 입력하여 새 계정을 만드세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {ok && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>성공</AlertTitle>
              <AlertDescription>{ok}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="displayName">이름</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="홍길동"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={submit} disabled={loading || !!ok} className="w-full">
            {loading ? '가입 처리 중...' : '가입하기'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}