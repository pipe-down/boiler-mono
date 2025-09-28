'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { getAccessToken, decodeToken, Session } from '@/lib/auth';

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
    if (!session) return;

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
      <div>
        로그인이 필요합니다. <a href="/login">로그인</a>
      </div>
    );
  }

  return (
    <section>
      <h1>Chat - {roomId}</h1>
      <div style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8, height: '60vh', overflowY: 'auto' }}>
        {msgs.map((m, i) => (
          <div key={m.id || i} style={{ padding: '4px 0' }}>
            <b>{m.senderId}</b>: {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? send() : undefined)}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={send}>보내기</button>
      </div>
    </section>
  );
}
