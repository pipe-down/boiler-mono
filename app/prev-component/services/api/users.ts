import { api } from '@/src/lib/axios';

export async function getMe() {
  const { data } = await api.get('/users/me');
  return data;
}

export async function updateMyProfile(input: { name?: string; profileImageUrl?: string }) {
  const { data } = await api.put('/users/me', input);
  return data;
}

// Check if a loginId is available (true means available / not used). For existence, expect false.
export async function checkLoginIdAvailability(loginId: string): Promise<boolean> {
  const { data } = await api.get('/users/check-login-id', { params: { loginId } });
  // ApiResponse<Boolean>
  return Boolean(data?.data);
}

// Search users by query (name, email, or loginId). Returns Page<User> like response.
export async function searchUsers(query: string, page = 0, size = 10) {
  const { data } = await api.get('/users/search', { params: { query, page, size } });
  return data?.data;
}
