import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { ConversationsList } from '@/src/components/messages/ConversationsList';
import { MessageList } from '@/src/components/messages/MessageList';
import type { MessageListHandle } from '@/src/components/messages/MessageList';
import { MessageInput } from '@/src/components/messages/MessageInput';
import { ConversationHeader } from '@/src/components/messages/ConversationHeader';
import { ConversationInfoSidebar } from '@/src/components/messages/ConversationInfoSidebar';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Users,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Download,
} from '@/src/components/icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { TripSelector } from '@/src/components/messages/dialogs/TripSelector';
import { SearchDialog } from '@/src/components/messages/dialogs/SearchDialog';
import { CreateDialog } from '@/src/components/messages/dialogs/CreateDialog';
import { MediaDialog } from '@/src/components/messages/dialogs/MediaDialog';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Message, Conversation } from '@/src/types/chat';

import { searchChatMessages } from '@/src/services/api/chats';
import { useMyTrips } from '@/src/hooks/api/useTrips';
import { getChatMessages } from '@/src/services/api/chats';
import { searchUsers } from '@/src/services/api/users';
// extracted utils
import { MAX_SEARCH_LOAD_PAGES, EMOJI_SET } from '@/src/components/messages/utils/constants';
import { renderContentWithLinks, renderHighlighted } from '@/src/components/messages/utils/links';
import { parseFileMessage, extractUrls, isImageUrl } from '@/src/components/messages/utils/files';
import { FileAttachmentCard } from '@/src/components/messages/FileAttachmentCard';
import { useWebSocket } from '@/src/providers/WebSocketProvider';
import { useIsMobile } from '@/src/hooks/useIsMobile';
import { useFitViewport } from '@/src/hooks/useFitViewport';

