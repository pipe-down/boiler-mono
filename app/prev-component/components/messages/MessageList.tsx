import React, { useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import type { Message } from '@/src/types/chat';
import { MessageItem } from './MessageItem';

const isSameMinute = (a: string, b: string) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate() &&
    da.getHours() === db.getHours() &&
    da.getMinutes() === db.getMinutes()
  );
};

export type MessageListHandle = {
  scrollToBottom: (behavior?: 'auto' | 'smooth') => void;
};

export const MessageList = React.forwardRef<
  MessageListHandle,
  {
    messages: Message[];
    currentUserId: string;
    atBottom: boolean;
    setAtBottom: (v: boolean) => void;
    unreadSinceTimestamp?: string | null;
    registerMessageNode: (
      message: Message,
      index: number,
      total: number,
      el: HTMLDivElement | null,
    ) => void;
    onStartReached: () => void;
    onReactMessage?: (messageId: string, emoji: string) => void;
    onUnreactMessage?: (messageId: string, emoji: string) => void;
    onRetryMessage?: (messageId: string) => void;
    onCancelPending?: (messageId: string) => void;
    onEditOrConfirm: (message: Message, editingContent: string) => void;
    editingMessageId: string | null;
    editingContent: string;
    setEditingMessageId: (id: string | null) => void;
    setEditingContent: (v: string) => void;
    isReactionOpenId: string | null;
    setReactionOpenId: (id: string | null) => void;
    EMOJIS: readonly string[];
    onBeginLongPress: (mid: string) => void;
    onCancelLongPress: () => void;
    formatMessageTime: (ts: string) => string;
    followMode?: 'auto' | 'smooth';
    /** 입력창과 말풍선 사이의 여유(px). 기본 12px. */
    bottomGap?: number;
  }
>(
  (
    {
      messages,
      currentUserId,
      atBottom,
      setAtBottom,
      registerMessageNode,
      unreadSinceTimestamp,
      onStartReached,
      onReactMessage,
      onUnreactMessage,
      onEditOrConfirm,
      editingMessageId,
      editingContent,
      setEditingMessageId,
      setEditingContent,
      isReactionOpenId,
      setReactionOpenId,
      EMOJIS,
      onBeginLongPress,
      onCancelLongPress,
      formatMessageTime,
      onRetryMessage,
      onCancelPending,
      followMode,
      bottomGap = 12,
    },
    ref,
  ) => {
    const virtuosoRef = useRef<VirtuosoHandle | null>(null);

    React.useImperativeHandle(ref, () => ({
      scrollToBottom: (behavior: 'auto' | 'smooth' = 'smooth') =>
        virtuosoRef.current?.scrollToIndex?.({
          index: Number.MAX_SAFE_INTEGER,
          align: 'end',
          behavior,
        }),
    }));

    const follow = followMode ?? 'smooth';

    // Footer 스페이서 컴포넌트: 입력창 높이 + safe area + 약간의 간격
    const Footer = () => (
      <div
        style={{
          height: `calc(${Math.max(0, bottomGap)}px + env(safe-area-inset-bottom, 0px))`,
        }}
      />
    );

    return (
      <Virtuoso
        ref={virtuosoRef}
        style={{
          height: '100%',
          overflowX: 'hidden',
        }}
        className="chat-scroll overflow-x-hidden scrollbar-hidden"
        data={messages}
        followOutput={atBottom ? follow : false}
        atBottomStateChange={setAtBottom}
        increaseViewportBy={{ top: 400, bottom: 300 }}
        computeItemKey={(index, item) => item?.id || `${index}-${(item as any)?.timestamp || ''}`}
        components={{ Footer }}
        startReached={onStartReached}
        itemContent={(index, message) => {
          const isMyMessage = message.senderId === currentUserId;
          const prevMessage = index > 0 ? messages[index - 1] : undefined;
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
          const prevTs = prevMessage ? new Date(prevMessage.timestamp).getTime() : 0;
          const curTs = new Date(message.timestamp).getTime();
          const unreadTs = unreadSinceTimestamp ? new Date(unreadSinceTimestamp).getTime() : 0;
          const showUnreadDivider =
            unreadTs > 0 && curTs >= unreadTs && prevTs < unreadTs && !isMyMessage;
          const prevSameSender = prevMessage?.senderId === message.senderId;
          const nextSameSender = nextMessage?.senderId === message.senderId;
          const prevSameMinute = prevMessage ? isSameMinute(prevMessage.timestamp, message.timestamp) : false;
          const nextSameMinute = nextMessage ? isSameMinute(nextMessage.timestamp, message.timestamp) : false;
          const sameGroupWithPrev = prevSameSender && prevSameMinute;
          const sameGroupWithNext = nextSameSender && nextSameMinute;
          const groupPosition = !sameGroupWithPrev && !sameGroupWithNext
            ? 'solo'
            : !sameGroupWithPrev && sameGroupWithNext
              ? 'start'
              : sameGroupWithPrev && sameGroupWithNext
                ? 'middle'
                : 'end';
          const isGroupStart = !sameGroupWithPrev;
          const isGroupEnd = !sameGroupWithNext;
          const showAvatar = !isMyMessage && isGroupStart;
          const showTailTimestamp = isGroupEnd;
          const showDayDivider = (() => {
            if (!nextMessage) return false;
            const nextDate = new Date(nextMessage.timestamp);
            const curDate = new Date(message.timestamp);
            return (
              curDate.getFullYear() !== nextDate.getFullYear() ||
              curDate.getMonth() !== nextDate.getMonth() ||
              curDate.getDate() !== nextDate.getDate()
            );
          })();

          return (
            <>
              {showUnreadDivider && (
                <div className="my-3 text-center text-xs text-muted-foreground">
                  ─── 새로운 메시지 ───
                </div>
              )}
              <MessageItem
                key={message.id}
                message={message}
                index={index}
                total={messages.length}
                currentUserId={currentUserId}
                showAvatar={showAvatar}
                groupPosition={groupPosition}
                isGroupStart={isGroupStart}
                isGroupEnd={isGroupEnd}
                showTailTimestamp={showTailTimestamp}
                showDayDivider={showDayDivider}
                registerMessageNode={registerMessageNode}
                onReactMessage={onReactMessage}
                onUnreactMessage={onUnreactMessage}
                onEditOrConfirm={onEditOrConfirm}
                editingMessageId={editingMessageId}
                editingContent={editingContent}
                setEditingMessageId={setEditingMessageId}
                setEditingContent={setEditingContent}
                isMyMessage={isMyMessage}
                onImageLoad={() => {
                  if (atBottom) {
                    requestAnimationFrame(() =>
                      virtuosoRef.current?.scrollToIndex?.({
                        index: Number.MAX_SAFE_INTEGER,
                        align: 'end',
                        behavior: 'auto',
                      }),
                    );
                  }
                }}
                isReactionOpen={isReactionOpenId === message.id}
                onCloseReaction={() => setReactionOpenId(null)}
                EMOJIS={EMOJIS}
                onBeginLongPress={onBeginLongPress}
                onCancelLongPress={onCancelLongPress}
                formatMessageTime={formatMessageTime}
                onRetryMessage={onRetryMessage}
                onCancelPending={onCancelPending}
              />
            </>
          );
        }}
      />
    );
  }
);

MessageList.displayName = 'MessageList';
