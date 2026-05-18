const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function parseBody(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await parseBody(res);
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new ApiError(res.status, message, body);
  }
  return (await parseBody(res)) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

export type Health = {
  ok: boolean;
  service: string;
  version: string;
};

export type WaPhase = "disconnected" | "pairing" | "ready" | "error";

export type WaState = {
  state: WaPhase;
  qr_data_url: string | null;
  owner_phone: string | null;
  last_error: string | null;
  last_event_at: string | null;
};

export const wa = {
  state: () => api.get<WaState>("/api/wa/state"),
  connect: () => api.post<WaState>("/api/wa/connect"),
  disconnect: () => api.post<WaState>("/api/wa/disconnect"),
};

export type ContactRead = {
  id: number;
  group_id: number;
  name: string;
  phone_e164: string;
  created_at: string;
};

export type FriendGroupRead = {
  id: number;
  name: string;
  created_at: string;
  contact_count: number;
};

export type FriendGroupDetail = {
  id: number;
  name: string;
  created_at: string;
  contacts: ContactRead[];
};

export type BulkContactsResponse = {
  inserted: ContactRead[];
  skipped: ContactRead[];
};

export type BulkRejectedReason = { index: number; reason: string };

export const groups = {
  list: () => api.get<FriendGroupRead[]>("/api/groups"),
  get: (id: number) => api.get<FriendGroupDetail>(`/api/groups/${id}`),
  create: (name: string) =>
    api.post<FriendGroupRead>("/api/groups", { name }),
  rename: (id: number, name: string) =>
    api.patch<FriendGroupRead>(`/api/groups/${id}`, { name }),
  remove: (id: number) => api.del<void>(`/api/groups/${id}`),
  addContact: (id: number, name: string, phone: string) =>
    api.post<ContactRead>(`/api/groups/${id}/contacts`, { name, phone }),
  removeContact: (id: number, contactId: number) =>
    api.del<void>(`/api/groups/${id}/contacts/${contactId}`),
  bulkAddContacts: (
    id: number,
    contacts: { name: string; phone: string }[]
  ) =>
    api.post<BulkContactsResponse>(
      `/api/groups/${id}/contacts/bulk`,
      { contacts }
    ),
};

export const GROUP_MAX = 20;
