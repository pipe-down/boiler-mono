'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Dashboard } from '@/src/components/Dashboard';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';

export default function DashboardPage() {
  const router = useRouter();
  return (
    <ErrorBoundary>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">대시보드</h1>
          <p className="text-muted-foreground">플랫폼의 전체 통계를 확인하세요.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')}>
          ← 메인으로
        </Button>
      </div>
      <Dashboard isOpen onClose={() => router.back()} />
    </ErrorBoundary>
  );
}
