export default function GroupsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Friend Groups</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Create and manage your friend watchlists. Hard cap of 20 contacts per group.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center text-zinc-500">
        Placeholder. CRUD + bulk upload are implemented in PLAN item F-04.
      </div>
    </div>
  );
}
