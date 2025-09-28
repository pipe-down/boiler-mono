import 'server-only';
import { cookies } from 'next/headers';
import { getSession } from '@/src/server/session/store';

export type HeaderUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  unreadNotifications: number;
  points?: number;
  level?: number;
  nextLevelPoints?: number;
} | null;

async function serializeCookieHeader(): Promise<string> {
  const store = await cookies();
  const all = store.getAll();
  if (!all.length) return '';
  return all.map((c) => `${c.name}=${c.value}`).join('; ');
}

/**
 * Get current user for SSR Header using server session store directly.
 * Avoids an internal fetch and eliminates any cookie-forwarding pitfalls.
 */
export async function getUserFromBackend(): Promise<HeaderUser> {
  const ck = await cookies();
  const sid = ck.get('sid')?.value;

  if (!sid) return null;

  try {
    const sess = await getSession(sid);
    const u = sess?.user;
    if (u && u.id && u.name) {
      return {
        id: String(u.id),
        name: u.name ?? '',
        email: u.email ?? '',
        avatar: u.avatar ?? undefined,
        unreadNotifications: 0,
      };
    }
  } catch {}

  return null;
}
