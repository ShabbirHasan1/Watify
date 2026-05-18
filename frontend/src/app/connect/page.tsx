"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWaState } from "@/hooks/useWaState";

const AUTO_FLAG = "watify.autopair.started";

export default function ConnectPage() {
  const { waState, isLoading, connect, disconnect } = useWaState();
  const [busy, setBusy] = useState(false);
  const autoStarted = useRef(false);

  // Auto-pair once per mount / per session. Three layers of guard so dev
  // hot-reloads do not stampede /api/wa/connect:
  //   1. useRef survives within a single mount.
  //   2. sessionStorage flag survives Fast Refresh remounts.
  //   3. We only auto-start when state is "disconnected" -- if the wars
  //      worker is already pairing or ready we never touch it.
  useEffect(() => {
    if (!waState) return;
    if (autoStarted.current) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(AUTO_FLAG)) {
      autoStarted.current = true;
      return;
    }
    if (waState.state !== "disconnected") {
      // Already pairing/ready/error -- treat as if auto-pair fired.
      autoStarted.current = true;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTO_FLAG, "1");
      }
      return;
    }
    autoStarted.current = true;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(AUTO_FLAG, "1");
    }
    setBusy(true);
    connect()
      .catch(() => {
        // swallow; the state machine will surface last_error
      })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waState?.state]);

  async function handleDisconnect() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTO_FLAG);
    }
    autoStarted.current = false;
    await disconnect();
  }

  async function handleManualConnect() {
    autoStarted.current = true;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(AUTO_FLAG, "1");
    }
    await connect();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Connect WhatsApp</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Pair this app with WhatsApp on your phone. Single-user, single-device.
        </p>
      </header>

      {isLoading && !waState ? (
        <PanelMuted>Checking backend...</PanelMuted>
      ) : null}

      {waState?.state === "disconnected" && !busy ? (
        <PanelMuted>
          <div className="flex items-center justify-between gap-3">
            <span>Not connected yet.</span>
            <button
              type="button"
              onClick={() => handleManualConnect()}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Start pairing
            </button>
          </div>
        </PanelMuted>
      ) : null}

      {waState?.state === "pairing" ? (
        <PairingPanel
          qrDataUrl={waState.qr_data_url}
          lastEventAt={waState.last_event_at}
        />
      ) : null}

      {waState?.state === "ready" ? (
        <ReadyPanel
          ownerPhone={waState.owner_phone}
          onDisconnect={() => handleDisconnect()}
        />
      ) : null}

      {waState?.state === "error" ? (
        <ErrorPanel
          message={waState.last_error}
          onRetry={() => handleManualConnect()}
        />
      ) : null}
    </div>
  );
}

function PanelMuted({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-700 dark:text-zinc-300">
      {children}
    </div>
  );
}

const QR_LIFETIME_S = 30;
const QR_STALE_AT_S = 20;

function PairingPanel({
  qrDataUrl,
  lastEventAt,
}: {
  qrDataUrl: string | null;
  lastEventAt: string | null;
}) {
  // Tick every 500ms so the countdown reads smoothly. SWR's 1s poll
  // bumps lastEventAt on each on_qr fire, which resets the timer.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const ageMs = useMemo(() => {
    if (!lastEventAt) return null;
    const t = Date.parse(lastEventAt);
    if (Number.isNaN(t)) return null;
    return Math.max(0, now - t);
  }, [lastEventAt, now]);
  const ageS = ageMs == null ? null : Math.floor(ageMs / 1000);
  const remainingS = ageS == null ? null : Math.max(0, QR_LIFETIME_S - ageS);

  let tone: string;
  let label: string;
  let dim = false;
  if (ageS == null || !qrDataUrl) {
    tone = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    label = "Waiting for QR...";
  } else if (ageS < QR_STALE_AT_S) {
    tone = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    label = `Fresh QR. Scan within ~${remainingS}s.`;
  } else if (ageS < QR_LIFETIME_S) {
    tone = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    label = `Refreshing soon (${remainingS}s left). Wait for the next QR if your scan fails.`;
  } else {
    tone = "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
    label = "QR expired. Waiting for a fresh one to load...";
    dim = true;
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h2 className="text-base font-semibold">Scan the QR with WhatsApp</h2>
      <ol className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 list-decimal pl-5 space-y-1">
        <li>Open WhatsApp on your phone.</li>
        <li>Tap Settings then Linked devices.</li>
        <li>Tap Link a device and scan this code.</li>
      </ol>
      <div className="mt-4 flex justify-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="WhatsApp pairing QR"
            className={`h-72 w-72 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white p-2 transition-opacity ${dim ? "opacity-30" : "opacity-100"}`}
          />
        ) : (
          <div className="h-72 w-72 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-sm text-zinc-500">
            Waiting for QR...
          </div>
        )}
      </div>
      <div
        className={`mt-3 inline-flex w-full justify-center rounded-md px-3 py-1.5 text-xs font-medium ${tone}`}
      >
        {label}
      </div>
      <p className="mt-2 text-xs text-zinc-500 text-center">
        WhatsApp rotates this code every {QR_LIFETIME_S} seconds. The page updates automatically.
        If your phone says &quot;can&apos;t connect&quot;, the QR likely expired -- wait for the next one.
      </p>
    </div>
  );
}

function ReadyPanel({
  ownerPhone,
  onDisconnect,
}: {
  ownerPhone: string | null;
  onDisconnect: () => void;
}) {
  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
            WhatsApp connected
          </h2>
          <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
            Linked as {ownerPhone ?? "this device"}.
          </p>
        </div>
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-md border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-zinc-800"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 p-6">
      <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200">
        Pairing failed
      </h2>
      <p className="mt-1 text-sm text-rose-800 dark:text-rose-300 break-all">
        {message ?? "Unknown error."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
      >
        Retry
      </button>
    </div>
  );
}
