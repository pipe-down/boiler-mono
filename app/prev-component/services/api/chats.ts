import { api } from '@/src/lib/axios';

export type ChatRoom = {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
};

export async function getChatRooms(opts?: { signal?: AbortSignal }) {
  const { data } = await api.get('/chats', { signal: opts?.signal });
  return (data?.data ?? []) as ChatRoom[];
}

export type ChatMessage = {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  senderProfileImageUrl?: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  imageUrl?: string;
  createdAt: string;
  edited?: boolean;
};

export async function getChatMessages(
  chatId: number,
  params?: { page?: number; size?: number; signal?: AbortSignal },
) {
  const page = params?.page ?? 0;
  const size = params?.size ?? 20;
  const id = encodeURIComponent(String(chatId));
  const { data } = await api.get(`/chats/${id}/messages`, {
    params: { page, size },
    signal: params?.signal,
  });
  return (data?.data?.content ?? []) as ChatMessage[];
}

export async function createDirectChat(targetUserId: number, opts?: { signal?: AbortSignal }) {
  const { data } = await api.post(
    '/chats/direct',
    { targetUserId },
    { signal: opts?.signal },
  );
  return data?.data as ChatRoom;
}

export async function createMeetingChat(
  tripId: number,
  name: string,
  description?: string,
  opts?: { signal?: AbortSignal },
) {
  const { data } = await api.post(
    '/chats/meeting',
    { tripId, name, description },
    { signal: opts?.signal },
  );
  return data?.data as ChatRoom;
}

/** =========================
 *  Read ACK: coalesce + idempotent guard
 *  ========================= */
type ReadBody = {
  lastReadMessageId?: number;
  lastSeenAt?: string; // ISO
  messageIds?: number[];
};

// 서버에 확정 반영된 마지막 워터마크
const lastAckedMap = new Map<number, number>();

// coalesce 창 동안 합칠 페이로드/프라미스들
const pendingMap = new Map<
  number,
  {
    timer: ReturnType<typeof setTimeout> | null;
    body: ReadBody;
    resolvers: Array<(v: any) => void>;
    rejecters: Array<(e: any) => void>;
  }
>();

// 유틸: 최신 시각 선택
function maxIso(a?: string, b?: string) {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

// 유틸: 숫자 배열 합집합 정렬
function unionIds(a?: number[], b?: number[]) {
  const s = new Set<number>([...(a ?? []), ...(b ?? [])]);
  return Array.from(s).sort((x, y) => x - y);
}

// coalesce 윈도우(ms) — 필요 시 조정 가능
export const MARK_READ_COALESCE_MS = 250;

async function flushRead(chatId: number) {
  const pending = pendingMap.get(chatId);
  if (!pending) return;

  pending.timer = null;
  const body = pending.body;

  // 멱등 가드: 워터마크가 전진하지 않고 messageIds도 없는 경우 skip
  const lastAcked = lastAckedMap.get(chatId) ?? 0;
  const nextId = body.lastReadMessageId ?? 0;
  if (!body.messageIds?.length && nextId <= lastAcked) {
    pending.resolvers.forEach((r) => r({ skipped: true }));
    pendingMap.delete(chatId);
    return;
  }

  try {
    const id = encodeURIComponent(String(chatId));
    const { data } = await api.put(`/chats/${id}/read`, body);
    // 서버 응답에 최종 워터마크가 없다면, 보낸 값으로라도 갱신
    if (nextId > 0) {
      const cur = lastAckedMap.get(chatId) ?? 0;
      if (nextId > cur) lastAckedMap.set(chatId, nextId);
    }
    pending.resolvers.forEach((r) => r(data));
  } catch (e) {
    pending.rejecters.forEach((rej) => rej(e));
  } finally {
    pendingMap.delete(chatId);
  }
}

/**
 * 읽음 처리:
 *  - 같은 chatId에 대해 250ms 내 여러 호출을 1회로 합침
 *  - lastReadMessageId는 최댓값으로, lastSeenAt은 최신값으로, messageIds는 합집합으로 병합
 *  - lastAcked(확정 워터마크)보다 작거나 같은 값만 들어오면 네트워크 호출 생략
 */
export async function markChatAsRead(
  chatId: number,
  opts?: { lastReadMessageId?: number; lastSeenAt?: string; messageIds?: number[] },
): Promise<any> {
  const id = Number(chatId);
  const nextId = opts?.lastReadMessageId ?? 0;

  // 멱등 가드(즉시 반환): messageIds가 없고 워터마크 전진이 없으면 skip
  const lastAcked = lastAckedMap.get(id) ?? 0;
  if (!opts?.messageIds?.length && nextId > 0 && nextId <= lastAcked) {
    return { skipped: true };
  }

  // pending 병합
  let pending = pendingMap.get(id);
  if (!pending) {
    pending = {
      timer: null,
      body: {},
      resolvers: [],
      rejecters: [],
    };
    pendingMap.set(id, pending);
  }
  // 병합 규칙
  pending.body.lastReadMessageId = Math.max(pending.body.lastReadMessageId ?? 0, nextId);
  pending.body.lastSeenAt = maxIso(pending.body.lastSeenAt, opts?.lastSeenAt);
  pending.body.messageIds = unionIds(pending.body.messageIds, opts?.messageIds);

  // 디바운스 시작/연장
  if (pending.timer) clearTimeout(pending.timer);
  pending.timer = setTimeout(() => void flushRead(id), MARK_READ_COALESCE_MS);

  // 호출자에게 완료 시점을 반환(모든 병합 호출이 같은 프라미스에 붙음)
  return new Promise((resolve, reject) => {
    pending!.resolvers.push(resolve);
    pending!.rejecters.push(reject);
  });
}

export async function leaveChat(chatId: number) {
  const id = encodeURIComponent(String(chatId));
  try {
    const { data } = await api.post(`/chats/${id}/leave`, {});
    return data;
  } catch (e: any) {
    try {
      const { data } = await api.delete(`/chats/${id}/leave`);
      return data;
    } catch (e2: any) {
      try {
        const { data } = await api.delete(`/chats/${id}/member`);
        return data;
      } catch (e3: any) {
        throw e3 || e2 || e;
      }
    }
  }
}

export async function searchChatMessages(
  chatId: number,
  keyword: string,
  params?: { page?: number; size?: number; signal?: AbortSignal },
) {
  const q = keyword?.trim();
  if (!q) return [] as ChatMessage[]; // 빈 검색 방지
  const page = params?.page ?? 0;
  const size = params?.size ?? 50;
  const id = encodeURIComponent(String(chatId));
  const { data } = await api.get(`/chats/${id}/messages/search`, {
    params: { keyword: q, page, size },
    signal: params?.signal,
  });
  return (data?.data?.content ?? []) as ChatMessage[];
}
