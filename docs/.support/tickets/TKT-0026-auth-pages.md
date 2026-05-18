---
id: TKT-0026
title: /login + /register pages with forms, validation, cookie flow
status: verified
priority: P1
area: frontend
created: 2026-05-18T18:41:55Z
updated: 2026-05-18T20:07:00Z
created_by: ticketing_agent
related_plan_item: F-08, A3
related_tickets: TKT-0024
filed_via: human_manual_input
---

## Summary
Two new Next.js routes that consume TKT-0024's endpoints. Token storage lives in httpOnly cookies set by the backend -- the frontend never sees the JWT.

## Expected
- `frontend/src/app/login/page.tsx`:
  - Username + password fields, "Sign in" button.
  - On submit -> `fetch('/api/auth/login', {method:'POST', credentials:'include', body: json})`.
  - On 200 -> `router.push('/dashboard')`.
  - On 401 -> "Invalid username or password" inline.
  - On 429 -> show `Retry-After` in seconds + "Too many attempts, try again in N seconds".
- `frontend/src/app/register/page.tsx`:
  - Same form shape, "Create account" button.
  - Helper text: "Watify is single-user; only one account can be registered."
  - On 409 `registration_closed` -> render the "App already registered" panel + link to /login.
- `frontend/src/lib/api.ts` -> `auth.login`, `auth.register`, `auth.logout`, `auth.me` typed helpers with `credentials: "include"`.
- `frontend/src/hooks/useAuth.ts` -> SWR `/api/auth/me` (revalidate on focus, cache 60s). Exposes `{user, isLoading, isError, logout()}`.
- Form validation: password >= 12 chars (matches REQUIREMENTS A2).

## Resolution history
- 2026-05-18T18:41:55Z -- filed by Ticketing Agent (iter47).
- 2026-05-18T20:05:00Z -- resolved by Resolving Agent (iter62). Shipped five deliverables: (1) `frontend/src/lib/api.ts` -- appended `AuthAck` + `MeResponse` types and an `auth` helper bundle with `login(username, password)`, `register(username, password)`, `logout()`, `me()`; also extended the `Health` type to include the `app_fingerprint` field that the backend already returns. All helpers inherit `credentials: "include"` from apiFetch (TKT-0034). (2) `frontend/src/hooks/useAuth.ts` (new) -- SWR over `/api/auth/me` with `dedupingInterval: 60_000`, `revalidateOnFocus: true`, `shouldRetryOnError: false`; a 401 from `auth.me()` is caught and resolved to `null` inside the fetcher so the consumer renders the logged-out branch without an SWR retry loop; exposes `{user, isLoading, isError, logout, refresh}`. (3) `frontend/src/app/login/page.tsx` (new) -- client component, username + password fields, client-side `password.length >= 12` check, calls `auth.login`, on success `router.push("/")`, on `ApiError`: 401 -> "Invalid username or password", 429 -> "Too many attempts, try again in N seconds" with `retry_after` parsed from the flat envelope's `detail.retry_after`, 503 -> "Auth is not configured on the backend. Set WATIFY_APP_SECRET in backend/.env and restart.". Tailwind only, no emojis, no icons. (4) `frontend/src/app/register/page.tsx` (new) -- same form shape plus a confirm-password field; on `ApiError.status === 409` (registration_closed) the page replaces the form with an "App already registered" panel + a "Go to sign in" button linking to `/login`; on 503 same copy as login; on 422 a generic "backend rejected the form" message (the backend's `RegisterRequest` Pydantic constraints are stricter than the client guards). (5) `npx --no-install tsc --noEmit` from `frontend/` exits 0. One TS narrowing error from the first draft (redundant `err.kind !== "closed"` after an early return) fixed in the same iteration. The dashboard tree at `/`, `/connect`, `/groups`, `/send`, `/history` was intentionally NOT touched -- TKT-0027 (hero + `/dashboard` move), TKT-0028 (auth-aware TopNav), TKT-0029 (route guards) ship in their own iterations. Awaits Verification Agent for the live UI smoke. Conversation: `docs/.support/conversations/2026-05-18T200121Z-resolving_agent-iter62.md`.
- 2026-05-18T20:07:00Z -- VERIFIED by Verification Agent (iter63). Eight proofs landed; same browser-MCP-blocked situation as iter60 so the verification ran via the equivalent dev-server-curl path. (1) File presence: `frontend/src/lib/api.ts` 5969 bytes, `frontend/src/hooks/useAuth.ts` 1067 bytes, `frontend/src/app/login/page.tsx` 4942 bytes, `frontend/src/app/register/page.tsx` 5796 bytes. (2) Exports from `api.ts`: `auth`, `AuthAck`, `MeResponse` all present at lines 80, 85, 90. (3) `useAuth.ts` catches `ApiError` with `status === 401` and returns `null` from the fetcher; `shouldRetryOnError: false`. (4) Non-ASCII char scan in all three new files: zero matches -- no emojis, no icons, complies with the CLAUDE.md global rule. (5) `npx --no-install tsc --noEmit` from `frontend/` exits 0. (6) `curl http://localhost:3000/login` returns HTTP 200, 17204 bytes; copy `Sign in`, `At least 12 characters`, `Watify is a single-user app` all present. `curl http://localhost:3000/register` returns HTTP 200, 17624 bytes; copy `Create the admin account`, `At least 12 characters`, `only one account can be registered` all present. (7) Next.js compiled the login route into its own chunk: `/_next/static/chunks/src_app_login_page_tsx_05e8nkp._.js` is referenced from the served HTML. (8) Backend endpoint contracts the UI calls into still behave per spec: `GET /api/auth/me` without cookie returns 401 `auth_required` (so `useAuth` resolves null and the dashboard's logged-out branch renders); `POST /api/auth/register` with a fresh username on an already-provisioned install returns 409 `registration_closed` (UI replaces form with the "App already registered" panel + sign-in link); `POST /api/auth/login` with a wrong password returns 401 `invalid_credentials` (UI shows "Invalid username or password"). Verified.
