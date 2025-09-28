import React, { useId, useMemo, useRef, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@chatstack/ui';

export function SharedAuthForm({
  title = '간편 로그인',
  description = '소셜 계정으로 빠르게 시작하세요',
  nextPath = '/',
  error,
  reason,
  onClose,
}: {
  title?: string;
  description?: string;
  nextPath?: string;
  error?: string | null;
  reason?: string | null;
  onClose?: () => void;
}) {
  const [pending, setPending] = useState<null | 'kakao' | 'naver' | 'google'>(null);
  const handleSocialLogin = async (provider: 'kakao' | 'naver' | 'google') => {
    try {
      setPending(provider);
      try { localStorage.setItem('lastOAuthProvider', provider); } catch {}
      try { document.cookie = `last_oauth_provider=${provider}; Max-Age=15552000; Path=/; SameSite=Lax`; } catch {}
      const qs = nextPath && nextPath.startsWith('/') && !nextPath.startsWith('/api/') ? `?next=${encodeURIComponent(nextPath)}` : '';
      window.location.href = `/oauth2/authorization/${provider}${qs}`;
    } finally {
      setPending(null);
    }
  };

  const Row = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <span className="grid w-full grid-cols-[24px_1fr_24px] items-center" style={{ paddingLeft: 12, paddingRight: 12, columnGap: 10 }}>
      <span className="flex items-center justify-start" aria-hidden="true">{icon}</span>
      <span className="justify-self-center font-medium">{label}</span>
      <span aria-hidden="true" />
    </span>
  );

return (
    <Card className="w-full max-w-md mx-4 outline-none" data-testid="auth-form">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
        <p className="text-center text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm" role="alert">
            인증에 실패했습니다. {reason ? <span className="opacity-80">({reason})</span> : null} 다시 시도해 주세요.
          </div>
        )}
        <Button
          aria-label="카카오로 로그인"
          onClick={() => handleSocialLogin('kakao')}
          disabled={!!pending}
          className="w-full h-12 rounded-[12px] bg-[#FEE500] text-black/85 border-0 shadow-sm hover:bg-[#F3DA00] active:bg-[#E5CD00] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
          size="lg"
        >
          <Row icon={<svg viewBox="0 0 24 24" fill="#000" aria-hidden="true" className="w-6 h-6 transform scale-[1.22] origin-center"><path d="M12 3c5.246 0 9.5 3.21 9.5 7.5 0 4.29-4.254 7.5-9.5 7.5-1.089 0-2.143-.14-3.116-.4L4 20l1.86-3.724C4.7 14.9 3.5 13.05 3.5 10.5 3.5 6.21 6.754 3 12 3z" /></svg>} label={pending === 'kakao' ? '로그인 중…' : '카카오 로그인'} />
        </Button>
        <Button
          aria-label="네이버로 로그인"
          onClick={() => handleSocialLogin('naver')}
          disabled={!!pending}
          className="w-full h-12 rounded-[12px] bg-[#03C75A] text-white border-0 shadow-sm hover:bg-[#02B852] active:bg-[#01A84B] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#03C75A]"
          size="lg"
        >
          <Row icon={<span className="inline-flex items-center justify-center w-6 h-6 bg-white rounded-[3px]" aria-hidden="true"><span className="text-[#03C75A] text-[14px] font-extrabold leading-none">N</span></span>} label={pending === 'naver' ? '로그인 중…' : '네이버 로그인'} />
        </Button>
        <Button
          aria-label="Google로 로그인"
          onClick={() => handleSocialLogin('google')}
          disabled={!!pending}
          variant="outline"
          className="w-full h-12 rounded-[4px] bg-white text-[#1F1F1F] border border-[#DADCE0] hover:bg-[#F8F9FA] active:bg-[#F1F3F4] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1A73E8]"
          size="lg"
          style={{ fontFamily: 'Roboto, system-ui, -apple-system, Segoe UI, Helvetica, Arial' }}
        >
          <Row icon={<svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>} label={pending === 'google' ? '로그인 중…' : 'Google로 로그인'} />
        </Button>
        {onClose && (
          <div className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full">취소</Button>
          </div>
        )}
        <p className="text-center text-xs leading-6 text-muted-foreground">
          로그인 시 Getmoim의{' '}
          <a href="/terms" className="inline-block px-1 font-medium underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">이용약관</a>{' '}·{' '}
          <a href="/privacy" className="inline-block px-1 font-medium underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">개인정보처리방침</a>
          에 동의합니다.
        </p>
      </CardContent>
    </Card>
  );
}