'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { getAccessToken, decodeToken, Session } from '@/lib/auth';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@chatstack/ui';
import Link from 'next/link';

type MessageItem = {
  id: string;
  roomId?: string | null;
  senderId?: number;
  text: string;
  createdAt: string;
};

export default function Chat() {
  const [roomId] = useState('general');
  const [session, setSession] = useState<Session | null>(null);
  const [msgs, setMsgs] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Load session on mount
  useEffect(() => {
    const at = getAccessToken();
    setSession(decodeToken(at));
  }, []);

  // Fetch initial messages
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const initialMessages = await api
          .get('api/messages/search', {
            searchParams: { roomId: roomId, sort: 'createdAt,asc', size: '50' },
          })
          .json<any>();
        setMsgs(initialMessages.content);
      } catch (e) {
        console.error('Failed to fetch initial messages', e);
      }
    })();
  }, [session, roomId]);

  // Connect to SSE stream for real-time updates
  useEffect(() => {
    if (!session?.accessToken) return;

    const baseUrl = process.env.NEXT_PUBLIC_SPRING_BASE_URL ?? 'http://localhost:9094';
    const eventSource = new EventSource(`${baseUrl}/api/messages/stream/${roomId}?token=${session.accessToken}`, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const newMessage: MessageItem = JSON.parse(event.data);
        if (newMessage.roomId === roomId) {
          setMsgs((prevMsgs) => [...prevMsgs, newMessage]);
        }
      } catch (e) {
        console.error('Failed to parse SSE message', e);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [session, roomId]);

  // Scroll to bottom on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  async function send() {
    if (!input.trim() || !session?.senderId) return;
    try {
      await api.post('api/messages', {
        json: {
          roomId,
          senderId: session.senderId,
          text: input,
        },
      });
      setInput('');
    } catch (e) {
      console.error('Failed to send message', e);
    }
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p>로그인이 필요합니다.</p>
        <Button asChild className="mt-4">
          <Link href="/login">로그인</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Chat - #{roomId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 h-[60vh] overflow-y-auto mb-4 space-y-4">
          {msgs.map((m, i) => (
            <div key={m.id || i} className={`flex items-end gap-2 ${m.senderId === session.senderId ? 'justify-end' : 'justify-start'}`}>
              <div className={`bubble ${m.senderId === session.senderId ? 'bubble--tail-right' : 'bubble--tail-left'}`}>
                <p className="font-bold text-xs text-muted-foreground">{m.senderId === session.senderId ? 'You' : `User ${m.senderId}`}</p>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' ? send() : undefined)}
            placeholder="메시지를 입력하세요..."
            className="flex-1"
          />
          <Button onClick={send} disabled={!input.trim()}>보내기</Button>
        </div>
      </CardContent>
    </Card>
  );
}
