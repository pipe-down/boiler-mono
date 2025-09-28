'use client';
export const dynamic = 'force-dynamic';

import React, { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { SharedAuthForm } from '@/src/features/auth/ui/SharedAuthForm';

function LoginContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get('next') || sp.get('redirect') || '/';
  const error = sp.get('error') || '';
  const reason = sp.get('reason') || '';
  const safeNext = useMemo(
    () => (redirect && redirect.startsWith('/') && !redirect.startsWith('/api/') ? redirect : '/'),
    [redirect],
  );
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">로그인</h1>
          <p className="text-muted-foreground">소셜 계정으로 로그인해 주세요.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/') }>
          ← 메인으로
        </Button>
      </div>

      <SharedAuthForm
        title="간편 로그인"
        description="소셜 계정으로 빠르게 시작하세요"
        nextPath={safeNext}
        error={error}
        reason={reason}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-12">
          <div className="animate-pulse h-24 bg-muted rounded-lg" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
