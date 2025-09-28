import React from 'react';
import { Button } from '@/src/components/ui/button';
import { Smile, Paperclip, Image as ImageIcon } from '@/src/components/icons';
import { toast } from 'sonner';
import type { Message } from '@/src/types/chat';

type MessageInputProps = {
  conversationId: string | null;
  onSendMessage: (
    conversationId: string,
    content: string,
    type?: Message['type'],
    metadata?: Message['metadata'],
  ) => void;
  onTyping?: (conversationId: string, isTyping: boolean) => void;
  onAfterSend?: () => void;
  onHeightChange?: (height: number) => void;
};

export function MessageInput({
  conversationId,
  onSendMessage,
  onTyping,
  onAfterSend,
  onHeightChange,
}: MessageInputProps) {
  const [text, setText] = React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const uploadControllerRef = React.useRef<AbortController | null>(null);
  const lastReportedHeightRef = React.useRef(0);
  const [uploading, setUploading] = React.useState(false);

  const adjustTextarea = React.useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 216; // roughly 6 lines
    const next = Math.min(max, el.scrollHeight);
    el.style.height = `${next}px`;
  }, []);

  const reportHeight = React.useCallback(() => {
    if (typeof onHeightChange !== 'function') return;
    const host = containerRef.current;
    if (!host) return;
    const height = Math.round(host.getBoundingClientRect().height);
    if (height !== lastReportedHeightRef.current) {
      lastReportedHeightRef.current = height;
      onHeightChange(height);
    }
  }, [onHeightChange]);

  const syncMetrics = React.useCallback(() => {
    adjustTextarea();
    reportHeight();
  }, [adjustTextarea, reportHeight]);

  const doSend = React.useCallback(() => {
    if (!conversationId) return;
    const value = text.trim();
    if (!value) return;
    onSendMessage(conversationId, value);
    try {
      onAfterSend?.();
    } catch {}
    setText('');
    requestAnimationFrame(syncMetrics);
  }, [conversationId, text, onSendMessage, onAfterSend, syncMetrics]);

  const handleSend = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      doSend();
    },
    [doSend],
  );

  React.useLayoutEffect(() => {
    syncMetrics();
  }, [syncMetrics, conversationId]);

  // typing indicator debounce
  React.useEffect(() => {
    if (!conversationId || !onTyping) return;
    if (text.length > 0) {
      onTyping(conversationId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(conversationId, false);
        typingTimeoutRef.current = null;
      }, 2500);
    } else {
      onTyping(conversationId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [text, conversationId, onTyping]);

  React.useLayoutEffect(() => {
    syncMetrics();
  }, [text, uploading, syncMetrics]);

  React.useEffect(() => () => uploadControllerRef.current?.abort(), []);

  React.useEffect(() => {
    return () => {
      if (typeof onHeightChange === 'function') {
        lastReportedHeightRef.current = 0;
        onHeightChange(0);
      }
    };
  }, [onHeightChange]);

  return (
    <div
      ref={containerRef}
      className="flex-shrink-0 border-t bg-background/95 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] backdrop-blur supports-[backdrop-filter]:bg-background/70"
    >
      <form onSubmit={handleSend} className="flex w-full items-center gap-3">
        <div className="flex items-center gap-3">
          <input
            id="chat-file-input"
            type="file"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                toast.error('오프라인에서는 파일 업로드를 할 수 없습니다');
                (e.target as HTMLInputElement).value = '';
                return;
              }
              const MAX = 25 * 1024 * 1024;
              if (file.size > MAX) {
                toast.error('최대 25MB까지 업로드 가능합니다');
                (e.target as HTMLInputElement).value = '';
                return;
              }
              const badExt = /(\.exe|\.bat|\.cmd|\.sh|\.js|\.msi|\.apk)$/i;
              if (badExt.test(file.name)) {
                toast.error('해당 확장자는 업로드할 수 없습니다');
                (e.target as HTMLInputElement).value = '';
                return;
              }
              try {
                setUploading(true);
                uploadControllerRef.current = new AbortController();
                const fd = new FormData();
                fd.append('file', file);
                const resp = await fetch('/api/v1/chat/files/file', {
                  method: 'POST',
                  body: fd,
                  credentials: 'include',
                  signal: uploadControllerRef.current.signal,
                });
                const json: any = await resp.json();
                const url = json?.data?.fileUrl;
                const name = json?.data?.fileName || file.name;
                if (!url) throw new Error('파일 업로드 실패');
                if (!conversationId) return;
                onSendMessage(conversationId, `${name} ${url}`, 'text');
              } catch (err: any) {
                if (err?.name === 'AbortError') toast.message('업로드가 취소되었습니다');
                else toast.error(err?.message || '파일 업로드에 실패했습니다');
              } finally {
                setUploading(false);
                uploadControllerRef.current = null;
                try {
                  (e.target as HTMLInputElement).value = '';
                } catch {}
                requestAnimationFrame(syncMetrics);
              }
            }}
            />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full"
            aria-label="파일 첨부"
            onClick={() => document.getElementById('chat-file-input')?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            id="chat-image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                toast.error('오프라인에서는 이미지 업로드를 할 수 없습니다');
                (e.target as HTMLInputElement).value = '';
                return;
              }
              const MAX = 25 * 1024 * 1024;
              if (file.size > MAX) {
                toast.error('이미지는 최대 25MB까지 업로드 가능합니다');
                (e.target as HTMLInputElement).value = '';
                return;
              }
              try {
                setUploading(true);
                uploadControllerRef.current = new AbortController();
                const fd = new FormData();
                fd.append('file', file);
                const resp = await fetch('/api/v1/chat/files/image', {
                  method: 'POST',
                  body: fd,
                  credentials: 'include',
                  signal: uploadControllerRef.current.signal,
                });
                const json: any = await resp.json();
                const url = json?.data?.fileUrl;
                if (!url) throw new Error('이미지 업로드 실패');
                if (!conversationId) return;
                onSendMessage(conversationId, '', 'image', { imageUrl: url });
              } catch (err: any) {
                if (err?.name === 'AbortError') toast.message('업로드가 취소되었습니다');
                else toast.error(err?.message || '이미지 업로드에 실패했습니다');
              } finally {
                setUploading(false);
                uploadControllerRef.current = null;
                try {
                  (e.target as HTMLInputElement).value = '';
                } catch {}
                requestAnimationFrame(syncMetrics);
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full"
            aria-label="이미지 첨부"
            onClick={() => document.getElementById('chat-image-input')?.click()}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          {uploading && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-12 px-4 text-xs rounded-full"
              onClick={() => {
                try {
                  uploadControllerRef.current?.abort();
                } catch {}
              }}
            >
              업로드 취소
            </Button>
          )}
        </div>
        <div className="relative flex-1 min-h-[52px]">
          <textarea
            ref={inputRef}
            data-testid="message-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              requestAnimationFrame(syncMetrics);
            }}
            placeholder="메시지를 입력하세요..."
            aria-label="메시지 입력"
            className="w-full min-h-[48px] resize-none overflow-hidden rounded-2xl border border-border bg-input-background px-4 py-3.5 pr-14 text-sm leading-relaxed outline-none transition focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary scrollbar-hidden"
            style={{ scrollbarWidth: 'none' }}
            maxLength={1000}
            rows={1}
            spellCheck
            onKeyDown={(e) => {
              const native = e.nativeEvent as any;
              const composing = native?.isComposing || e.key === 'Process';
              if (composing) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                doSend();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full"
            aria-label="이모지 열기"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="submit"
          size="default"
          data-testid="send-button"
          disabled={!text.trim() || !conversationId}
          className="h-12 px-6 rounded-full"
        >
          보내기
        </Button>
      </form>
    </div>
  );
}
