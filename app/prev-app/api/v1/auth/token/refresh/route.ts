// Removed: A-pattern (server session) does not use client token refresh.
export async function POST() {
  return new Response(JSON.stringify({ message: 'Gone' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
}
