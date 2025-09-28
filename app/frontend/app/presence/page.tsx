"use client";
import { useEffect, useState } from "react";
export default function PresencePage(){
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/bridge/presence/online").then(r => r.json()).then(setData).catch(() => setData({error: true}));
  }, []);
  return (
    <section>
      <h1>Presence</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
