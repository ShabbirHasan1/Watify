export default function SendPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Send Message</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Compose a message, pick a group, dispatch immediately or schedule. Random per-recipient delay 3-30s (user-configurable).
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center text-zinc-500">
        Placeholder. The compose flow is implemented in PLAN item F-05.
      </div>
    </div>
  );
}
