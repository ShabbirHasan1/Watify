// TKT-0029: honor the `?next=` query param post-login, but only when it
// is a same-origin path. Anything else (absolute URLs, protocol-relative
// `//evil.com`, paths with `:` that browsers interpret as a scheme, or
// non-strings) falls back to the safe default. Extracted from
// app/login/page.tsx for unit testability (TKT-0039).

export function safeNextPath(raw: string | null | undefined): string {
  const fallback = "/dashboard";
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes(":")) return fallback;
  return raw;
}
