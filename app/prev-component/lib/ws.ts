// Lightweight STOMP client wrapper
// Configurable via env:
// - NEXT_PUBLIC_WS_URL (default: '/ws')
// - NEXT_PUBLIC_STOMP_TOPIC_PREFIX (default: '/topic/chat')
// - NEXT_PUBLIC_STOMP_APP_PREFIX (default: '/app/chat')

import type { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getValidWsToken, clearWsTokenCache } from '@/src/lib/wsToken';

let StompImpl: typeof import('@stomp/stompjs') | null = null;
let sharedClient: Client | null = null;
let sharedRefs = 0;

// Cross-tab auth events: update/reconnect or disconnect
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    const bc = new BroadcastChannel('auth-refresh');
    bc.addEventListener('message', async (ev: MessageEvent) => {
      const data: any = (ev as any)?.data ?? (ev as any);
      if (data?.type === 'token-refreshed') {
        // If app-level login refreshed, reconnect to apply new wsToken
        if (sharedClient) {
          try { await sharedClient.deactivate(); } catch {}
          try { sharedClient.activate(); } catch {}
        }
      } else if (data?.type === 'logged-out') {
        try { clearWsTokenCache(); } catch {}
        if (sharedClient) {
          try { await sharedClient.deactivate(); } catch {}
          sharedClient = null;
        }
      }
    });
  } catch {}
}

async function ensureDeps() {
  if (!StompImpl) {
    StompImpl = await import('@stomp/stompjs');
  }
}

function getBrokerUrl(basePath?: string): string {
  const base = basePath || process.env.NEXT_PUBLIC_WS_URL || '/ws';
  const url = new URL(base, window.location.origin);
  // SockJS requires an HTTP-based URL, so we don't modify the protocol here.
  return url.toString();
}

export async function acquireSharedStompClient(): Promise<Client | null> {
  if (typeof window === 'undefined') return null;
  await ensureDeps();
  if (!sharedClient) {
    const hb = Number(process.env.NEXT_PUBLIC_STOMP_HEARTBEAT_MS || 10000);
    const { Client } = StompImpl!;
    sharedClient = new Client({
      webSocketFactory: () => new SockJS(getBrokerUrl()),
      reconnectDelay: 0, // we will manage reconnection ourselves if needed in callers
      heartbeatIncoming: hb,
      heartbeatOutgoing: hb,
    });
sharedClient.beforeConnect = async () => {
      const token = await getValidWsToken().catch((e) => {
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:expired')); } catch {}
        throw e;
      });
      sharedClient!.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    };
    // Stop infinite loops on auth errors
sharedClient.onStompError = (frame) => {
      const msg = String(frame?.headers?.message || '').toLowerCase();
      if (msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('authenticate')) {
        try { clearWsTokenCache(); } catch {}
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:expired')); } catch {}
        try { sharedClient?.deactivate(); } catch {}
      }
    };
    sharedClient.onWebSocketClose = (evt: CloseEvent) => {
      const code = (evt && (evt as any).code) || 0;
      const reason = String((evt && (evt as any).reason) || '').toLowerCase();
      if (code === 1008 || reason.includes('policy') || reason.includes('unauthorized')) {
        try {
          sharedClient?.deactivate();
        } catch {}
      }
    };
  }
  sharedRefs++;
  return sharedClient;
}

export function releaseSharedStompClient() {
  if (sharedRefs > 0) sharedRefs--;
  if (sharedRefs === 0 && sharedClient) {
    try {
      sharedClient.deactivate();
    } catch {}
    sharedClient = null;
  }
}

export type ChatSocket = {
  client: Client | null;
  subscribeToRoom: (roomId: number, onMessage: (msg: any) => void) => any | null;
  sendToRoom: (roomId: number, payload: any) => void;
  disconnect: () => void;
};

