"use client";

import { useEffect, useState } from "react";
import BulkAddModal from "@/components/groups/BulkAddModal";
import EmptyState from "@/components/EmptyState";
import { ApiError, GROUP_MAX } from "@/lib/api";
import { useGroupDetail } from "@/hooks/useGroupDetail";
import { useGroups } from "@/hooks/useGroups";

export default function GroupsPage() {
  const { list, isLoading, createGroup, deleteGroup } = useGroups();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedId == null && list.length > 0) {
      setSelectedId(list[0].id);
    }
  }, [list, selectedId]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const name = newName.trim();
    if (!name) return;
    try {
      const g = await createGroup(name);
      setNewName("");
      setSelectedId(g.id);
    } catch (e) {
      if (e instanceof ApiError) {
        setCreateError(
          e.status === 409 ? "A group with that name already exists." : e.message
        );
      } else {
        setCreateError("Could not create the group.");
      }
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Friend Groups</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Create watchlists of up to {GROUP_MAX} contacts each.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <aside className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
          <h2 className="text-sm font-semibold">Groups</h2>

          {isLoading && list.length === 0 ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : null}

          {list.length === 0 && !isLoading ? (
            <p className="text-sm text-zinc-500">No groups yet.</p>
          ) : (
            <ul className="space-y-1">
              {list.map((g) => {
                const active = g.id === selectedId;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(g.id)}
                      className={`w-full text-left rounded-md px-2 py-1.5 text-sm flex items-center justify-between gap-2 transition ${
                        active
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {g.contact_count}/{GROUP_MAX}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={onCreate} className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <label
              htmlFor="new-group"
              className="block text-xs uppercase tracking-wide text-zinc-500"
            >
              New group
            </label>
            <div className="flex gap-2">
              <input
                id="new-group"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. crew"
                maxLength={80}
                className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Create
              </button>
            </div>
            {createError && (
              <p className="text-xs text-rose-600">{createError}</p>
            )}
          </form>
        </aside>

        <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          {selectedId == null ? (
            <EmptyState
              title="No group selected"
              body="Pick a group on the left, or create one to start adding contacts."
            />
          ) : (
            <GroupDetailPanel
              groupId={selectedId}
              onDelete={async () => {
                await deleteGroup(selectedId);
                setSelectedId(null);
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function GroupDetailPanel({
  groupId,
  onDelete,
}: {
  groupId: number;
  onDelete: () => Promise<void>;
}) {
  const { detail, isLoading, addContact, removeContact, bulkAddContacts } =
    useGroupDetail(groupId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rowErr, setRowErr] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  if (isLoading || !detail) {
    return <p className="text-sm text-zinc-500">Loading group...</p>;
  }

  const remaining = GROUP_MAX - detail.contacts.length;
  const full = remaining <= 0;

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setRowErr(null);
    if (!name.trim() || !phone.trim()) return;
    try {
      await addContact(name.trim(), phone.trim());
      setName("");
      setPhone("");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) setRowErr("This group is full (20).");
        else if (e.status === 422)
          setRowErr("Phone is not valid. Use digits + optional country code.");
        else setRowErr(e.message);
      } else {
        setRowErr("Could not add contact.");
      }
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{detail.name}</h2>
          <p className="text-xs text-zinc-500">
            {detail.contacts.length}/{GROUP_MAX} contacts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            disabled={full}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bulk add
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-rose-300 dark:border-rose-900 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950"
          >
            Delete group
          </button>
        </div>
      </header>

      <form
        onSubmit={onAdd}
        className="flex flex-wrap items-end gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3"
      >
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs uppercase tracking-wide text-zinc-500">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={full}
            maxLength={80}
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm disabled:opacity-50"
            placeholder="Alice"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs uppercase tracking-wide text-zinc-500">
            Phone
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={full}
            maxLength={40}
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm disabled:opacity-50"
            placeholder="+91 9876543210"
          />
        </div>
        <button
          type="submit"
          disabled={full}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed"
        >
          {full ? "Group full" : "Add contact"}
        </button>
      </form>

      {rowErr && <p className="text-xs text-rose-600">{rowErr}</p>}

      <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {detail.contacts.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4">
                  <EmptyState
                    title="No contacts yet"
                    body={`Add one above or paste up to ${GROUP_MAX} rows with the Bulk add button.`}
                  />
                </td>
              </tr>
            ) : (
              detail.contacts.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950">
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {c.phone_e164}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeContact(c.id)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BulkAddModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        remaining={remaining}
        onSubmit={async (rows) => {
          const res = await bulkAddContacts(rows);
          return { inserted: res.inserted.length, skipped: res.skipped.length };
        }}
      />
    </div>
  );
}
