"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/src/lib/http";
import { setAccessToken } from "@/src/lib/auth";

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo1234");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    try {
      const res = await api.post("auth/login", { json: { email, password } }).json<{ accessToken: string }>();
      setAccessToken(res.accessToken);
      r.push("/chat");
    } catch (e: any) {
      setErr("로그인 실패");
    }
  }

  return (
    <section style={{ maxWidth: 420 }}>
      <h1>로그인</h1>
      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={submit}>로그인</button>
        {err && <p style={{ color: "tomato" }}>{err}</p>}
      </div>
    </section>
  );
}