export async function createChatSocket(): Promise<ChatSocket> {
  if (typeof window === 'undefined') {
    return {
      client: null,
      subscribeToRoom: () => null,
      sendToRoom: () => {},
      disconnect: () => {},
    };
  }
  await ensureDeps();

  const { Client } = StompImpl!;

  const hb = Number(process.env.NEXT_PUBLIC_STOMP_HEARTBEAT_MS || 10000);
  const client: Client = new Client({
    webSocketFactory: () => new SockJS(getBrokerUrl()),
    reconnectDelay: 0,
    heartbeatIncoming: hb,
    heartbeatOutgoing: hb,
  });

  // Attach Authorization dynamically on every (re)connect
client.beforeConnect = async () => {
    const token = await getValidWsToken().catch((e) => {
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:expired')); } catch {}
      throw e;
    });
    client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  };

  client.activate();

  const topicPrefix = process.env.NEXT_PUBLIC_STOMP_TOPIC_PREFIX || '/topic/chat';
  const appPrefix = process.env.NEXT_PUBLIC_STOMP_APP_PREFIX || '/app/chat';

  return {
    client,
    subscribeToRoom: (roomId: number, onMessage: (msg: any) => void) => {
      if (!client.connected) return null;
      const dest = `${topicPrefix}/${roomId}`;
      return client.subscribe(dest, (frame: any) => {
        try {
          const body = JSON.parse(frame.body);
          onMessage(body);
        } catch {
          onMessage(frame.body);
        }
      });
    },
    sendToRoom: (roomId: number, payload: any) => {
      if (!client.connected) return;
      const dest = `${appPrefix}/${roomId}`;
      client.publish({ destination: dest, body: JSON.stringify(payload) });
    },
    disconnect: () => {
      try {
        client.deactivate();
      } catch {}
    },
  };
}

export type NotificationSocket = {
  client: Client | null;
  subscribe: (onMessage: (msg: any) => void) => { unsubscribe: () => void } | null;
  disconnect: () => void;
};

export async function createNotificationSocket(): Promise<NotificationSocket> {
  if (typeof window === 'undefined') {
    return {
      client: null,
      subscribe: () => null,
      disconnect: () => {},
    };
  }

  await ensureDeps();

  const { Client } = StompImpl!;
  const queue = process.env.NEXT_PUBLIC_STOMP_NOTIFICATION_QUEUE || '/user/queue/notifications';

  const hb = Number(process.env.NEXT_PUBLIC_STOMP_HEARTBEAT_MS || 10000);
  const client: Client = new Client({
    webSocketFactory: () => new SockJS(getBrokerUrl()),
    reconnectDelay: 2000,
    heartbeatIncoming: hb,
    heartbeatOutgoing: hb,
  });

client.beforeConnect = async () => {
    const token = await getValidWsToken().catch((e) => {
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:expired')); } catch {}
      throw e;
    });
    client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  };

  client.activate();

  function doSubscribe(onMessage: (msg: any) => void) {
    if (!client.connected) {
      // Subscribe once connected
      const prev = client.onConnect;
      client.onConnect = (frame) => {
        try {
          prev?.(frame);
        } catch {}
        const sub = client.subscribe(queue, (frame: any) => {
          try {
            const body = JSON.parse(frame.body);
            onMessage(body);
          } catch {
            onMessage(frame.body);
          }
        });
        // replace subscribe to allow manual unsubscribe
        (doSubscribe as any)._sub = sub;
      };
      return {
        unsubscribe: () => {
          try {
            (doSubscribe as any)._sub?.unsubscribe?.();
          } catch {}
        },
      };
    }
    const subscription = client.subscribe(queue, (frame: any) => {
      try {
        const body = JSON.parse(frame.body);
        onMessage(body);
      } catch {
        onMessage(frame.body);
      }
    });
    return {
      unsubscribe: () => {
        try {
          subscription.unsubscribe();
        } catch {}
      },
    };
  }

  return {
    client,
    subscribe: doSubscribe,
    disconnect: () => {
      try {
        client.deactivate();
      } catch {}
    },
  };
}

// Generic STOMP client for custom topics (e.g., member locations)
export async function createActivatedStompClient(opts?: {
  url?: string;
  reconnectDelay?: number;
  heartbeat?: number;
}) {
  if (typeof window === 'undefined') return null;
  await ensureDeps();
  const { Client } = StompImpl!;

  const client: Client = new Client({
    webSocketFactory: () => new SockJS(getBrokerUrl(opts?.url)),
    reconnectDelay: 0,
    heartbeatIncoming: opts?.heartbeat ?? 10000,
    heartbeatOutgoing: opts?.heartbeat ?? 10000,
  });
client.beforeConnect = async () => {
    const token = await getValidWsToken().catch((e) => {
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:expired')); } catch {}
      throw e;
    });
    client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  };
  client.activate();
  return client;
}

// Generic STOMP client factory for shared provider (Phase 7)
export async function createStompClient(): Promise<Client | null> {
  return acquireSharedStompClient();
}
