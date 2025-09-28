// Removed: A-pattern (server session) no longer uses this aggregator.
export async function GET() {
  return new Response(JSON.stringify({ message: 'Gone' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  });
}
