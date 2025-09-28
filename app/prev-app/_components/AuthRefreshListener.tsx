"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { subscribeAuth } from "@/src/lib/auth-broadcast";
import { invalidateAllApiCaches } from "@/src/lib/swr-cache";

export default function AuthRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeAuth((msg) => {
      if (msg.type === "token-refreshed") {
        mutate("me");
        invalidateAllApiCaches();
        router.refresh();
      }
      if (msg.type === "logged-out") {
        mutate("me", null, false);
        invalidateAllApiCaches();
        router.refresh();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [router]);

  return null;
}
