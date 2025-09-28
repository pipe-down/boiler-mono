import React from 'react';
import type { Message } from '@/src/types/chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { MoreVertical, Check, CheckCheck, Clock } from '@/src/components/icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageContent } from './MessageContent';
import { Popover, PopoverTrigger, PopoverContent } from '@/src/components/ui/popover';

function getMessageStatusIcon(message: Message) {
  switch (message.status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case 'failed':
      return <Clock className="h-3 w-3 text-red-500" />;
    default:
      return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}

type GroupPosition = 'solo' | 'start' | 'middle' | 'end';

interface MessageItemProps {
  message: Message;
  index: number;
  total: number;
  currentUserId: string;
  showAvatar: boolean;
  groupPosition: GroupPosition;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  showTailTimestamp: boolean;
  showDayDivider: boolean;
  registerMessageNode: (
    message: Message,
    index: number,
    total: number,
    el: HTMLDivElement | null,
  ) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onUnreactMessage?: (messageId: string, emoji: string) => void;
  onEditOrConfirm: (message: Message, editingContent: string) => void;
  editingMessageId: string | null;
  editingContent: string;
  setEditingMessageId: (id: string | null) => void;
  setEditingContent: (v: string) => void;
  isMyMessage: boolean;
  onImageLoad?: () => void;
  isReactionOpen: boolean;
  onCloseReaction: () => void;
  EMOJIS: readonly string[];
  onBeginLongPress: (mid: string) => void;
  onCancelLongPress: () => void;
  formatMessageTime: (ts: string) => string;
  onRetryMessage?: (messageId: string) => void;
  onCancelPending?: (messageId: string) => void;
}

const radiusLarge = '1.5rem';
const radiusMedium = '1.05rem';

const inboundRadius: Record<GroupPosition, React.CSSProperties> = {
  solo: {
    borderTopLeftRadius: radiusLarge,
    borderTopRightRadius: radiusLarge,
    borderBottomLeftRadius: radiusLarge,
    borderBottomRightRadius: radiusLarge,
  },
  start: {
    borderTopLeftRadius: radiusLarge,
    borderTopRightRadius: radiusLarge,
    borderBottomLeftRadius: radiusMedium,
    borderBottomRightRadius: radiusLarge,
  },
  middle: {
    borderTopLeftRadius: radiusMedium,
    borderTopRightRadius: radiusLarge,
    borderBottomLeftRadius: radiusMedium,
    borderBottomRightRadius: radiusLarge,
  },
  end: {
    borderTopLeftRadius: radiusMedium,
    borderTopRightRadius: radiusLarge,
    borderBottomLeftRadius: radiusLarge,
    borderBottomRightRadius: radiusLarge,
  },
};

const outboundRadius: Record<GroupPosition, React.CSSProperties> = {
  solo: {
    borderTopLeftRadius: radiusLarge,
    borderTopRightRadius: radiusLarge,
    borderBottomLeftRadius: radiusLarge,
    borderBottomRightRadius: radiusLarge,
  },
  start: {
    borderTopLeftRadius: radiusLarge,
    borderTopRightRadius: radiusLarge,
    borderBottomLeftRadius: radiusLarge,
    borderBottomRightRadius: radiusMedium,
  },
  middle: {
    borderTopLeftRadius: radiusLarge,
    borderTopRightRadius: radiusMedium,
    borderBottomLeftRadius: radiusLarge,
    borderBottomRightRadius: radiusMedium,
  },
  end: {
    borderTopLeftRadius: radiusLarge,
    borderTopRightRadius: radiusMedium,
    borderBottomLeftRadius: radiusLarge,
    borderBottomRightRadius: radiusLarge,
  },
};

export function MessageItem({
  message,
  index,
  total,
  currentUserId,
  showAvatar,
  groupPosition,
  isGroupStart,
  isGroupEnd,
  showTailTimestamp,
  showDayDivider,
  registerMessageNode,
  onReactMessage,
  onUnreactMessage,
  onEditOrConfirm,
  editingMessageId,
  editingContent,
  setEditingMessageId,
  setEditingContent,
  isMyMessage,
  onImageLoad,
  isReactionOpen,
  onCloseReaction,
  EMOJIS,
  onBeginLongPress,
  onCancelLongPress,
  formatMessageTime,
  onRetryMessage,
  onCancelPending,
}: MessageItemProps) {
  const containerSpacing = isGroupStart ? 'mt-5' : 'mt-2';
  const alignmentClass = isMyMessage ? 'justify-end' : 'justify-start';
  const tailClass = isGroupEnd ? (isMyMessage ? 'bubble--tail-right' : 'bubble--tail-left') : '';
  const compactClass = isGroupStart ? '' : 'bubble--compact';
  const bubbleClasses = ['group', 'bubble', compactClass, tailClass, isMyMessage ? 'bubble--outbound' : 'bubble--inbound']
    .filter(Boolean)
    .join(' ');
  const bubbleStyle = {
    ...(isMyMessage
      ? {
          '--bubble-bg': 'linear-gradient(135deg, #2f323a 0%, #3c4049 100%)',
          '--bubble-fg': '#ffffff',
          '--bubble-outline': 'rgba(56, 59, 68, 0.55)',
          '--bubble-shadow': '0 16px 32px rgba(15, 23, 42, 0.25)',
          '--bubble-tail-border': 'rgba(58, 61, 70, 0.28)',
          '--bubble-tail-shadow': '0 10px 22px rgba(15, 23, 42, 0.22)',
        }
      : {
          '--bubble-bg': 'linear-gradient(135deg, #ffffff 0%, #f5f7fb 100%)',
          '--bubble-fg': '#1d2331',
          '--bubble-outline': 'rgba(210, 218, 230, 0.94)',
          '--bubble-shadow': '0 10px 20px rgba(15, 23, 42, 0.14)',
          '--bubble-tail-border': 'rgba(210, 218, 230, 0.85)',
          '--bubble-tail-shadow': '0 6px 16px rgba(15, 23, 42, 0.12)',
        }),
    ...(isMyMessage ? outboundRadius[groupPosition] : inboundRadius[groupPosition]),
  } as React.CSSProperties;

  const timeLabel = format(new Date(message.timestamp), 'a h:mm', { locale: ko });
  const readReceiptLabel = (() => {
    if (!isMyMessage) return null;
    const readers = message.readBy || [];
    if (readers.length === 0) return null;
    return readers.length === 1 ? '읽음' : `읽음 ${readers.length}`;
  })();
  const statusIcon = getMessageStatusIcon(message);

  return (
    <div
      ref={(el) => registerMessageNode(message, index, total, el as HTMLDivElement)}
      className={`w-full ${containerSpacing}`}
      data-mid={message.id}
    >
      <div className={`flex w-full gap-2 ${alignmentClass}`}>
        {!isMyMessage && (
          isGroupStart ? (
            <Avatar className="h-9 w-9">
              <AvatarImage src={message.senderAvatar} alt={message.senderName} />
              <AvatarFallback className="text-xs">{message.senderName.slice(0, 2)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-9" aria-hidden />
          )
        )}

        <div
          className={`flex max-w-[74vw] sm:max-w-[58%] md:max-w-[380px] flex-col ${
            isMyMessage ? 'items-end text-right' : 'items-start text-left'
          }`}
        >
          {!isMyMessage && isGroupStart && (
            <span className="mb-1 text-[12px] font-medium text-slate-500">{message.senderName}</span>
          )}

          <div className={`flex items-end gap-2 ${isMyMessage ? 'flex-row-reverse' : ''}`}>
            <div
              className={bubbleClasses}
              style={bubbleStyle}
              onTouchStart={() => onBeginLongPress(message.id)}
              onTouchEnd={onCancelLongPress}
              onTouchMove={onCancelLongPress}
              onTouchCancel={onCancelLongPress}
            >
              {isMyMessage && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="메시지 옵션"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editingMessageId === message.id) {
                      onEditOrConfirm(message, editingContent);
                    } else {
                      setEditingMessageId(message.id);
                      setEditingContent(message.content);
                    }
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}

              <MessageContent
                message={message}
                text={message.id === editingMessageId ? editingContent : message.content}
                onImageLoad={onImageLoad}
              />

              <div
                className={`pointer-events-auto absolute -top-3 left-1/2 z-10 -translate-x-1/2 ${
                  isReactionOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}
              >
                <div className="flex items-center gap-1 rounded-full border bg-background/95 px-2 py-1 shadow-lg backdrop-blur">
                  {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => (
                    <button
                      key={emoji}
                      className="h-6 w-6 text-base leading-none"
                      aria-label={`이모지 ${emoji} 반응`}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onReactMessage?.(message.id, emoji);
                        onCloseReaction();
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="h-6 w-6 text-sm" aria-label="더 많은 이모지">
                        …
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side={isMyMessage ? 'left' : 'right'}
                      align="start"
                      className="w-auto p-2"
                      collisionPadding={8}
                    >
                      <div className="grid grid-cols-6 gap-1">
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onReactMessage?.(message.id, emoji);
                              onCloseReaction();
                            }}
                            className="h-8 w-8 rounded hover:bg-muted text-lg"
                            aria-label={`이모지 ${emoji} 추가`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {showTailTimestamp && (
              <div
                className={`mb-[6px] flex items-center gap-1 text-[11px] ${
                  isMyMessage ? 'flex-row-reverse text-primary-foreground/85' : 'text-slate-400'
                }`}
              >
                {isMyMessage && readReceiptLabel && <span>{readReceiptLabel}</span>}
                {isMyMessage && (
                  message.status === 'failed' && message.metadata?.errorMessage ? (
                    <span className="text-red-400" title={message.metadata.errorMessage}>
                      {statusIcon}
                    </span>
                  ) : (
                    statusIcon
                  )
                )}
                <span>{timeLabel}</span>
              </div>
            )}
          </div>

          {isMyMessage && (message.status === 'failed' || message.status === 'sending') && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {message.status === 'failed' && (
                <Button
                  size="sm"
                  className="h-7 px-2"
                  variant="secondary"
                  onClick={() => onRetryMessage?.(message.id)}
                  aria-label="메시지 재시도"
                  data-testid="retry-message"
                >
                  재시도
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 px-2"
                variant="outline"
                onClick={() => onCancelPending?.(message.id)}
                aria-label="보류 메시지 삭제"
                data-testid="cancel-pending"
              >
                {message.status === 'sending' ? '취소' : '삭제'}
              </Button>
            </div>
          )}

          {(message.reactions || []).length > 0 && (
            <div
              className={`mt-1 flex flex-wrap items-center gap-1 ${
                isMyMessage ? 'justify-end' : 'justify-start'
              }`}
            >
              {(message.reactions || []).map((reaction) => {
                const mine = !!reaction.reactedByMe;
                return (
                  <button
                    key={reaction.emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mine) onUnreactMessage?.(message.id, reaction.emoji);
                      else onReactMessage?.(message.id, reaction.emoji);
                    }}
                    className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs ${
                      mine ? 'border-blue-300 bg-blue-50 text-blue-700' : 'bg-background/60'
                    }`}
                    title={mine ? '내 리액션 취소' : '리액션 추가'}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="min-w-[1ch]">{reaction.count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showDayDivider && (
        <div className="mt-4 flex justify-center">
          <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            {formatMessageTime(message.timestamp)}
          </span>
        </div>
      )}
    </div>
  );
}
