import React from 'react';
import type { Message } from '@/src/types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { FileAttachmentCard } from '@/src/components/messages/FileAttachmentCard';
import { extractUrls, isImageUrl, parseFileMessage } from '@/src/components/messages/utils/files';

export function MediaDialog({
  open,
  onOpenChange,
  messages,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  messages: Message[];
}) {
  const images = React.useMemo(() => {
    return (messages || []).filter(
      (m) =>
        (m.type === 'image' && m.metadata?.imageUrl) ||
        (m.type === 'text' && isImageUrl(extractUrls(m.content)[0] || '')),
    );
  }, [messages]);

  const files = React.useMemo(() => {
    return (messages || [])
      .map((m) => {
        if (m.type !== 'text') return null;
        const parsed = parseFileMessage(m.content);
        if (!parsed) return null;
        return { mid: m.id, ...parsed };
      })
      .filter(Boolean) as Array<{ mid: string; url: string; name: string }>;
  }, [messages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>사진 및 파일</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">이미지</h4>
            <div className="grid grid-cols-3 gap-3">
              {images.map((m) => {
                const imageUrl =
                  m.type === 'image'
                    ? (m.metadata?.imageUrl as string)
                    : extractUrls(m.content)[0] || '';
                return (
                  <a
                    key={m.id}
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <img
                      src={imageUrl}
                      alt="첨부 이미지"
                      className="w-full h-24 object-cover rounded-md border group-hover:opacity-90"
                    />
                  </a>
                );
              })}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">파일</h4>
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.mid}>
                  <FileAttachmentCard url={f.url} name={f.name} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
