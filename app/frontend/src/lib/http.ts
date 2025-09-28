import ky from "ky";
import { getAccessToken, setAccessToken } from "./auth";

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
          const r = await fetch("/api/bridge/auth/refresh", { method: "POST" });
          if (r.ok) {
            const data = await r.json().catch(() => null);
            if (data?.accessToken) {
              setAccessToken(data.accessToken);
              return api(req);
            }
          }
          setAccessToken(null);
        }
      }
    ]
  }
});
