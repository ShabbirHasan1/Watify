"use client";

import useSWR, { mutate } from "swr";
import {
  groups,
  type BulkContactsResponse,
  type FriendGroupDetail,
} from "@/lib/api";

function key(id: number | null) {
  return id == null ? null : `/api/groups/${id}`;
}

export function useGroupDetail(id: number | null) {
  const k = key(id);
  const { data, error, isLoading } = useSWR<FriendGroupDetail>(
    k,
    () => groups.get(id!),
    { revalidateOnFocus: false, refreshInterval: 0 }
  );

  async function addContact(name: string, phone: string) {
    if (id == null) throw new Error("no group selected");
    await groups.addContact(id, name, phone);
    await mutate(k);
    await mutate("/api/groups");
  }

  async function removeContact(contactId: number) {
    if (id == null) throw new Error("no group selected");
    await groups.removeContact(id, contactId);
    await mutate(k);
    await mutate("/api/groups");
  }

  async function bulkAddContacts(
    contacts: { name: string; phone: string }[]
  ): Promise<BulkContactsResponse> {
    if (id == null) throw new Error("no group selected");
    const res = await groups.bulkAddContacts(id, contacts);
    await mutate(k);
    await mutate("/api/groups");
    return res;
  }

  return {
    detail: data,
    isLoading,
    isError: Boolean(error),
    error,
    addContact,
    removeContact,
    bulkAddContacts,
    refresh: () => mutate(k),
  };
}
