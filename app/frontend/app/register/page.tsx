'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

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
      setOk('가입 완료. 로그인으로 이동합니다.');
      setTimeout(() => router.push('/login'), 800);
    } catch (e: any) {
      const errorJson = await e.response?.json().catch(() => null);
      setError(errorJson?.message || e.message || '가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 420 }}>
      <h1>회원가입</h1>
      <div style={{ display: 'grid', gap: 8 }}>
        <input placeholder="이름" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={loading} />
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <button onClick={submit} disabled={loading}>
          {loading ? '가입 처리 중...' : '가입'}
        </button>
        {ok && <p style={{ color: 'green' }}>{ok}</p>}
        {error && <p style={{ color: 'tomato' }}>{error}</p>}
      </div>
    </section>
  );
}