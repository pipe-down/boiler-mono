'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { Button } from '@chatstack/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@chatstack/ui';
import { Input } from '@chatstack/ui';
import { Label } from '@chatstack/ui';
import { Alert, AlertDescription, AlertTitle } from '@chatstack/ui';
import { AlertTriangle } from '@chatstack/ui';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('auth/login', { json: { email, password } }).json<{ accessToken: string }>();
      saveSession(res.accessToken);
      const next = searchParams.get('next') || '/messages';
      router.push(next);
    } catch (e: any) {
      const errorJson = await e.response?.json().catch(() => null);
      setError(errorJson?.message || e.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>이메일과 비밀번호를 입력하여 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}