"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/src/lib/http";

export default function Register() {
  const r = useRouter();
  const [displayName, setDisplayName] = useState("데모");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo1234");
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setOk(null); setErr(null);
    try {
      await api.post("auth/register", { json: { displayName, email, password } });
      setOk("가입 완료. 로그인으로 이동합니다.");
      setTimeout(() => r.push("/login"), 800);
    } catch {
      setErr("가입 실패");
    }
  }

  return (
    <section style={{ maxWidth: 420 }}>
      <h1>회원가입</h1>
      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="이름" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={submit}>가입</button>
        {ok && <p style={{ color: "green" }}>{ok}</p>}
        {err && <p style={{ color: "tomato" }}>{err}</p>}
      </div>
    </section>
  );
}