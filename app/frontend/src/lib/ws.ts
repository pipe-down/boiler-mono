export function connectWS(p: { roomId?: string; userId: number }) {
  const room = p.roomId ?? "general";
  const u = encodeURIComponent(String(p.userId));
  return new WebSocket(`ws://localhost:8080/ws?roomId=${encodeURIComponent(room)}&user=${u}`);
}
