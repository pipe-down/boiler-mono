'use client';

import React from 'react';
import { SWRConfig } from 'swr';

type Props = {
  fallback?: Record<string, any>;
  children: React.ReactNode;
};

export default function SWRProvider({ fallback, children }: Props) {
  return (
    <SWRConfig
      value={{
        fallback: fallback || {},
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
        provider: () => new Map(),
        // You can add a global fetcher here if needed
      }}
    >
      {children}
    </SWRConfig>
  );
}
