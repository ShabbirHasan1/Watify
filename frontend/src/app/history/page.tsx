"use client";

import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import JobRow from "@/components/history/JobRow";
import RequireAuth from "@/components/RequireAuth";
import { useJobs } from "@/hooks/useJobs";

export default function HistoryPage() {
  return (
    <RequireAuth>
      <HistoryInner />
    </RequireAuth>
  );
}

function HistoryInner() {
  const { list, isLoading, cancelJob } = useJobs();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Send History</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Recent send jobs and per-recipient delivery.
          </p>
        </div>
        <Link
          href="/send"
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          New send
        </Link>
      </header>

      {isLoading && list.length === 0 ? (
        <EmptyState title="Loading send history..." />
      ) : list.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          body="Compose your first message to broadcast it to a friend group."
          cta={
            <Link
              href="/send"
              className="inline-flex rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Go to Send
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 w-16">Job</th>
                <th className="px-3 py-2 w-40">Group</th>
                <th className="px-3 py-2">Message</th>
                <th className="px-3 py-2 w-28">Status</th>
                <th className="px-3 py-2 w-36">Progress</th>
                <th className="px-3 py-2 w-32 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((j) => (
                <JobRow key={j.id} job={j} onCancel={cancelJob} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
