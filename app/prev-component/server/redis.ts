import 'server-only';
import Redis from 'ioredis';

// Environment variables
// REDIS_URL or individual REDIS_HOST/REDIS_PORT/REDIS_PASSWORD
const url = process.env.REDIS_URL;

// Reuse client across dev HMR and serverless invocations
const g = globalThis as unknown as {
  __redisClient?: Redis;
  __redisConnectWait?: Promise<Redis> | null;
};

let client: Redis | null = g.__redisClient || null;

export function getRedis(): Redis | null {
  if (client) return client;
  try {
    if (url) {
      client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
    } else {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD || undefined;
      client = new Redis({ host, port, password, lazyConnect: true, maxRetriesPerRequest: 2 });
    }
    g.__redisClient = client;
    return client;
  } catch (e) {
    console.error('Failed to init Redis', e);
    return null;
  }
}

function waitForReady(r: Redis, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const onReady = () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(true);
      }
    };
    const onEnd = () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(false);
      }
    };
    const onError = () => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(false);
      }
    };
    const cleanup = () => {
      try { r.off('ready', onReady); } catch {}
      try { r.off('end', onEnd); } catch {}
      try { r.off('error', onError); } catch {}
      try { clearTimeout(timer as any); } catch {}
    };
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(false);
      }
    }, Math.max(1000, timeoutMs));
    try {
      r.once('ready', onReady);
      r.once('end', onEnd);
      r.once('error', onError);
    } catch {
      resolve(false);
    }
  });
}

async function connectWithGuard(r: Redis): Promise<Redis | null> {
  if (g.__redisConnectWait) {
    try {
      await g.__redisConnectWait;
      return r;
    } catch {
      g.__redisConnectWait = null;
      return null;
    }
  }
  try {
    const p = r.connect().then(() => r);
    g.__redisConnectWait = p;
    const out = await p;
    g.__redisConnectWait = null;
    return out;
  } catch (e) {
    g.__redisConnectWait = null;
    console.error('Redis connect error', e);
    return null;
  }
}

export async function ensureRedisConnected(): Promise<Redis | null> {
  const r = getRedis();
  if (!r) return null;
  const status = (r as any).status as string | undefined;
  // Already usable
  if (status === 'ready') return r;
  // If currently connecting/reconnecting, wait for ready
  if (status === 'connecting' || status === 'connect' || status === 'reconnecting') {
    const ok = await waitForReady(r, 5000);
    return ok ? r : null;
  }
  // If ended or waiting (lazy), attempt a guarded connect
  if (status === 'end' || status === 'wait' || !status) {
    return await connectWithGuard(r);
  }
  // Fallback: attempt guarded connect once
  return await connectWithGuard(r);
}
