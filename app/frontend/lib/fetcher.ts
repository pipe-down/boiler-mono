import { getAccessToken } from './auth';

export const apiFetcher = async (url: string, init?: RequestInit) => {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (init?.body && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(url, { ...init, headers });
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === 'string' ? payload : payload?.message;
    throw new Error(message ?? '요청에 실패했습니다.');
  }
  return payload;
};
