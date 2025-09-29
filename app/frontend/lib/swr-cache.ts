import { mutate } from 'swr';

// Predicate-based invalidation helpers for SWR caches

export function invalidatePostLists() {
  return mutate((key: any) => Array.isArray(key) && key[0] === 'posts');
}

export function invalidatePostDetail(postId: number) {
  return mutate((key: any) => Array.isArray(key) && key[0] === 'post' && Number(key[1]) === Number(postId));
}

export function invalidateComments(postId: number) {
  return mutate((key: any) => Array.isArray(key) && key[0] === 'comments' && Number(key[1]) === Number(postId));
}

// Invalidate API-bound keys on auth transitions
export function invalidateAllApiCaches() {
  return mutate((key: any) =>
    typeof key === 'string' && (key.startsWith('/api/') || key.startsWith('/api/v1/')),
  );
}

export async function invalidateAllForPost(postId: number) {
  await Promise.all([
    invalidatePostDetail(postId),
    invalidateComments(postId),
    invalidatePostLists(),
  ]);
}
