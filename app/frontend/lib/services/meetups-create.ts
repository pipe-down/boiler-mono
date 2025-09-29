import { api } from '@/lib/api';

export async function createMeetup(input: { title: string; content?: string; category?: string }) {
  const requestDto = {
    title: input.title,
    content: input.content || '',
    type: 'EVENT',
    category: input.category || 'TRAVEL_COMPANION',
    isCommentAllowed: true,
    isDraft: false,
  };
  const form = new FormData();
  form.append(
    'requestDto',
    new Blob([JSON.stringify(requestDto)], { type: 'application/json' }) as any,
  );
  const data = await api.post('posts', { body: form }).json();
  return data;
}
