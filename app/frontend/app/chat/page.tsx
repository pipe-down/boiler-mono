"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/src/lib/http";
import { getAccessToken, parseJwt } from "@/src/lib/auth";
import { connectWS } from "@/src/lib/ws";

type ChatMsg = { type: "chat" | "server_ack"; roomId: string; senderId?: string; text?: string; serverSeq?: number; ts?: number; };
type TimelineRow = { serverSeq: number; roomId: string; senderId: string; text: string; ts: number; };

export default function Chat() {
  const [roomId] = useState("general");
  const [uid, setUid] = useState<number>(0);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const at = getAccessToken();
    const payload = parseJwt(at);
    setUid(payload ? Number(payload.sub) : 0);
  }, []);

  useEffect(() => {
    (async () => {
      const rows = await api.get("api/messages", { searchParams: { roomId, limit: "50" } }).json<TimelineRow[]>();
      setMsgs(rows.map((r) => ({ type: "chat", roomId: r.roomId, senderId: r.senderId, text: r.text, serverSeq: r.serverSeq, ts: r.ts })));
    })();
  }, [roomId]);

  useEffect(() => {
    if (!uid) return;
    const ws = connectWS({ roomId, userId: uid });
    ws.onmessage = (ev) => {
      const m: ChatMsg = JSON.parse(ev.data);
      if (m.type === "chat" || m.type === "server_ack") setMsgs((p) => [...p, m]);
    };
    return () => ws.close();
  }, [uid, roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  async function send() {
    if (!input.trim()) return;
    await api.post(`api/messages?roomId=${roomId}`, { json: { text: input } });
    setInput("");
  }

  if (!uid) return <div>로그인 필요. <a href="/login">로그인</a></div>;

  return (
    <section>
      <h1>Chat - {roomId}</h1>
      <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8, height: "60vh", overflowY: "auto" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ padding: "4px 0" }}>
            {m.type === "chat" ? (
              <div><span style={{ color: "#999", marginRight: 6 }}>#{m.serverSeq}</span><b>{m.senderId}</b>: {m.text}</div>
            ) : (
              <div style={{ color: "#3366ff" }}>ACK #{m.serverSeq}</div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" ? send() : undefined} style={{ flex: 1, padding: 8 }} />
        <button onClick={send}>보내기</button>
      </div>
    </section>
  );
}
