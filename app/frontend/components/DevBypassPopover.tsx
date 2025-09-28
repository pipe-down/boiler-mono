'use client';

import React from 'react';
import { Button, Input, Popover, PopoverContent, PopoverTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@chatstack/ui';
import { Zap } from '@chatstack/ui';

const DEFAULT_BYPASS_EMAIL = process.env.NEXT_PUBLIC_BYPASS_DEFAULT_EMAIL || 'admin@pubaho.com';

export default function DevBypassPopover() {
  const uid = React.useId();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState(DEFAULT_BYPASS_EMAIL);
  const [provider, setProvider] = React.useState<'KAKAO' | 'GOOGLE' | 'NAVER'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dev_bypass_provider');
        if (saved === 'KAKAO' || saved === 'GOOGLE' || saved === 'NAVER') return saved as any;
      } catch {}
    }
    return 'KAKAO';
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedEmail = localStorage.getItem('dev_bypass_email');
      if (savedEmail) setEmail(savedEmail);
      const savedUserId = localStorage.getItem('dev_bypass_userid');
      const userIdEl = document.getElementById(
        `dev-bypass-userid-${uid}`,
      ) as HTMLInputElement | null;
      if (userIdEl && savedUserId) userIdEl.value = savedUserId;
    } catch {}
  }, [uid]);

  const persistCurrent = () => {
    try {
      localStorage.setItem('dev_bypass_email', email || '');
      localStorage.setItem('dev_bypass_provider', provider);
      const userIdInput =
        (document.getElementById(`dev-bypass-userid-${uid}`) as HTMLInputElement | null)?.value ||
        '';
      localStorage.setItem('dev_bypass_userid', userIdInput || '');
      try {
        localStorage.setItem('lastOAuthProvider', provider.toLowerCase());
      } catch {}
      try {
        document.cookie = `last_oauth_provider=${provider.toLowerCase()}; Max-Age=15552000; Path=/; SameSite=Lax`;
      } catch {}
    } catch {}
  };

  const handleBypass = () => {
    persistCurrent();
    const nextUrl = typeof window !== 'undefined' ? window.location.href : '/';
    // Ensure silent-mode cookie so callback in iframe knows to auto-close/broadcast error
    try { document.cookie = 'oauth_silent=1; Max-Age=600; Path=/; SameSite=Lax'; } catch {}
    const url = new URL('/api/bff/auth/bypass-login/redirect', window.location.origin);
    if (email) url.searchParams.set('email', email);
    const userIdInput =
      (document.getElementById(`dev-bypass-userid-${uid}`) as HTMLInputElement | null)?.value || '';
    if (userIdInput) url.searchParams.set('userId', userIdInput);
    url.searchParams.set('provider', provider);
    url.searchParams.set('silent', 'true');
    url.searchParams.set('next', nextUrl);

    let iframe = document.getElementById('dev-bypass-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'dev-bypass-iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    try {
      const bc =
        typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('auth-refresh') : null;
      const onMsg = (ev: MessageEvent) => {
        try {
          const d: any = (ev as any)?.data ?? (ev as any);
          if (d?.type === 'token-refreshed') {
            try {
              bc?.close();
            } catch {}
            window.location.reload();
          } else if (d?.type === 'bypass-error') {
            try {
              bc?.close();
            } catch {}
          }
        } catch {}
      };
      bc?.addEventListener('message', onMsg as any);
      setTimeout(() => {
        try {
          bc?.close();
        } catch {}
      }, 30_000);
    } catch {}

    // NOTE: 동일 출처(same-origin) 기준. CSP frame-src 및 쿠키 SameSite=Lax/None 확인 필요.
    iframe.src = url.toString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-1 xl:ml-2 h-8 w-8 p-0 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50"
          title="개발용 우회 로그인"
          aria-label="개발용 우회 로그인"
        >
          <Zap className="h-4 w-4" weight="bold" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground" htmlFor="dev-bypass-email">
                이메일
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setEmail(DEFAULT_BYPASS_EMAIL)}
              >
                기본값
              </Button>
            </div>
            <Input
              id="dev-bypass-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                try {
                  localStorage.setItem('dev_bypass_email', e.target.value || '');
                } catch {}
              }}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor={`dev-bypass-userid-${uid}`}>
              사용자 ID (선택)
            </label>
            <Input id={`dev-bypass-userid-${uid}`} type="number" placeholder="예: 1" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Provider</label>
            <Select
              value={provider}
              onValueChange={(v) => {
                setProvider(v as any);
                try {
                  localStorage.setItem('dev_bypass_provider', v);
                  localStorage.setItem('lastOAuthProvider', v.toLowerCase());
                } catch {}
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KAKAO">KAKAO</SelectItem>
                <SelectItem value="GOOGLE">GOOGLE</SelectItem>
                <SelectItem value="NAVER">NAVER</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button size="sm" onClick={handleBypass}>
              실행
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
