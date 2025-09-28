'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { loadSession } from '../../lib/auth';

export default function Guard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      const next = encodeURIComponent(pathname ?? '/');
      router.replace(`/login?next=${next}`);
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return <p>인증 상태를 확인하는 중입니다...</p>;
  }

  return <>{children}</>;
}
