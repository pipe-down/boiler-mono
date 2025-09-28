import React from 'react';
import type { Message } from '@/src/types/chat';
import { renderContentWithLinks } from '@/src/components/messages/utils/links';
import { parseFileMessage, extractUrls, isImageUrl } from '@/src/components/messages/utils/files';
import { FileAttachmentCard } from '@/src/components/messages/FileAttachmentCard';
import { MapPin, Calendar, ExternalLink, Download } from '@/src/components/icons';

export function MessageContent({
  message,
  text,
  onImageLoad,
}: {
  message: Message;
  text: string;
  onImageLoad?: () => void;
}) {
  if (message.type === 'text') {
    const file = parseFileMessage(text);
    if (file) return <FileAttachmentCard url={file.url} name={file.name} />;
    return <p className="whitespace-pre-wrap break-words">{renderContentWithLinks(text)}</p>;
  }

  if (message.type === 'image' && message.metadata?.imageUrl) {
    const url = message.metadata.imageUrl;
    return (
      <div className="space-y-2">
        <div className="relative group">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt="공유 이미지"
              className="rounded-lg max-w-full h-auto"
              onLoad={onImageLoad}
              loading="lazy"
              decoding="async"
            />
          </a>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-background/90 hover:bg-background"
            >
              <ExternalLink className="h-4 w-4" /> 열기
            </a>
            <a
              href={url}
              download
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-background/90 hover:bg-background"
            >
              <Download className="h-4 w-4" /> 저장
            </a>
          </div>
        </div>
        {message.content && <p>{message.content}</p>}
      </div>
    );
  }

  if (message.type === 'location' && message.metadata?.location) {
    return (
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        <span>{message.metadata.location.name}</span>
      </div>
    );
  }

  if (message.type === 'trip' || message.type === 'meetup') {
    return (
      <div className="flex items-center gap-2 p-2 bg-background/10 rounded-lg">
        {message.type === 'trip' ? (
          <MapPin className="h-4 w-4" />
        ) : (
          <Calendar className="h-4 w-4" />
        )}
        <span className="text-sm">{message.content}</span>
      </div>
    );
  }

  // Fallback: try image URL inside text (regardless of message.type inference)
  {
    const u = extractUrls(text)[0] || '';
    if (u && isImageUrl(u)) {
      return (
        <a href={u} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={u}
            alt="첨부 이미지"
            className="rounded-lg max-w-full h-auto"
            onLoad={onImageLoad}
            loading="lazy"
            decoding="async"
          />
        </a>
      );
    }
  }

  return <p className="whitespace-pre-wrap break-words">{text}</p>;
}
