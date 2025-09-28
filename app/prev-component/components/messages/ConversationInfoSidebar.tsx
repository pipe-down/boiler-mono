import React from 'react';
import type { Conversation } from '@/src/types/chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { Users, Search, Image as ImageIcon } from '@/src/components/icons';
import { Badge } from '@/src/components/ui/badge';
import { leaveChat } from '@/src/services/api/chats';

export function ConversationInfoSidebar({
  conversation,
  isOpen,
  onClose,
}: {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="w-80 min-w-[280px] border-l bg-muted/20 p-4 overflow-y-auto">
      <div className="space-y-6">
        <div className="text-center">
          <Avatar className="h-20 w-20 mx-auto mb-3">
            <AvatarImage src={conversation.avatar} alt={conversation.name} />
            <AvatarFallback className="text-xl">
              {conversation.type === 'group' ? (
                <Users className="h-8 w-8" />
              ) : (
                conversation.name.slice(0, 2)
              )}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-medium">{conversation.name}</h3>
          <p className="text-sm text-muted-foreground">
            {conversation.type === 'direct'
              ? '개인 대화'
              : `그룹 대화 · ${conversation.participants.length}명`}
          </p>
        </div>

        {conversation.relatedItem && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {conversation.relatedItem.type === 'trip' ? '여행' : '모임'}
              </span>
            </div>
            <p className="text-sm">{conversation.relatedItem.title}</p>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-3">참여자 ({conversation.participants.length})</h4>
          <div className="space-y-2">
            {conversation.participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback className="text-xs">
                      {participant.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {participant.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-background rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{participant.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={async () => {
              if (!confirm('이 채팅방을 나가시겠어요? 이 작업은 되돌릴 수 없습니다.')) return;
              try {
                await leaveChat(Number(conversation.id));
              } catch {}
              try {
                window.dispatchEvent(
                  new CustomEvent('chat:room-removed', { detail: { roomId: conversation.id } }),
                );
              } catch {}
              onClose();
            }}
          >
            채팅방 나가기
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
