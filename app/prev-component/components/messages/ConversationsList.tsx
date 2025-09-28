import React from 'react';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/src/components/ui/avatar';
import { MessageCircle, Plus, Search, Users } from '@/src/components/icons';
import type { Conversation } from '@/src/types/chat';
import { format } from 'date-fns';

export function ConversationsList({
  conversations,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
  formatMessageTime,
  fullScreen = false,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  query: string;
  onQueryChange: (v: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  formatMessageTime: (ts: string) => string;
  fullScreen?: boolean;
}) {
  const filtered = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(query.toLowerCase()) ||
      conv.participants.some((p) => p.name.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className={`${fullScreen ? 'w-full min-w-0' : 'w-80 min-w-[280px]'} ${fullScreen ? '' : 'border-r'} bg-muted/20 flex flex-col`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            메시지
          </h2>
          <Button size="sm" variant="ghost" className="p-2" onClick={onCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="대화 검색..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 h-0">
        <div className="p-2">
          {filtered.map((conversation) => (
            <div
              key={conversation.id}
              data-testid={`chat-item-${conversation.id}`}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedId === conversation.id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelect(conversation.id)}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.avatar} alt={conversation.name} />
                  <AvatarFallback>
                    {conversation.type === 'group' ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      conversation.name.slice(0, 2)
                    )}
                  </AvatarFallback>
                </Avatar>
                {conversation.type === 'direct' && conversation.participants[0]?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{conversation.name}</p>
                    {conversation.type === 'trip' && (
                      <Badge variant="secondary" className="text-xs">
                        여행
                      </Badge>
                    )}
                    {conversation.type === 'meetup' && (
                      <Badge variant="secondary" className="text-xs">
                        모임
                      </Badge>
                    )}
                    {conversation.isPinned && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {conversation.lastMessage &&
                      formatMessageTime(conversation.lastMessage.timestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {conversation.lastMessage?.content || '대화를 시작해보세요'}
                  </p>
                  <div className="flex items-center gap-1">
                    {conversation.isMuted && (
                      <div className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                      </div>
                    )}
                    {conversation.unreadCount > 0 && selectedId !== conversation.id && (
                      <Badge variant="destructive" className="h-5 min-w-[20px] text-xs">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
