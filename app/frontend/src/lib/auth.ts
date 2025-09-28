let accessToken: string | null = null;
export function setAccessToken(t: string | null) {
  accessToken = t;
  if (t) localStorage.setItem("at", t);
  else localStorage.removeItem("at");
}
export function getAccessToken() {
  if (accessToken) return accessToken;
  accessToken = typeof window !== "undefined" ? localStorage.getItem("at") : null;
  return accessToken;
}
export function parseJwt(t: string | null) {
  if (!t) return null;
  try {
    const p = t.split(".")[1];
    const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("utf8"));
  } catch {
    return null;
  }
}