interface MessagesProps {
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  selectedConversationId?: string | null;
  onSendMessage: (
    conversationId: string,
    content: string,
    type?: Message['type'],
    metadata?: Message['metadata'],
  ) => void;
  onCreateConversation: (participantIds: string[], name?: string) => void;
  onMarkAsRead: (conversationId: string) => void;
  onTyping?: (conversationId: string, isTyping: boolean) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  typingUsers?: string[];
  onMessagesVisible?: (conversationId: string, messageIds: string[]) => void;
  visibilityConfig?: {
    threshold?: number;
    rootMargin?: string;
    batchMs?: number;
    maxObserved?: number;
  };
  onPrependMessages?: (conversationId: string, olderMessages: Message[]) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onUnreactMessage?: (messageId: string, emoji: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onCancelPending?: (messageId: string) => void;
  onBottomStateChange?: (isAtBottom: boolean) => void;
}

export function Messages({
  currentUser,
  conversations,
  messages,
  selectedConversationId,
  onSendMessage,
  onCreateConversation,
  onMarkAsRead,
  onTyping,
  onEditMessage,
  onDeleteMessage,
  typingUsers = [],
  onMessagesVisible,
  visibilityConfig,
  onPrependMessages,
  onReactMessage,
  onUnreactMessage,
  onRetryMessage,
  onCancelPending,
  onBottomStateChange,
}: MessagesProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const isMobile = useIsMobile();
  // 외부에서 선택 방이 주어지면 동기화
  useEffect(() => {
    if (selectedConversationId && selectedConversationId !== selectedConversation) {
      setSelectedConversation(selectedConversationId);
    }
  }, [selectedConversationId, selectedConversation]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createMode, setCreateMode] = useState<'direct' | 'meeting'>('direct');
  const [targetUserId, setTargetUserId] = useState('');
  const [meetingTripId, setMeetingTripId] = useState('');
  const [meetingName, setMeetingName] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const reportedRef = useRef<Set<string>>(new Set());
  const batchRef = useRef<Set<string>>(new Set());
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observedNodesRef = useRef<Map<string, Element>>(new Map());
  const [atBottom, setAtBottom] = useState(true);
  useEffect(() => {
    onBottomStateChange?.(atBottom);
  }, [atBottom, onBottomStateChange]);
  const messageListRef = useRef<MessageListHandle | null>(null);
  const [reactionOpenId, setReactionOpenId] = useState<string | null>(null);
  const pressTimerRef = useRef<any>(null);
  const viewportHRef = useRef<number>(0);
  const { connected } = useWebSocket();
  const [offline, setOffline] = useState<boolean>(false);
  const [newSinceBottom, setNewSinceBottom] = useState<number>(0);
  const lastCountRef = useRef<number>(0);
  const lastLatestIdRef = useRef<string | null>(null);
  const [inputHeight, setInputHeight] = useState(0);
  const [scrollbarPad, setScrollbarPad] = useState(0);

  function beginLongPress(id: string) {
    try {
      clearTimeout(pressTimerRef.current);
    } catch {}
    pressTimerRef.current = setTimeout(() => setReactionOpenId(id), 400);
  }
  function cancelLongPress() {
    try {
      clearTimeout(pressTimerRef.current);
    } catch {}
    pressTimerRef.current = null;
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReactionOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    const onPointer = (e: Event) => {
      if (!reactionOpenId) return;
      try {
        const el = e.target as Element;
        // 열린 메시지 버블 영역 밖을 탭하면 닫기
        if (!el.closest?.(`[data-mid="${reactionOpenId}"]`)) setReactionOpenId(null);
      } catch {}
    };
    window.addEventListener('pointerdown', onPointer, true);
    // 모바일 키보드(visualViewport) 열림/닫힘 시 하단 고정 유지
    try {
      const vv = (window as any).visualViewport as VisualViewport | undefined;
      if (vv) {
        viewportHRef.current = Math.round(vv.height);
        const onResize = () => {
          const h = Math.round(vv.height);
          const changed = Math.abs(h - viewportHRef.current) > 8;
          viewportHRef.current = h;
          if (changed && atBottom) {
            requestAnimationFrame(() => {
              messageListRef.current?.scrollToBottom?.('auto');
            });
          }
        };
        vv.addEventListener('resize', onResize);
        return () => {
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('pointerdown', onPointer, true);
          vv.removeEventListener('resize', onResize);
        };
      }
    } catch {}
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer, true);
    };
  }, [reactionOpenId, atBottom]);

  // 단축키: ⌘/Ctrl+K 검색, End 키 하단 이동
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowSearchDialog(true);
      }
      if (e.key === 'End' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        requestAnimationFrame(() => messageListRef.current?.scrollToBottom?.('smooth'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 네트워크 온라인/오프라인 상태 감지
  useEffect(() => {
    const apply = () => setOffline(typeof navigator !== 'undefined' && navigator.onLine === false);
    apply();
    window.addEventListener('online', apply);
    window.addEventListener('offline', apply);
    return () => {
      window.removeEventListener('online', apply);
      window.removeEventListener('offline', apply);
    };
  }, []);

  // 페이징(과거 로드)
  const roomPageRef = useRef<Record<string, number>>({});
  const roomHasMoreRef = useRef<Record<string, boolean | undefined>>({});
  const roomLoadingRef = useRef<Record<string, boolean>>({});
  const [, setLoadingOlder] = useState(false);
  const prefetchingRef = useRef<string | null>(null);

  const cfg = {
    threshold: visibilityConfig?.threshold ?? 0.6,
    rootMargin: visibilityConfig?.rootMargin ?? '0px',
    batchMs: visibilityConfig?.batchMs ?? 200,
    maxObserved: visibilityConfig?.maxObserved ?? 200,
  };

  // moved to utils/constants

  // Virtuoso가 스크롤을 관리하므로 별도 앵커 훅은 사용하지 않습니다.

  const prevRoomRef = useRef<string | null>(null);
  // 마지막 메시지 변화만을 관찰해 불필요한 스크롤 방지
  const lastTs = useMemo(() => {
    if (!selectedConversation) return '';
    const arr = messages[selectedConversation] || [];
    return arr.length ? (arr[arr.length - 1]?.timestamp ?? '') : '';
  }, [selectedConversation, messages]);

  useLayoutEffect(() => {
    prevRoomRef.current = selectedConversation;
  }, [selectedConversation, lastTs]);

  // 방 변경 시 새 메시지 카운터 초기화
  useEffect(() => {
    setNewSinceBottom(0);
    lastLatestIdRef.current = null;
  }, [selectedConversation]);

  // (Virtuoso startReached가 과거 로딩을 담당)
  // 하단 이탈 상태에서 새 메시지가 도착하면 카운트 증가 + 점프 버튼 노출
  useEffect(() => {
    if (!selectedConversation) return;
    const arr = messages[selectedConversation] || [];
    const latestId = arr.length ? arr[arr.length - 1]?.id : null;
    const isNewArrival = latestId && latestId !== lastLatestIdRef.current;
    if (isNewArrival) {
      // 자신이 보낸 메시지는 제외(낙관적/즉시 스크롤 방지)
      const last = arr[arr.length - 1];
      const fromMe = last?.senderId === currentUser.id;
      if (!atBottom && !fromMe) {
        setNewSinceBottom((n) => n + 1);
      }
      lastLatestIdRef.current = String(latestId);
    }
    // 하단으로 스크롤되면 카운터 초기화
    if (atBottom && newSinceBottom !== 0) setNewSinceBottom(0);
  }, [selectedConversation, messages, atBottom, currentUser.id, newSinceBottom]);

  const loadOlder = React.useCallback(async (conversationId: string) => {
    if (roomHasMoreRef.current[conversationId] === false) return;
    if (roomLoadingRef.current[conversationId]) return;
    roomLoadingRef.current[conversationId] = true;
    const prevPage = roomPageRef.current[conversationId] ?? 0;
    const nextPage = prevPage + 1;
    roomPageRef.current[conversationId] = nextPage;
    setLoadingOlder(true);
    try {
      const older = await getChatMessages(Number(conversationId), { page: nextPage, size: 50 });
      const mapped: Message[] = (older || []).map((m: any) => ({
        id: String(m.id),
        senderId: String(m.senderId),
        senderName: m.senderName,
        senderAvatar: m.senderProfileImageUrl,
        content: m.content,
        timestamp: m.createdAt,
        type: m.messageType === 'IMAGE' ? 'image' : 'text',
        status: 'delivered',
      }));
      // Provide older chunk to parent; Virtuoso가 위치 보정을 처리
      try {
        onPrependMessages?.(conversationId, mapped);
      } catch {}
      const hasMore = (older || []).length >= 50;
      roomHasMoreRef.current[conversationId] = hasMore;
      const storedPage = mapped.length > 0 ? nextPage : prevPage;
      try {
        localStorage.setItem('chat:pages:' + conversationId, String(storedPage));
      } catch {}
      if (mapped.length === 0) {
        // 데이터가 없으면 페이지 마커를 이전 값으로 되돌려 재시도 타이밍 유지
        roomPageRef.current[conversationId] = prevPage;
      }
    } catch {
      roomPageRef.current[conversationId] = prevPage;
      roomHasMoreRef.current[conversationId] = false;
    } finally {
      roomLoadingRef.current[conversationId] = false;
      setLoadingOlder(false);
    }
  }, [onPrependMessages]);

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    onMarkAsRead(conversationId);
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);
  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  // 방 전환 시, 저장된 페이지 수만큼 과거 페이지를 사전 로드(초기 로딩 가속)
  useEffect(() => {
    const convId = selectedConversation;
    if (!convId) return;
    if (prefetchingRef.current === convId) return;
    let saved = 0;
    try {
      const raw = localStorage.getItem('chat:pages:' + convId);
      if (raw) saved = Math.max(0, Math.min(10, Number(raw) || 0)); // 안전한 상한
    } catch {}
    if (saved <= 0) return;
    // 현재 로딩된 페이지 수보다 더 필요하면 순차 프리패치
    const current = roomPageRef.current[convId] ?? 0;
    if (current >= saved) return;
    if (conversationMessages.length === 0) {
      // SWR의 page 0 도착을 기다렸다가 시작
      return;
    }
    prefetchingRef.current = convId;
    (async () => {
      try {
        let cur = roomPageRef.current[convId] ?? 0;
        while (cur < saved) {
          const beforeHasMore = roomHasMoreRef.current[convId];
          if (beforeHasMore === false) break;
          await loadOlder(convId);
          cur = roomPageRef.current[convId] ?? 0;
          const afterHasMore = roomHasMoreRef.current[convId];
          if (afterHasMore === false) break;
        }
      } finally {
        if (prefetchingRef.current === convId) prefetchingRef.current = null;
      }
    })();
  }, [selectedConversation, conversationMessages.length, loadOlder]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return '어제 ' + format(date, 'HH:mm');
    } else {
      return format(date, 'MM/dd HH:mm');
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    return formatDistanceToNow(new Date(lastSeen), {
      addSuffix: true,
      locale: ko,
    });
  };

  // 검색 결과 클릭 시: 대상 메시지가 보일 때까지 자동으로 과거 페이지를 로드
  function raf() {
    return new Promise<void>((r) => requestAnimationFrame(() => r()));
  }

  async function scrollToMessageOrLoad(targetMessageId: string): Promise<boolean> {
    // 이미 로드되어 있으면 즉시 스크롤
    const existing = document.querySelector(
      `[data-mid="${targetMessageId}"]`,
    ) as HTMLElement | null;
    if (existing) {
      try {
        existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        existing.classList?.add('ring-2', 'ring-primary', 'rounded');
        setTimeout(() => existing.classList?.remove('ring-2', 'ring-primary', 'rounded'), 1600);
      } catch {}
      return true;
    }
    const convId = selectedConversation;
    if (!convId) return false;

    let attempts = 0;
    while (attempts < MAX_SEARCH_LOAD_PAGES) {
      // 더 로드할 수 없으면 중단
      if (roomHasMoreRef.current[convId] === false) break;
      await loadOlder(convId);
      // 렌더링 반영 대기 후 재시도 (프레임 동기화)
      await raf();
      const el = document.querySelector(`[data-mid="${targetMessageId}"]`) as HTMLElement | null;
      if (el) {
        try {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList?.add('ring-2', 'ring-primary', 'rounded');
          setTimeout(() => el.classList?.remove('ring-2', 'ring-primary', 'rounded'), 1600);
        } catch {}
        return true;
      }
      attempts++;
    }
    return false;
  }

  // IntersectionObserver 초기화/정리 (뷰포트 가시성 기준 읽음 처리)
  useEffect(() => {
    reportedRef.current.clear();
    batchRef.current.clear();
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    if (ioRef.current) {
      ioRef.current.disconnect();
      ioRef.current = null;
    }
    ioRef.current = new IntersectionObserver(
      (entries) => {
        const nowConv = selectedConversation;
        const newlyVisible: string[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            const mid = entry.target.dataset.mid;
            const msender = entry.target.dataset.sender;
            const mstatus = entry.target.dataset.status;
            if (!mid) continue;
            if (msender === currentUser.id) continue;
            if (mstatus === 'read') continue;
            if (reportedRef.current.has(mid)) continue;
            reportedRef.current.add(mid);
            newlyVisible.push(mid);
          }
        }
        if (newlyVisible.length && nowConv && onMessagesVisible) {
          for (const id of newlyVisible) batchRef.current.add(id);
          if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
          batchTimerRef.current = setTimeout(() => {
            const ids = Array.from(batchRef.current);
            batchRef.current.clear();
            onMessagesVisible(nowConv, ids);
          }, cfg.batchMs);
        }
      },
      { root: null, threshold: cfg.threshold, rootMargin: cfg.rootMargin },
    );
    return () => {
      try {
        ioRef.current?.disconnect();
      } catch {}
    };
  }, [
    selectedConversation,
    currentUser.id,
    onMessagesVisible,
    cfg.threshold,
    cfg.rootMargin,
    cfg.batchMs,
    reactionOpenId,
    atBottom,
  ]);

  const registerMessageNode = useCallback(
    (message: Message, index: number, total: number, el: HTMLDivElement | null) => {
      const io = ioRef.current;
      if (!io) return;
      const prev = observedNodesRef.current.get(message.id);
      if (prev && prev !== el) {
        try {
          io.unobserve(prev);
        } catch {}
        observedNodesRef.current.delete(message.id);
      }
      if (!el) return;
      if (message.senderId === currentUser.id || message.status === 'read') {
        try {
          io.unobserve(el);
        } catch {}
        observedNodesRef.current.delete(message.id);
        return;
      }
      if (total > cfg.maxObserved) {
        const startIdx = total - cfg.maxObserved;
        if (index < startIdx) return;
      }
      el.dataset.mid = message.id;
      el.dataset.sender = message.senderId;
      el.dataset.status = message.status;
      try {
        io.observe(el);
        observedNodesRef.current.set(message.id, el);
      } catch {}
    },
    [currentUser.id, cfg.maxObserved],
  );

  // moved: renderContentWithLinks to utils/links
  // moved: file/url helpers to utils/files
  // moved: FileAttachmentCard to components/messages/FileAttachmentCard

  const [followMode, setFollowMode] = useState<'auto' | 'smooth'>('smooth');

  // Prepare mobile viewport ref and hook unconditionally to satisfy Hooks rules
  const mobileRootRef = React.useRef<HTMLDivElement>(null);
  useFitViewport(mobileRootRef);

  const messageBottomGap = useMemo(() => {
    if (inputHeight <= 0) return 12;
    const effective = Math.max(0, inputHeight - 16);
    const base = isMobile ? effective * 0.6 + 18 : effective * 0.4 + 12;
    const capped = Math.min(base, isMobile ? 72 : 40);
    return Math.max(12, Math.round(capped));
  }, [inputHeight, isMobile]);

  const handleInputHeightChange = useCallback((height: number) => {
    setInputHeight((prev) => {
      const next = Math.max(0, Math.round(height));
      if (Math.abs(prev - next) <= 2) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!atBottom) return;
    const id = requestAnimationFrame(() => {
      messageListRef.current?.scrollToBottom?.('auto');
    });
    return () => cancelAnimationFrame(id);
  }, [messageBottomGap, atBottom]);

  useEffect(() => {
    if (!selectedConversation) {
      setScrollbarPad(0);
      return;
    }
    let frame: number | null = null;
    let scroller: HTMLElement | null = null;
    const Observer = typeof ResizeObserver !== 'undefined' ? ResizeObserver : null;
    let ro: ResizeObserver | null = null;

    const compute = () => {
      if (!scroller) return;
      const pad = Math.max(0, Math.round(scroller.offsetWidth - scroller.clientWidth));
      setScrollbarPad((prev) => (Math.abs(prev - pad) > 1 ? pad : prev));
    };

    const setup = () => {
      const container = listContainerRef.current;
      scroller = container?.querySelector<HTMLElement>('.chat-scroll') ?? null;
      if (!scroller) {
        frame = requestAnimationFrame(setup);
        return;
      }
      compute();
      if (Observer) {
        ro = new Observer(() => compute());
        ro.observe(scroller);
      }
      window.addEventListener('resize', compute);
    };

    frame = requestAnimationFrame(setup);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('resize', compute);
      if (ro && scroller) {
        try {
          ro.unobserve(scroller);
        } catch {}
      }
      ro?.disconnect?.();
    };
  }, [selectedConversation, showConversationInfo, isMobile]);

  const scrollPadStyle = useMemo(
    () => ({ '--scrollbar-pad': `${scrollbarPad}px` } as React.CSSProperties),
    [scrollbarPad],
  );

  // Mobile single-pane rendering (list OR chat)
  if (isMobile) {
    return (
      <div
        ref={mobileRootRef}
        className="flex h-full flex-col min-w-0 min-h-0 bg-background relative overflow-x-hidden"
        style={scrollPadStyle}
      >
        {selectedConv ? (
          <>
            <ConversationHeader
              conversation={selectedConv}
              typingUsers={typingUsers}
              onToggleInfo={() => setShowConversationInfo(!showConversationInfo)}
              formatLastSeen={formatLastSeen}
              showBack
              onBack={() => setSelectedConversation(null)}
            />

            <div className="flex-1 min-h-0 min-w-0 overflow-x-hidden px-2 pt-2 pb-0">
              <div ref={listContainerRef} className="h-full min-w-0 overflow-hidden">
                <MessageList
                  ref={messageListRef}
                  messages={conversationMessages}
                  currentUserId={currentUser.id}
                  atBottom={atBottom}
                  setAtBottom={(val) => setAtBottom(val)}
                  unreadSinceTimestamp={
                    (selectedConversation && typeof window !== 'undefined'
                      ? localStorage.getItem('chat:lastSeenAt:' + selectedConversation)
                      : null) || null
                  }
                  registerMessageNode={(message, index, total, el) =>
                    registerMessageNode(message, index, total, el)
                  }
                  bottomGap={messageBottomGap}
                  onStartReached={() => {
                    const id = selectedConversation;
                    if (!id) return;
                    if (roomHasMoreRef.current[id] === false) return; // no more pages
                    loadOlder(id);
                  }}
                  onReactMessage={onReactMessage}
                  onUnreactMessage={onUnreactMessage}
                  onRetryMessage={onRetryMessage}
                  onCancelPending={onCancelPending}
                  onEditOrConfirm={(message, content) => {
                    if (editingMessageId === message.id) {
                      if (content.trim()) {
                        onTyping?.(selectedConversation!, false);
                        if (typeof onEditMessage === 'function') onEditMessage(message.id, content);
                        else
                          try {
                            window.dispatchEvent(
                              new CustomEvent('chat:edit', {
                                detail: { messageId: message.id, content },
                              }),
                            );
                          } catch {}
                        setEditingMessageId(null);
                        setEditingContent('');
                      }
                    } else {
                      setEditingMessageId(message.id);
                      setEditingContent(message.content);
                    }
                  }}
                  editingMessageId={editingMessageId}
                  editingContent={editingContent}
                  setEditingMessageId={setEditingMessageId}
                  setEditingContent={setEditingContent}
                  isReactionOpenId={reactionOpenId}
                  setReactionOpenId={setReactionOpenId}
                  EMOJIS={EMOJI_SET as unknown as string[]}
                  onBeginLongPress={beginLongPress}
                  onCancelLongPress={cancelLongPress}
                  formatMessageTime={formatMessageTime}
                  followMode={followMode}
                />
              </div>
            </div>

            <MessageInput
              conversationId={selectedConversation}
              onSendMessage={onSendMessage}
              onTyping={onTyping}
              onAfterSend={() => {
                setFollowMode('auto');
                requestAnimationFrame(() => {
                  messageListRef.current?.scrollToBottom?.('auto');
                  requestAnimationFrame(() => setFollowMode('smooth'));
                });
              }}
              onHeightChange={handleInputHeightChange}
            />

            {!atBottom && newSinceBottom > 0 && (
              <div className="absolute bottom-24 right-4">
                <button
                  className="px-3 py-2 rounded-full shadow-lg bg-primary text-primary-foreground text-sm border"
                  onClick={() => {
                    setNewSinceBottom(0);
                    requestAnimationFrame(() => messageListRef.current?.scrollToBottom?.('smooth'));
                  }}
                  aria-label="새 메시지로 이동"
                  data-testid="jump-to-latest"
                >
                  새 메시지 {newSinceBottom}개 보기
                </button>
              </div>
            )}

            {/* Mobile info bottom sheet */}
            <Dialog open={showConversationInfo} onOpenChange={setShowConversationInfo}>
              <DialogContent className="p-0 max-w-md">
                <div className="max-h-[85vh] overflow-y-auto">
                  <ConversationInfoSidebar
                    conversation={selectedConv}
                    isOpen={true}
                    onClose={() => setShowConversationInfo(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <ConversationsList
            conversations={conversations}
            selectedId={selectedConversation}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelect={handleConversationSelect}
            onCreate={() => setShowCreateDialog(true)}
            formatMessageTime={formatMessageTime}
            fullScreen
          />
        )}

        {/* Create/Search/Media dialogs stay available */}
        <CreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateConversation={onCreateConversation}
          onCreateMeeting={async (tripId, name, description) => {
            const ev = new CustomEvent('chat:create-meeting', {
              detail: { tripId, name, description },
            });
            window.dispatchEvent(ev);
            return undefined;
          }}
          onCreated={(roomId) => {
            setSelectedConversation(roomId);
            try {
              localStorage.setItem('chat:last-room-id', roomId);
            } catch {}
            onMarkAsRead(roomId);
          }}
        />

        <SearchDialog
          open={showSearchDialog}
          onOpenChange={setShowSearchDialog}
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
          results={searchResults}
          onSubmit={async () => {
            if (selectedConversation && searchKeyword.trim()) {
              try {
                const res = await searchChatMessages(
                  Number(selectedConversation),
                  searchKeyword.trim(),
                );
                const mapped: Message[] = res.map((m: any) => ({
                  id: String(m.id),
                  senderId: String(m.senderId),
                  senderName: m.senderName,
                  content: m.content,
                  timestamp: m.createdAt,
                  type: m.messageType === 'IMAGE' ? 'image' : 'text',
                  status: 'delivered',
                  reactions: Array.isArray(m.reactions) ? m.reactions : [],
                }));
                setSearchResults(mapped);
              } catch {
                toast.error('검색 실패');
              }
            }
          }}
          onClickResult={async (mid) => {
            const success = await scrollToMessageOrLoad(mid);
            if (!success) toast.info('해당 메시지를 찾지 못했습니다.');
          }}
        />

        <MediaDialog open={showMediaDialog} onOpenChange={setShowMediaDialog} messages={conversationMessages} />
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-1 min-h-0 w-full max-w-full border rounded-lg overflow-x-hidden bg-background relative"
      style={scrollPadStyle}
    >
      {/* 대화 목록 */}
      <div className="hidden md:flex flex-shrink-0">
        <ConversationsList
          conversations={conversations}
          selectedId={selectedConversation}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onSelect={handleConversationSelect}
          onCreate={() => setShowCreateDialog(true)}
          formatMessageTime={formatMessageTime}
        />
      </div>

      {/* 대화 영역 */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        {/* 연결 상태/오프라인 배너 */}
        {(!connected || offline) && (
          <div className="px-3 py-2 text-xs bg-amber-50 text-amber-700 border-b border-amber-200 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
            {offline
              ? '오프라인 상태입니다. 네트워크 연결을 확인하세요.'
              : '채팅 서버와 연결 중...'}
          </div>
        )}
        {selectedConv ? (
          <>
            {/* 대화 헤더 */}
            <ConversationHeader
              conversation={selectedConv}
              typingUsers={typingUsers}
              onToggleInfo={() => setShowConversationInfo(!showConversationInfo)}
              formatLastSeen={formatLastSeen}
            />

            {/* 메시지 목록 (가상화) */}
            <div className="flex-1 min-h-0 min-w-0 overflow-x-hidden px-4 pt-2 pb-4">
              <div ref={listContainerRef} className="h-full min-w-0 overflow-hidden">
                <MessageList
                  ref={messageListRef}
                  messages={conversationMessages}
                  currentUserId={currentUser.id}
                  atBottom={atBottom}
                  setAtBottom={(val) => setAtBottom(val)}
                  unreadSinceTimestamp={
                    (selectedConversation && typeof window !== 'undefined'
                      ? localStorage.getItem('chat:lastSeenAt:' + selectedConversation)
                      : null) || null
                  }
                  registerMessageNode={(message, index, total, el) =>
                    registerMessageNode(message, index, total, el)
                  }
                  bottomGap={messageBottomGap}
                  onStartReached={() => {
                    if (selectedConversation) loadOlder(selectedConversation);
                  }}
                  onReactMessage={onReactMessage}
                  onUnreactMessage={onUnreactMessage}
                  onRetryMessage={onRetryMessage}
                  onCancelPending={onCancelPending}
                  onEditOrConfirm={(message, content) => {
                    if (editingMessageId === message.id) {
                      if (content.trim()) {
                        onTyping?.(selectedConversation!, false);
                        if (typeof onEditMessage === 'function') onEditMessage(message.id, content);
                        else
                          try {
                            window.dispatchEvent(
                              new CustomEvent('chat:edit', {
                                detail: { messageId: message.id, content },
                              }),
                            );
                          } catch {}
                        setEditingMessageId(null);
                        setEditingContent('');
                      }
                    } else {
                      setEditingMessageId(message.id);
                      setEditingContent(message.content);
                    }
                  }}
                  editingMessageId={editingMessageId}
                  editingContent={editingContent}
                  setEditingMessageId={setEditingMessageId}
                  setEditingContent={setEditingContent}
                  isReactionOpenId={reactionOpenId}
                  setReactionOpenId={setReactionOpenId}
                  EMOJIS={EMOJI_SET as unknown as string[]}
                  onBeginLongPress={beginLongPress}
                  onCancelLongPress={cancelLongPress}
                  formatMessageTime={formatMessageTime}
                  followMode={followMode}
                />
              </div>
            </div>

            {/* 메시지 입력 */}
            <MessageInput
              conversationId={selectedConversation}
              onSendMessage={onSendMessage}
              onTyping={onTyping}
              onAfterSend={() => {
                // 내 전송: 스무스 금지 + 즉시 하단 고정
                setFollowMode('auto');
                requestAnimationFrame(() => {
                  messageListRef.current?.scrollToBottom?.('auto');
                  // 다음 프레임에 부드러움 복구
                  requestAnimationFrame(() => setFollowMode('smooth'));
                });
              }}
              onHeightChange={handleInputHeightChange}
            />
            {/* 하단 점프 버튼: 새 메시지 */}
            {!atBottom && newSinceBottom > 0 && (
              <div className="absolute bottom-24 right-6">
                <button
                  className="px-3 py-2 rounded-full shadow-lg bg-primary text-primary-foreground text-sm border"
                  onClick={() => {
                    setNewSinceBottom(0);
                    requestAnimationFrame(() => messageListRef.current?.scrollToBottom?.('smooth'));
                  }}
                  aria-label="새 메시지로 이동"
                  data-testid="jump-to-latest"
                >
                  새 메시지 {newSinceBottom}개 보기
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="mb-2">대화를 선택하세요</h3>
              <p className="text-muted-foreground">
                왼쪽에서 대화를 선택하거나 새로운 대화를 시작해보세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 대화 생성 다이얼로그 */}
      <CreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateConversation={onCreateConversation}
        onCreateMeeting={async (tripId, name, description) => {
          // Messages는 단순 포워딩만 수행; 실제 생성/rooms mutate/선택은 상위 onCreateMeeting에서 처리하도록 함
          const ev = new CustomEvent('chat:create-meeting', {
            detail: { tripId, name, description },
          });
          window.dispatchEvent(ev);
          return undefined;
        }}
        onCreated={(roomId) => {
          setSelectedConversation(roomId);
          try {
            localStorage.setItem('chat:last-room-id', roomId);
          } catch {}
          onMarkAsRead(roomId);
        }}
      />

      {/* 검색 다이얼로그 */}
      <SearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        keyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
        results={searchResults}
        onSubmit={async () => {
          if (selectedConversation && searchKeyword.trim()) {
            try {
              const res = await searchChatMessages(
                Number(selectedConversation),
                searchKeyword.trim(),
              );
              const mapped: Message[] = res.map((m: any) => ({
                id: String(m.id),
                senderId: String(m.senderId),
                senderName: m.senderName,
                content: m.content,
                timestamp: m.createdAt,
                type: m.messageType === 'IMAGE' ? 'image' : 'text',
                status: 'delivered',
                reactions: Array.isArray(m.reactions) ? m.reactions : [],
              }));
              setSearchResults(mapped);
            } catch {
              toast.error('검색 실패');
            }
          }
        }}
        onClickResult={async (mid) => {
          const success = await scrollToMessageOrLoad(mid);
          if (!success) toast.info('해당 메시지를 찾지 못했습니다.');
        }}
      />

      {/* 사진 및 파일 보기 다이얼로그 */}
      <MediaDialog
        open={showMediaDialog}
        onOpenChange={setShowMediaDialog}
        messages={conversationMessages}
      />

      {/* 대화 정보 사이드바 */}
      <ConversationInfoSidebar
        conversation={selectedConv!}
        isOpen={showConversationInfo}
        onClose={() => setShowConversationInfo(false)}
      />
    </div>
  );
}

function DirectCreateBlock({
  onCreateConversation,
  onClose,
}: {
  onCreateConversation: (participantIds: string[], name?: string) => void;
  onClose: () => void;
}) {
  const [loginId, setLoginId] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<
    Array<{ id: number; name: string; email?: string; loginId?: string; profileImageUrl?: string }>
  >([]);
  const [selected, setSelected] = React.useState<{ id: number; name: string } | null>(null);

  async function handleVerify() {
    const q = loginId.trim();
    if (!q) {
      toast.error('로그인 ID를 입력하세요');
      return;
    }
    setIsSearching(true);
    try {
      // Search by query; backend matches name/email/loginId
      const page = await searchUsers(q, 0, 10);
      const content = Array.isArray(page?.content) ? page.content : [];
      setResults(content);
      if (!content.length) {
        toast.error('해당 로그인 ID의 사용자를 찾을 수 없습니다');
        setSelected(null);
      } else {
        // If the response includes loginId field, try exact match first
        const exact = content.find((u: any) => (u.loginId || '').toLowerCase() === q.toLowerCase());
        if (exact) setSelected({ id: exact.id, name: exact.name || exact.loginId || '사용자' });
        else setSelected({ id: content[0].id, name: content[0].name || '사용자' });
      }
    } catch {
      toast.error('사용자 검색 실패');
      setResults([]);
      setSelected(null);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">상대방 로그인 ID</label>
        <div className="flex gap-2">
          <Input
            placeholder="상대방 로그인 ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleVerify();
            }}
          />
          <Button variant="outline" size="sm" onClick={handleVerify} disabled={isSearching}>
            {isSearching ? '검증중...' : '검증'}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <ScrollArea className="h-40 rounded border p-2">
          <div className="space-y-2">
            {results.map((u) => (
              <div
                key={u.id}
                className={`p-2 rounded cursor-pointer ${selected?.id === u.id ? 'bg-accent' : 'hover:bg-accent'}`}
                onClick={() => setSelected({ id: u.id, name: u.name || u.loginId || '사용자' })}
              >
                <div className="text-sm font-medium">{u.name || u.loginId || `User #${u.id}`}</div>
                <div className="text-xs text-muted-foreground">{u.email || ''}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>
          취소
        </Button>
        <Button
          size="sm"
          onClick={() => {
            if (!selected) {
              toast.error('대상 사용자를 선택해주세요');
              return;
            }
            // Delegate to parent: creates room and updates list
            onCreateConversation([String(selected.id)]);
            onClose();
          }}
        >
          만들기
        </Button>
      </div>
    </div>
  );
}
