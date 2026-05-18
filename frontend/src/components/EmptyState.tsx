import type { ReactNode } from "react";

export default function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: ReactNode;
  cta?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 text-center">
      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{title}</div>
      {body ? <div className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">{body}</div> : null}
      {cta ? <div className="mt-3">{cta}</div> : null}
    </div>
  );
}
