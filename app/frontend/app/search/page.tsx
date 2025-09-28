"use client";
import { useState } from "react";
import { api } from "@/src/lib/http";

export default function Search(){
  const [q, setQ] = useState("");
  const [data, setData] = useState<any>(null);
  async function run(){
    const txt = await api.get("search/messages", { searchParams: { q } }).text();
    try { setData(JSON.parse(txt)); } catch { setData({raw: txt}); }
  }
  return (
    <section>
      <h1>Message Search</h1>
      <div style={{display: "flex", gap: 8}}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="키워드" style={{flex:1}}/>
        <button onClick={run}>검색</button>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
