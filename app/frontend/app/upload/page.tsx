"use client";
import { useState } from "react";

export default function UploadPage(){
  const [file, setFile] = useState<File | null>(null);
  const [room, setRoom] = useState("general");
  const [download, setDownload] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const run = async () => {
    if (!file) return;
    setStatus("presign...");
    const pres = await fetch("/api/bridge/files/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contentType: file.type || "application/octet-stream", roomCode: room, bytes: file.size })
    }).then(r => r.json());

    setStatus("uploading...");
    await fetch(pres.url, { method: "PUT", headers: pres.headers || {}, body: file });

    setStatus("attaching...");
    const att = await fetch("/api/bridge/files/attach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomCode: room, key: pres.key, contentType: file.type || "application/octet-stream", bytes: file.size })
    }).then(r => r.json());

    setDownload(att.download);
    setStatus("done");
  };

  return (
    <section>
      <h1>파일 업로드</h1>
      <div style={{display: "grid", gap: 8}}>
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="room code"/>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={run}>업로드</button>
        <p>{status}</p>
        {download && <p><a href={download} target="_blank">다운로드 링크</a></p>}
      </div>
    </section>
  );
}
