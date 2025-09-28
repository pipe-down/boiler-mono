'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@chatstack/ui';
import { clearSession, loadSession } from '../../lib/auth';
import { useEffect, useState } from 'react';

export function AuthNav() {
  const router = useRouter();
  const [session, setSession] = useState(() => (typeof window !== 'undefined' ? loadSession() : null));

  useEffect(() => {
    const sync = () => setSession(loadSession());
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    router.push('/login');
  };

  if (!session) {
    return (
      <nav style={{ display: 'flex', gap: 12, fontSize: 14 }}>
        <Link href="/login">로그인</Link>
        <Link href="/register">회원가입</Link>
      </nav>
    );
  }

  const displayName = session.name ?? session.email ?? '사용자';

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 14 }}>안녕하세요, {displayName}님</span>
      <Button type="button" variant="ghost" onClick={handleLogout}>
        로그아웃
      </Button>
    </nav>
  );
}
