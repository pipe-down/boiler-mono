'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Textarea } from '@/src/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';

type Candidate = { id: string; name: string };

export function MentionTextarea({
  value,
  onChange,
  candidates,
  placeholder,
  rows = 3,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  candidates: Array<string | Candidate>;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [tokenStart, setTokenStart] = useState<number | null>(null);

  const items = useMemo(() => {
    const list: Candidate[] = candidates.map((c) => (typeof c === 'string' ? { id: c, name: c } : c));
    if (!query) return list.slice(0, 8);
    const q = query.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [candidates, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
    setTokenStart(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((prev) => Math.min(prev + 1, Math.max(0, items.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[active]) select(items[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  const onTAChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    onChange(v);
    const caret = e.target.selectionStart || v.length;
    // 텍스트 시작부터 caret 전까지에서 마지막 @토큰 찾기
    const head = v.slice(0, caret);
    const m = head.match(/(^|\s)@([^\s@]*)$/);
    if (m) {
      setOpen(true);
      setQuery(m[2] || '');
      setActive(0);
      setTokenStart(caret - (m[2]?.length || 0) - 1); // '@' 위치
    } else {
      close();
    }
  };

  const select = (cand: Candidate) => {
    const ta = taRef.current;
    if (!ta) return;
    const v = value;
    const caret = ta.selectionStart || v.length;
    const start = tokenStart ?? caret;
    const before = v.slice(0, start);
    const after = v.slice(caret);
    const inserted = `@${cand.name} `;
    const next = before + inserted + after;
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const newPos = (before + inserted).length;
      ta.setSelectionRange(newPos, newPos);
    });
    close();
  };

  useEffect(() => {
    if (!open) setActive(0);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Textarea ref={taRef} value={value} onChange={onTAChange} onKeyDown={onKeyDown} placeholder={placeholder} rows={rows} className={className} />
      </PopoverTrigger>
      <PopoverContent className="p-1 w-64" align="start" sideOffset={6}>
        <div role="listbox" aria-label="멘션 후보" className="max-h-56 overflow-auto">
          {items.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">결과 없음</div>}
          {items.map((it, idx) => (
            <button
              type="button"
              key={it.id}
              role="option"
              aria-selected={idx === active}
              className={`w-full text-left px-2 py-1.5 text-sm rounded ${idx === active ? 'bg-accent' : ''}`}
              onMouseEnter={() => setActive(idx)}
              onClick={() => select(it)}
            >
              @{it.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

