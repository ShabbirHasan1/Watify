"use client";

import useSWR from "swr";
import { ApiError, auth, type MeResponse } from "@/lib/api";

const KEY = "/api/auth/me";

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<MeResponse | null>(
    KEY,
    async () => {
      try {
        return await auth.me();
      } catch (e) {
        // TKT-0026: 401 means "no session", not an error worth
        // retrying. Resolve to null so the consumer can render the
        // logged-out branch without entering an SWR retry loop.
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 60_000,
      shouldRetryOnError: false,
    }
  );

  async function logout() {
    try {
      await auth.logout();
    } catch {
      // best-effort: backend clears cookies on the response anyway.
    }
    await mutate(null, { revalidate: false });
  }

  return {
    user: data ?? null,
    isLoading,
    isError: Boolean(error),
    logout,
    refresh: () => mutate(),
  };
}
