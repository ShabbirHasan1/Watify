"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import type { JobStatus, SendJobRead } from "@/lib/api";
import { useJobDetail } from "@/hooks/useJobs";

const ACTIVE: JobStatus[] = ["pending", "scheduled", "running"];

function fmt(d: string | null): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

export default function JobRow({
  job,
  onCancel,
}: {
  job: SendJobRead;
  onCancel: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const { detail } = useJobDetail(open ? job.id : null);

  const canCancel = ACTIVE.includes(job.status);
  const when =
    job.status === "scheduled"
      ? `scheduled ${fmt(job.scheduled_at)}`
      : job.finished_at
        ? `finished ${fmt(job.finished_at)}`
        : job.started_at
          ? `started ${fmt(job.started_at)}`
          : `created ${fmt(job.created_at)}`;

  return (
    <>
      <tr className="border-t border-zinc-200 dark:border-zinc-800">
        <td className="px-3 py-2 align-top font-mono text-xs">#{job.id}</td>
        <td className="px-3 py-2 align-top">{job.group_name}</td>
        <td className="px-3 py-2 align-top">
          <div className="text-sm">{job.message_preview}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{when}</div>
        </td>
        <td className="px-3 py-2 align-top">
          <StatusBadge status={job.status} />
        </td>
        <td className="px-3 py-2 align-top text-xs">
          <span className="text-emerald-700 dark:text-emerald-300">
            {job.counts.sent}
          </span>
          {" / "}
          {job.counts.total}
          {job.counts.failed > 0 && (
            <span className="text-rose-600 dark:text-rose-400">
              {" "}
              ({job.counts.failed} failed)
            </span>
          )}
        </td>
        <td className="px-3 py-2 align-top text-right whitespace-nowrap">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-zinc-600 dark:text-zinc-300 hover:underline mr-3"
          >
            {open ? "hide" : "details"}
          </button>
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(job.id)}
              className="text-xs text-rose-600 hover:underline"
            >
              cancel
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <td colSpan={6} className="px-3 py-3">
            {!detail ? (
              <p className="text-xs text-zinc-500">Loading attempts...</p>
            ) : (
              <div className="space-y-2">
                <div className="text-xs">
                  <span className="text-zinc-500">Message: </span>
                  <span className="font-mono whitespace-pre-wrap">
                    {detail.message}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  Per-recipient delay: {detail.min_delay_s}-
                  {detail.max_delay_s}s
                </div>
                <table className="w-full text-xs mt-1">
                  <thead className="text-left text-zinc-500">
                    <tr>
                      <th className="px-2 py-1">Contact</th>
                      <th className="px-2 py-1">Phone</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Sent at</th>
                      <th className="px-2 py-1">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.attempts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-2 text-zinc-500">
                          No attempts yet.
                        </td>
                      </tr>
                    ) : (
                      detail.attempts.map((a) => (
                        <tr
                          key={a.id}
                          className="border-t border-zinc-200 dark:border-zinc-800"
                        >
                          <td className="px-2 py-1">{a.contact_name}</td>
                          <td className="px-2 py-1 font-mono">
                            {a.contact_phone_redacted}
                          </td>
                          <td className="px-2 py-1">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="px-2 py-1">{fmt(a.sent_at)}</td>
                          <td className="px-2 py-1 text-rose-600 dark:text-rose-400">
                            {a.error ?? ""}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
