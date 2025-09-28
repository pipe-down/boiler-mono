import React, { useEffect, useId, useRef, useState } from 'react';
import { SharedAuthForm } from './SharedAuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSocialLogin: (provider: 'kakao' | 'naver' | 'google') => void | Promise<void>;
}

/** [아이콘24 | 라벨 | placeholder24] + 패딩(12/10/12) */
function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="grid w-full grid-cols-[24px_1fr_24px] items-center"
      style={{ paddingLeft: 12, paddingRight: 12, columnGap: 10 }}
    >
      <span className="flex items-center justify-start" aria-hidden="true">{icon}</span>
      <span className="justify-self-center font-medium">{label}</span>
      <span aria-hidden="true" />
    </span>
  );
}

export function AuthModal({ isOpen, onClose, onSocialLogin }: AuthModalProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // 간단 포커스 트랩 + ESC + 포커스 복귀
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab' && focusables && focusables.length) {
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = prevOverflow; (previouslyFocused.current as HTMLElement | null)?.focus(); };
  }, [isOpen, onClose]);

  const handleSocialLogin = async (p: 'kakao' | 'naver' | 'google') => {
    try { await onSocialLogin(p); } finally { onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}
         className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)]">
      <div ref={dialogRef} className="w-full max-w-md mx-4 outline-none">
        <SharedAuthForm title="간편 로그인" description="소셜 계정으로 빠르게 시작하세요" nextPath="/" onClose={onClose} />
      </div>
    </div>
  );
}
