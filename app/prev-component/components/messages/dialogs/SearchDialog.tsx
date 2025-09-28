import React from 'react';
import type { Message } from '@/src/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { format } from 'date-fns';
import { renderHighlighted } from '@/src/components/messages/utils/links';

export function SearchDialog({
  open,
  onOpenChange,
  keyword,
  onKeywordChange,
  results,
  onSubmit,
  onClickResult,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  keyword: string;
  onKeywordChange: (v: string) => void;
  results: Message[];
  onSubmit: () => Promise<void>;
  onClickResult: (mid: string) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>대화에서 검색</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="키워드 입력"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') await onSubmit();
            }}
          />
          <div className="max-h-80 overflow-auto space-y-2">
            {results.map((m) => (
              <div
                key={m.id}
                className="p-2 rounded border cursor-pointer hover:bg-muted"
                onClick={async () => {
                  onOpenChange(false);
                  await onClickResult(m.id);
                }}
              >
                <div className="text-xs text-muted-foreground">
                  {format(new Date(m.timestamp), 'MM/dd HH:mm')}
                </div>
                <div className="text-sm">{renderHighlighted(m.content, keyword)}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
