'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id || 'unknown';

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">프로필</h1>
          <p className="text-muted-foreground">사용자 ID: {id}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')}>
          ← 메인으로
        </Button>
      </div>
    </>
  );
}
