import React from 'react';
import { Paperclip, ExternalLink, Download } from '@/src/components/icons';
import { getExtension, basenameFromUrl } from './utils/files';

export function FileAttachmentCard({ url, name }: { url: string; name: string }) {
  const ext = getExtension(name) || getExtension(basenameFromUrl(url));
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border">
      <div className="flex items-center justify-center w-10 h-10 rounded bg-muted text-muted-foreground">
        <Paperclip className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" title={name}>
          {name}
        </p>
        <p className="text-xs text-muted-foreground uppercase">{ext || 'file'}</p>
      </div>
      <div className="flex items-center gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-muted"
        >
          <ExternalLink className="h-4 w-4" /> 열기
        </a>
        <a
          href={url}
          download={name}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-muted"
        >
          <Download className="h-4 w-4" /> 다운로드
        </a>
      </div>
    </div>
  );
}
