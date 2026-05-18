import type { AttemptStatus, JobStatus } from "@/lib/api";

const TONES: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  scheduled: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  running: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  sent:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  cancelled: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
};

export default function StatusBadge({
  status,
}: {
  status: JobStatus | AttemptStatus;
}) {
  const tone =
    TONES[status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {status}
    </span>
  );
}
