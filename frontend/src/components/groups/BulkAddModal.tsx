"use client";

import { useMemo, useState } from "react";
import { ApiError, type BulkRejectedReason, GROUP_MAX } from "@/lib/api";

type Row = { name: string; phone: string };

function parseLines(raw: string): Row[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(",");
      if (idx === -1) return { name: line, phone: "" };
      return {
        name: line.slice(0, idx).trim(),
        phone: line.slice(idx + 1).trim(),
      };
    });
}

export default function BulkAddModal({
  open,
  onClose,
  remaining,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  remaining: number;
  onSubmit: (rows: Row[]) => Promise<{ inserted: number; skipped: number }>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [reasons, setReasons] = useState<BulkRejectedReason[]>([]);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
  } | null>(null);

  const rows = useMemo(() => parseLines(text), [text]);
  const tooMany = rows.length > GROUP_MAX;
  const tooManyForGroup = rows.length > remaining;

  if (!open) return null;

  const canSubmit = rows.length > 0 && !tooMany && !tooManyForGroup && !busy;

  async function submit() {
    setBusy(true);
    setReasons([]);
    setResult(null);
    try {
      const out = await onSubmit(rows);
      setResult(out);
      if (out.inserted > 0 && out.skipped === 0) {
        // close on a clean batch after a beat so user sees the result
        setTimeout(onClose, 600);
      }
    } catch (e) {
      if (
        e instanceof ApiError &&
        typeof e.body === "object" &&
        e.body &&
        "reasons" in e.body &&
        Array.isArray((e.body as { reasons: unknown[] }).reasons)
      ) {
        setReasons((e.body as { reasons: BulkRejectedReason[] }).reasons);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold">Bulk add contacts</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            close
          </button>
        </header>

        <div className="p-5 space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Paste up to {GROUP_MAX} rows, one per line:{" "}
            <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">
              name, phone
            </code>
            . Existing phone numbers in this group are skipped (not errors).
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={"Priya, +91 9876543210\nArjun, +91 9876543211"}
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm font-mono"
          />

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>
              {rows.length} row{rows.length === 1 ? "" : "s"} parsed
            </span>
            <span>Remaining slots in this group: {remaining}</span>
          </div>

          {tooMany && (
            <p className="text-xs text-rose-600">
              Too many rows. The bulk endpoint accepts at most {GROUP_MAX}.
            </p>
          )}
          {!tooMany && tooManyForGroup && (
            <p className="text-xs text-rose-600">
              This group can only fit {remaining} more contact
              {remaining === 1 ? "" : "s"} before the 20-cap.
            </p>
          )}

          {reasons.length > 0 && (
            <div className="rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 p-3 text-xs">
              <div className="font-medium text-rose-700 dark:text-rose-300 mb-1">
                Batch rejected. Fix these rows and submit again:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-rose-700 dark:text-rose-300">
                {reasons.map((r) => (
                  <li key={r.index}>
                    row {r.index + 1}: {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <div className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              Inserted {result.inserted}, skipped {result.skipped} (duplicates).
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed"
          >
            {busy ? "Submitting..." : "Submit"}
          </button>
        </footer>
      </div>
    </div>
  );
}
