"use client";

import { useState } from "react";

const SOFT_CAP = 100;

export default function SoftCapBanner({ sent24h }: { sent24h: number }) {
  const [open, setOpen] = useState(false);
  if (sent24h <= SOFT_CAP) return null;

  return (
    <div className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {sent24h} messages sent in the last 24 hours. WhatsApp may flag
          accounts that look like bulk senders.
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs underline text-amber-800 dark:text-amber-300"
        >
          {open ? "hide" : "why"}
        </button>
      </div>
      {open && (
        <div className="mt-2 text-xs text-amber-800 dark:text-amber-300 max-w-3xl">
          Unofficial WhatsApp clients can get the linked device unlinked or the
          whole account banned by Meta&apos;s automation when send volume looks
          bot-like. Sending to dozens of distinct contacts who have not messaged
          you first, or the same body to many recipients in a short window, is
          the dominant trigger. Stay personal-volume; use the official Cloud
          API for bulk outreach.
        </div>
      )}
    </div>
  );
}
