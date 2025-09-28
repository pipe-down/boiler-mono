'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';

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
    <section style={{ maxWidth: 420 }}>
      <h1>로그인</h1>
      <div style={{ display: 'grid', gap: 8 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button onClick={submit} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
        {error && <p style={{ color: 'tomato' }}>{error}</p>}
      </div>
    </section>
  );
}