'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Guard from '../(auth)/guard';
import { Button, Input, Pagination, Table, TBody, TD, TH, THead, TR, Textarea } from '@chatstack/ui';
import { apiFetcher } from '../../lib/fetcher';
import { useSession } from '../../hooks/useSession';

const PAGE_SIZE = 20;

type MessageItem = {
  id: string;
  roomId?: string | null;
  senderId?: number;
  text: string;
  createdAt: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export default function MessagesPage() {
  const session = useSession();
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('createdAt,desc');
  const [roomFilter, setRoomFilter] = useState<'all' | string>('all');
  const [composerText, setComposerText] = useState('');
  const [composerRoom, setComposerRoom] = useState('general');
  const [sending, setSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  const params = useMemo(() => {
    const search = new URLSearchParams({
      page: String(page),
      size: String(PAGE_SIZE),
      sort,
    });
    if (q) {
      search.set('q', q);
    }
    return search;
  }, [page, q, sort]);

  const { data, isLoading, mutate } = useSWR<PageResponse<MessageItem>>(
    `/api/bridge/api/messages/search?${params.toString()}`,
    apiFetcher,
    {
      keepPreviousData: true,
    },
  );

  const rows = data?.content ?? [];
  const filteredRows = useMemo(() => {
    if (roomFilter === 'all') return rows;
    return rows.filter((row) => (row.roomId ?? 'general') === roomFilter);
  }, [roomFilter, rows]);

  const total = data?.totalElements ?? 0;
  const rooms = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      const key = row.roomId ?? 'general';
      set.add(key);
    });
    if (!set.size) {
      set.add('general');
    }
    return Array.from(set);
  }, [rows]);

  const handleComposerSubmit = async () => {
    if (!session?.accessToken) {
      setComposeError('세션이 만료되었습니다. 다시 로그인하세요.');
      return;
    }
    if (!composerText.trim()) {
      setComposeError('메시지를 입력하세요.');
      return;
    }
    if (session.senderId === undefined) {
      setComposeError('보내는 사람 정보를 확인할 수 없습니다. 다시 로그인하세요.');
      return;
    }
    setSending(true);
    setComposeError(null);
    try {
      await apiFetcher('/api/bridge/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          roomId: composerRoom,
          senderId: session.senderId,
          text: composerText,
        }),
      });
      setComposerText('');
      setPage(0);
      mutate();
    } catch (error) {
      console.error(error);
      setComposeError(error instanceof Error ? error.message : '메시지를 전송하지 못했습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Guard>
      <section className="stack" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header className="stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1>Messages</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>채팅 메시지를 검색하고 새 메시지를 전송하세요.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Input
              placeholder="검색어"
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(0);
              }}
            />
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(0);
              }}
              className="rounded border border-white/15 bg-transparent px-3 py-2 text-sm"
            >
              <option value="createdAt,desc">최신순</option>
              <option value="createdAt,asc">오래된순</option>
            </select>
            <select
              value={roomFilter}
              onChange={(event) => {
                setRoomFilter(event.target.value as typeof roomFilter);
                setPage(0);
              }}
              className="rounded border border-white/15 bg-transparent px-3 py-2 text-sm"
            >
              <option value="all">전체 채널</option>
              {rooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
            <Button type="button" variant="secondary" onClick={() => mutate()}>
              새로고침
            </Button>
          </div>
        </header>

        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            background: '#fff',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>새 메시지 작성</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Input
              placeholder="채널 (기본: general)"
              value={composerRoom}
              onChange={(event) => setComposerRoom(event.target.value)}
            />
            <Button type="button" onClick={handleComposerSubmit} disabled={sending}>
              {sending ? '전송 중...' : '전송'}
            </Button>
          </div>
          <Textarea
            rows={4}
            placeholder="보낼 메시지를 입력하세요"
            value={composerText}
            onChange={(event) => setComposerText(event.target.value)}
          />
          {composeError && <p style={{ color: '#dc2626', fontSize: 14 }}>{composeError}</p>}
        </section>

        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Room</TH>
              <TH>Sender</TH>
              <TH>Text</TH>
              <TH>Created At</TH>
            </TR>
          </THead>
          <TBody>
            {filteredRows.map((row) => (
              <TR key={row.id}>
                <TD>
                  <Link href={`/messages/${row.id}`}>{row.id}</Link>
                </TD>
                <TD>{row.roomId ?? 'general'}</TD>
                <TD>{row.senderId ?? '-'}</TD>
                <TD style={{ maxWidth: 360 }}>
                  <span title={row.text}>{row.text}</span>
                </TD>
                <TD>{new Date(row.createdAt).toLocaleString()}</TD>
              </TR>
            ))}
            {filteredRows.length === 0 && !isLoading && (
              <TR>
                <TD colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                  표시할 데이터가 없습니다.
                </TD>
              </TR>
            )}
            {isLoading && (
              <TR>
                <TD colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af' }}>
                  불러오는 중...
                </TD>
              </TR>
            )}
          </TBody>
        </Table>

        <Pagination
          page={page + 1}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={(nextPage) => setPage(nextPage - 1)}
        />
      </section>
    </Guard>
  );
}
