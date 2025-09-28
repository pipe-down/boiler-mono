export type ApiErrorMeta = {
  errorId?: string;
  errorCode?: string;
  errorStatus?: number;
};

export function extractErrorMetaFromHeaders(headers: any): ApiErrorMeta {
  const h = headers || {};
  const get = (k: string) =>
    h?.[k] || h?.[k.toLowerCase()] || h?.get?.(k) || h?.get?.(k.toLowerCase());
  const errorId = get('x-error-id') || get('X-Error-Id');
  const errorCode = get('x-error-code') || get('X-Error-Code');
  const statusRaw = get('x-error-status') || get('X-Error-Status');
  const errorStatus =
    typeof statusRaw === 'string'
      ? parseInt(statusRaw, 10)
      : typeof statusRaw === 'number'
        ? statusRaw
        : undefined;
  return { errorId, errorCode, errorStatus };
}

export function publishApiErrorEvent(detail: { meta?: ApiErrorMeta; error?: any }) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent('api:error', { detail }));
    } catch {}
  }
}

export function sentryCaptureIfAvailable(error: any, meta?: ApiErrorMeta) {
  try {
    const win: any = typeof window !== 'undefined' ? (window as any) : null;
    const Sentry = win?.Sentry || win?.__SENTRY__?.hub?.getClient?.();
    if (Sentry?.captureException) {
      const scope = new (win.Sentry?.Scope || (Function as any))();
      if (scope?.setTag) {
        if (meta?.errorId) scope.setTag('error_id', meta.errorId);
        if (meta?.errorCode) scope.setTag('error_code', meta.errorCode);
        if (meta?.errorStatus != null) scope.setTag('error_status', String(meta.errorStatus));
      }
      // Try setContext when available
      if (scope?.setContext) scope.setContext('api_error', meta || {});
      // Enrich with browser context
      try {
        const extra: Record<string, any> = {};
        if (typeof window !== 'undefined') {
          extra.url = window.location?.href;
          extra.userAgent = window.navigator?.userAgent;
          extra.language = window.navigator?.language;
        }
        if (scope?.setContext) scope.setContext('browser', extra);
      } catch {}
      return win.Sentry.captureException(error, { captureContext: scope });
    }
  } catch {}
}
