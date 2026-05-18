"use client";

import useSWR, { mutate } from "swr";
import { groups, type FriendGroupRead } from "@/lib/api";

const LIST_KEY = "/api/groups";

export function useGroups() {
  const { data, error, isLoading } = useSWR<FriendGroupRead[]>(
    LIST_KEY,
    () => groups.list(),
    { revalidateOnFocus: false, refreshInterval: 0 }
  );

  async function createGroup(name: string): Promise<FriendGroupRead> {
    const g = await groups.create(name);
    await mutate(LIST_KEY);
    return g;
  }

  async function renameGroup(id: number, name: string) {
    await groups.rename(id, name);
    await mutate(LIST_KEY);
    await mutate(`/api/groups/${id}`);
  }

  async function deleteGroup(id: number) {
    await groups.remove(id);
    await mutate(LIST_KEY);
  }

  return {
    list: data ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    createGroup,
    renameGroup,
    deleteGroup,
    refresh: () => mutate(LIST_KEY),
  };
}
