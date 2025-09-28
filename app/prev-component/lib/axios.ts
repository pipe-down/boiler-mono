import axios from 'axios';
import { mutate } from 'swr';

import { setupSchemaValidation } from './response-validator';
import {
  extractErrorMetaFromHeaders,
  publishApiErrorEvent,
  type ApiErrorMeta,
} from './api-error';
import { invalidateAllApiCaches } from './swr-cache';
import { broadcastAuth } from './auth-broadcast';
import { useUIStore } from '@/src/store/ui';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _retryCount?: number;
  }
}

const _api = axios.create({
  baseURL: '/api/bff',
  withCredentials: true,
  timeout: 10000,
});

// Optional runtime schema validation (client-only)
setupSchemaValidation(_api);

let lastUnauthorizedNotifiedAt = 0;

function handleUnauthorized(meta?: ApiErrorMeta) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  if (now - lastUnauthorizedNotifiedAt < 1500) {
    return;
  }
  lastUnauthorizedNotifiedAt = now;

  try {
    useUIStore.getState().setAuthExpired(true, '세션이 만료되었습니다. 다시 로그인해 주세요.');
  } catch {}

  try {
    window.localStorage.removeItem('ME_CACHE');
  } catch {}

  try {
    mutate('me', null, false);
  } catch {}

  try {
    invalidateAllApiCaches();
  } catch {}

  try {
    broadcastAuth('logged-out');
  } catch {}

  publishApiErrorEvent({ meta: { errorStatus: 401, ...meta } });
}

_api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const meta = extractErrorMetaFromHeaders(error?.response?.headers);

    if (status === 401) {
      handleUnauthorized({ ...meta, errorStatus: status ?? meta?.errorStatus });
    } else if (status != null && status >= 500) {
      publishApiErrorEvent({ meta: { ...meta, errorStatus: status }, error });
    }

    return Promise.reject(error);
  },
);

export const api = _api;
