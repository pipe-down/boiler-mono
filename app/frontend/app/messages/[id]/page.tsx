'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Guard from '../../(auth)/guard';
import { Button, Table, TBody, TD, TH, THead, TR } from '@chatstack/ui';
import { apiFetcher } from '@/lib/api';

type MessageDetail = {
  id: string;
  roomId?: string | null;
  senderId?: number;
  text: string;
  createdAt: string;
};

type PageProps = {
  params: { id: string };
};

export default function MessageDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { data, isLoading, error } = useSWR<MessageDetail>(
    `/api/bridge/api/messages/${params.id}`,
    apiFetcher,
  );

  return (
    <Guard>
      <section className="stack" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <header className="stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Message Detail</h1>
            <p style={{ color: '#6b7280', fontSize: 14 }}>메시지 ID: {params.id}</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            목록으로 돌아가기
          </Button>
        </header>
        {isLoading && <p>불러오는 중...</p>}
        {error && <p style={{ color: '#dc2626' }}>메시지를 불러오지 못했습니다.</p>}
        {data && (
          <Table>
            <THead>
              <TR>
                <TH>필드</TH>
                <TH>값</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD>ID</TD>
                <TD>{data.id}</TD>
              </TR>
              <TR>
                <TD>Room</TD>
                <TD>{data.roomId ?? 'general'}</TD>
              </TR>
              <TR>
                <TD>Sender</TD>
                <TD>{data.senderId ?? '-'}</TD>
              </TR>
              <TR>
                <TD>Created At</TD>
                <TD>{new Date(data.createdAt).toLocaleString()}</TD>
              </TR>
              <TR>
                <TD>Message</TD>
                <TD>{data.text}</TD>
              </TR>
            </TBody>
          </Table>
        )}
      </section>
    </Guard>
  );
}
