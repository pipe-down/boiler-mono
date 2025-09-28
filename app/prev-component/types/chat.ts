export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  serverSeq?: number;
  type: 'text' | 'image' | 'location' | 'trip' | 'meetup';
  metadata?: {
    imageUrl?: string;
    location?: { lat: number; lng: number; name: string };
    tripId?: string;
    meetupId?: string;
    errorMessage?: string;
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isEdited?: boolean;
  readBy?: Array<{ id: string; name: string; at?: string }>;
  reactions?: Array<{ emoji: string; count: number; reactedByMe?: boolean }>;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'trip' | 'meetup';
  name: string;
  avatar?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  createdAt: string;
  relatedItem?: {
    id: string;
    title: string;
    type: 'trip' | 'meetup';
  };
}

// ==== WebSocket Event Types (v2) ====

// 서버에서 브로드캐스트되는 신규 메시지 이벤트
export interface ChatMessageEvent {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  senderProfileImageUrl?: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  imageUrl?: string;
  createdAt: string;
  serverSeq?: number;
  clientMessageId?: string;
  deliveredAt?: string;
}

// 타이핑 상태 이벤트
export interface ChatTypingEvent {
  chatRoomId: number;
  userId?: number;
  userName?: string;
  isTyping: boolean;
}

// 읽음 확인(리드 리시트) 이벤트 — 특정 메시지 ID 리스트가 포함됨
export interface ChatReadReceiptEvent {
  chatRoomId: number;
  readerId: number;
  messageIds: number[];
  readAt?: string;
  readerName?: string;
}

// 반응(이모지) 이벤트 — 서버 구현 형태에 맞게 유연 처리
export interface ChatReactionEvent {
  chatRoomId: number;
  messageId: number;
  // either a delta event
  emoji?: string;
  action?: 'ADD' | 'REMOVE';
  userId?: number;
  // or a full sync summary
  reactions?: Array<{ emoji: string; count: number }>;
}
