import useSWR from 'swr';

// This is a placeholder for the actual useNotifications hook.
// It will be implemented with actual API calls later.

export function useNotifications() {
  return {
    list: { items: [], mutate: () => {} },
    unread: { data: 0, mutate: () => {} },
    readOne: { trigger: async (id: string) => {} },
    readAll: { trigger: async () => {} },
    removeOne: { trigger: async (id: string) => {} },
  };
}
