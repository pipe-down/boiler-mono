import React from 'react';
import type { Conversation } from '@/src/types/chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { Users, Phone, Video, Info, ArrowLeft } from '@/src/components/icons';

export function ConversationHeader({
  conversation,
  typingUsers,
  onToggleInfo,
  formatLastSeen,
  showBack,
  onBack,
}: {
  conversation: Conversation;
  typingUsers: string[];
  onToggleInfo: () => void;
  formatLastSeen: (lastSeen: string) => string;
  showBack?: boolean;
  onBack?: () => void;
}) {
  return (
<div className="sticky top-0 z-20 p-4 pt-[env(safe-area-inset-top)] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              size="sm"
              variant="ghost"
              className="p-2 -ml-2"
              aria-label="뒤로"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.avatar} alt={conversation.name} />
            <AvatarFallback>
              {conversation.type === 'group' ? (
                <Users className="h-5 w-5" />
              ) : (
                conversation.name.slice(0, 2)
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{conversation.name}</p>
            {typingUsers.length > 0 ? (
              <p className="text-xs text-blue-600">{typingUsers.join(', ')} 님이 입력 중...</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {conversation.type === 'direct' ? (
                  conversation.participants[0]?.isOnline ? (
                    <span className="text-green-600">온라인</span>
                  ) : (
                    conversation.participants[0]?.lastSeen &&
                    formatLastSeen(conversation.participants[0].lastSeen)
                  )
                ) : (
                  `${conversation.participants.length}명 참여`
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="p-2" aria-label="음성 통화">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="p-2" aria-label="영상 통화">
            <Video className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="p-2"
            aria-label="대화 정보"
            onClick={onToggleInfo}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
