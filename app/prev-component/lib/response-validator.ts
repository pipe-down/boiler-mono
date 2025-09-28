import type { AxiosInstance, AxiosResponse } from 'axios';

// Lazy Ajv import to avoid server-side bundle issues
let ajvPromise: Promise<any> | null = null;
async function getAjv() {
  if (!ajvPromise) {
    ajvPromise = (async () => {
      try {
        // Avoid static resolution by bundlers; dynamically import ajv at runtime
        const dynamicImport = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
        const mod = await dynamicImport('ajv');
        const Ajv = (mod as any).default || (mod as any);
        const ajv = new Ajv({ allErrors: true, strict: false });
        try {
          // Try to load ajv-formats only at runtime if available
          const fm = await dynamicImport('ajv-formats');
          (fm as any).default?.(ajv);
        } catch {
          /* optional */
        }
        return ajv;
      } catch {
        return null;
      }
    })();
  }
  return ajvPromise;
}

// Schemas
import postSchema from '@/src/schemas/posts.response.schema.json';
import commentSchema from '@/src/schemas/comments.response.schema.json';
import tripSchema from '@/src/schemas/trips.response.schema.json';
import timelineSchema from '@/src/schemas/timeline.response.schema.json';
import pagedSchema from '@/src/schemas/common/paged.schema.json';
import envelopeSchema from '@/src/schemas/common/envelope.schema.json';
import errorSchema from '@/src/schemas/common/error.schema.json';

type ApiEnvelope<T = any> = { data?: T; success?: boolean; message?: string };

function isEnabled() {
  return (
    typeof window !== 'undefined' &&
    (process.env.NEXT_PUBLIC_API_SCHEMA_VALIDATION === '1' ||
      process.env.NEXT_PUBLIC_API_SCHEMA_VALIDATION === 'true')
  );
}

export function setupSchemaValidation(api: AxiosInstance) {
  if (!isEnabled()) return;

  api.interceptors.response.use(async (res: AxiosResponse) => {
    try {
      const url = res?.config?.url || '';
      const method = (res?.config?.method || 'get').toLowerCase();
      if (method !== 'get') return res;

      const ajv = await getAjv();
      if (!ajv) return res;

      const env: ApiEnvelope = res.data || {};
      const data = env.data ?? res.data;

      const validators = {
        post: ajv.compile(postSchema as any),
        comment: ajv.compile(commentSchema as any),
        trip: ajv.compile(tripSchema as any),
        timeline: ajv.compile(timelineSchema as any),
        paged: ajv.compile(pagedSchema as any),
        envelope: ajv.compile(envelopeSchema as any),
      };

      const warn = (ctx: string, errors: any[] | null) => {
        // do not throw; just warn for observability
        // attach a flag so callers can inspect if needed
        (res as any)._schemaErrors = errors;
        if (errors && errors.length) console.warn(`[schema] ${ctx} validation failed:`, errors);
      };

      // Optional: validate envelope shape
      validators.envelope(env) || warn('envelope', validators.envelope.errors || null);

      // /posts/{id}
      if (/^\/posts\/\d+(\?.*)?$/.test(url)) {
        if (!validators.post(data)) warn('post', validators.post.errors || []);
        return res;
      }

      // /posts/{id}/comments (paged)
      if (/^\/posts\/\d+\/comments(\?.*)?$/.test(url)) {
        // paged wrapper validation (if present)
        if (data && typeof data === 'object') {
          validators.paged(data) || warn('paged', validators.paged.errors || []);
        }
        const list = (data?.content as any[]) || [];
        for (const item of list) {
          if (!validators.comment(item)) {
            warn('comment', validators.comment.errors || []);
            break;
          }
        }
        return res;
      }

      // /trips/{id}
      if (/^\/trips\/\d+(\?.*)?$/.test(url)) {
        if (!validators.trip(data)) warn('trip', validators.trip.errors || []);
        return res;
      }

      // /trips/{id}/timeline*
      if (/^\/trips\/\d+\/timeline(\/.*)?(\?.*)?$/.test(url)) {
        if (data && typeof data === 'object' && Array.isArray((data as any).content)) {
          validators.paged(data) || warn('paged', validators.paged.errors || []);
        }
        const arr: any[] = Array.isArray((data as any)?.content)
          ? (data as any).content
          : Array.isArray(data)
            ? (data as any)
            : [];
        for (const item of arr) {
          if (!validators.timeline(item)) {
            warn('timeline', validators.timeline.errors || []);
            break;
          }
        }
        return res;
      }
    } catch (e) {
      // silent: validation should never break the app
    }
    return res;
  });

  // Validate error envelopes on error responses without altering behavior
  api.interceptors.response.use(undefined, async (error) => {
    try {
      const res: AxiosResponse | undefined = error?.response;
      if (!res) return Promise.reject(error);
      const url = (res.config?.url || '') as string;
      // Validate only for BFF routes (e.g., Kakao proxy)
      if (!/^\/api\/map\//.test(url)) return Promise.reject(error);
      const ajv = await getAjv();
      if (!ajv) return Promise.reject(error);
      const vErr = ajv.compile(errorSchema as any);
      const ok = vErr(res.data || {});
      if (!ok) {
        (error as any)._schemaErrors = vErr.errors;
        console.warn('[schema] error envelope validation failed:', vErr.errors);
      }
    } catch {}
    return Promise.reject(error);
  });
}
