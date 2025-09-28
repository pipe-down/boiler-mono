import ky from "ky";
import { getAccessToken, saveSession, clearSession } from "./auth";

export const api = ky.create({
  prefixUrl: "/api/bridge",
  hooks: {
    beforeRequest: [
      (req) => {
        const at = getAccessToken();
        if (at) req.headers.set("Authorization", `Bearer ${at}`);
      }
    ],
    afterResponse: [
      async (req, _opt, res) => {
        if (res.status === 401) {
          try {
            const r = await fetch("/api/bridge/auth/refresh", { method: "POST" });
            if (r.ok) {
              const data = await r.json().catch(() => null);
              if (data?.accessToken) {
                saveSession(data.accessToken);
                return api(req);
              }
            }
          } catch {}
          // If refresh fails, clear session and redirect
          clearSession();
          // In a real app, you might want to redirect to login here
          // window.location.href = '/login';
        }
      }
    ]
  }
});

export const apiFetcher = (url: string) => api.get(url).json();

