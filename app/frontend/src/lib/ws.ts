const httpUrl = process.env.NEXT_PUBLIC_SPRING_BASE_URL ?? "http://localhost:9094";
const wsUrl = httpUrl.replace(/^http/, "ws");

export function connectWS(p: { roomId?: string; userId: number }) {
  const room = p.roomId ?? "general";
  const u = encodeURIComponent(String(p.userId));
  return new WebSocket(`${wsUrl}/ws?roomId=${encodeURIComponent(room)}&user=${u}`);
}
