'use client';

import { useEffect, useState } from 'react';
import { loadSession, Session } from '../lib/auth';

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const sync = () => setSession(loadSession());
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return session;
}
