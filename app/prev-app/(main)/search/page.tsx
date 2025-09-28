'use client';
export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/src/components/ui/button';

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params?.get('q') || '';
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">검색</h1>
          <p className="text-muted-foreground">검색어: {q || '없음'}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')}>
          ← 메인으로
        </Button>
      </div>

      <div className="rounded-xl border p-6 text-sm text-muted-foreground">
        검색 결과가 여기에 표시됩니다. (아직 API 연동 전)
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div />}>
      <SearchInner />
    </Suspense>
  );
}
