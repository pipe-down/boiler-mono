export type Session = {
  accessToken: string;
  userId: string;
  email?: string;
  name?: string;
  senderId?: number;
  expiresAt?: number;
};

const ACCESS_TOKEN_KEY = 'at';
const SESSION_KEY = 'chatstack_session';

export function decodeToken(token: string): Session | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(base64Decode(parts[1]));
    const expiresAt = typeof payload.exp === 'number' ? payload.exp * 1000 : undefined;
    const session: Session = {
      accessToken: token,
      userId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.displayName,
      senderId: typeof payload.senderId === 'number' ? payload.senderId : undefined,
      expiresAt,
    };
    return session;
  } catch {
    return null;
  }
}

export function saveSession(token: string): Session | null {
  if (typeof window === 'undefined') return null;
  const session = decodeToken(token);
  if (!session) return null;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const cached = window.localStorage.getItem(SESSION_KEY);
  if (!cached) {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;
    const session = decodeToken(token);
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return session;
  }
  try {
    const session = JSON.parse(cached) as Session;
    if (session.expiresAt && session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function base64Decode(input: string): string {
  const decoder = typeof atob === 'function' ? atob : undefined;
  if (decoder) {
    return decoder(padBase64(input));
  }
  // Fallback for environments without atob (e.g., Node < 16).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bufferFactory = (globalThis as any)?.Buffer;
  if (bufferFactory) {
    return bufferFactory.from(padBase64(input), 'base64').toString('utf8');
  }
  throw new Error('base64 decoding is not supported in this environment');
}

function padBase64(value: string): string {
  const padLength = (4 - (value.length % 4)) % 4;
  return value + '='.repeat(padLength);
}
