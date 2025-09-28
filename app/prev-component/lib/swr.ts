import useSWR, { SWRConfiguration } from 'swr';
import { api } from './axios';

export const swrFetcher = (url: string) => api.get(url).then((r) => r.data);

export function useApi<T = any>(url: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(url, swrFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: (error: any) => error?.response?.status !== 401,
    errorRetryCount: 0,
    ...config,
  });
}
