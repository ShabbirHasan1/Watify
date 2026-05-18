"use client";

import useSWR, { mutate } from "swr";
import { toast } from "@/components/Toaster";
import { wa, type WaState } from "@/lib/api";

const KEY = "/api/wa/state";

export function useWaState() {
  const { data, error, isLoading } = useSWR<WaState>(
    KEY,
    () => wa.state(),
    {
      refreshInterval: (latest) => {
        const phase = (latest as WaState | undefined)?.state;
        // 1s while pairing so the QR-age countdown stays smooth;
        // 2s while disconnected to detect background state changes; off otherwise.
        if (phase === "pairing") return 1000;
        if (phase === "disconnected") return 2000;
        return 0;
      },
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryInterval: 3000,
    }
  );

  async function connect() {
    const next = await wa.connect();
    await mutate(KEY, next, { revalidate: false });
  }

  async function disconnect() {
    const next = await wa.disconnect();
    await mutate(KEY, next, { revalidate: false });
    toast.success("WhatsApp disconnected");
  }

  return {
    waState: data,
    isLoading,
    isError: Boolean(error),
    error,
    connect,
    disconnect,
    refresh: () => mutate(KEY),
  };
}
