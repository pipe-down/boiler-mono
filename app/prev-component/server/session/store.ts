import 'server-only';

// Redis-backed session store. Falls back to in-memory if Redis is unavailable.
import { ensureRedisConnected } from '@/src/server/redis';

type SessionData = {
  user?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  } | null;
  backendCookie?: string | null;
  createdAt: number;
  expiresAt?: number | null; // epoch ms
};

const SESS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days default

const mem = new Map<string, SessionData>();

async function redisGet(key: string): Promise<SessionData | null> {
  const r = await ensureRedisConnected();
  if (!r) return null;
  try {
    const v = await r.get(key);
    if (!v) return null;
    const parsed = JSON.parse(v) as SessionData;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      await r.del(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function redisSet(key: string, val: SessionData, ttlMs: number) {
  const r = await ensureRedisConnected();
  if (!r) return false;
  try {
    const ttlSec = Math.max(60, Math.floor(ttlMs / 1000));
    await r.set(key, JSON.stringify(val), 'EX', ttlSec);
    return true;
  } catch {
    return false;
  }
}

async function redisDel(key: string) {
  const r = await ensureRedisConnected();
  if (!r) return false;
  try {
    await r.del(key);
    return true;
  } catch {
    return false;
  }
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const key = `sess:${sid}`;
  const fromRedis = await redisGet(key);
  if (fromRedis) return fromRedis;
  const s = mem.get(sid) || null;
  if (!s) return null;
  if (s.expiresAt && Date.now() > s.expiresAt) {
    mem.delete(sid);
    return null;
  }
  return s;
}

export async function setSession(sid: string, data: Partial<SessionData>, ttlMs: number = SESS_TTL_MS) {
  const now = Date.now();
  const key = `sess:${sid}`;
  const prev = (await redisGet(key)) || mem.get(sid) || ({ createdAt: now } as SessionData);
  const merged: SessionData = {
    createdAt: prev.createdAt || now,
    expiresAt: now + Math.max(60_000, ttlMs),
    user: data.user !== undefined ? data.user : prev.user,
    backendCookie: data.backendCookie !== undefined ? data.backendCookie : prev.backendCookie,
  };
  const ok = await redisSet(key, merged, ttlMs);
  if (!ok) mem.set(sid, merged);
}

export async function deleteSession(sid: string) {
  const key = `sess:${sid}`;
  const ok = await redisDel(key);
  if (!ok) mem.delete(sid);
}

export type { SessionData };
