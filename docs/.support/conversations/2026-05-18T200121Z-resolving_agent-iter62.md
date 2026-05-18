# Iteration 62 -- Resolving Agent (TKT-0026)

- **Started**: 2026-05-18T20:01:21Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0026 (P1 frontend) -- /login + /register pages

## Plan
Five deliverables per the TKT-0026 spec:

1. **`frontend/src/lib/api.ts`**: add `auth.login(username, password)`, `auth.register(username, password)`, `auth.logout()`, `auth.me()` typed helpers + response types (`AuthAck`, `MeResponse`). All inherit `credentials: "include"` from apiFetch (post-TKT-0034). Endpoint shapes confirmed from `backend/app/routers/auth.py`:
   - `POST /api/auth/login` body `{username, password}` -> 200 `{ok, username}`, 401 `{error:"invalid_credentials"}`, 429 `{error:"locked_out", retry_after}` + `Retry-After` header, 503 `{error:"auth_not_configured"}`.
   - `POST /api/auth/register` body `{username, password}` -> 201 `{ok, username}`, 409 `{error:"registration_closed"}`, 422 validation, 503.
   - `POST /api/auth/logout` -> 200 `{ok:true}` (best-effort; always clears cookies on the response).
   - `GET /api/auth/me` -> 200 `{username, created_at}`, 401 `auth_required`.
2. **`frontend/src/hooks/useAuth.ts`**: SWR over `/api/auth/me`. Exports `{user, isLoading, isError, logout()}`. Revalidate-on-focus enabled (60s dedupe). 401 must NOT trigger an SWR retry loop -- treat 401 as "no user", not as an error worth retrying.
3. **`frontend/src/app/login/page.tsx`**: a client component with `username` + `password` form. Password client-validated length >= 12 (matches REQUIREMENTS A2 + backend `LoginRequest` min_length=1 -- the >=12 is the *register* contract; for login the backend accepts any length, but the form will still hint at the constraint so the user knows their password meets it). On submit: call `auth.login`, on success `router.push("/")` (TKT-0027 will later move dashboard to `/dashboard`; for now `/` is the dashboard). On 401 inline error. On 429 show `retry_after` seconds. On 503 show "auth not configured" with a link to the operator note. No emojis, no icons.
4. **`frontend/src/app/register/page.tsx`**: mirrors `/login` shape. Password client-validated length >= 12. On 201 success: `router.push("/")`. On 409 `registration_closed` render an "App already registered" panel with a `/login` button (no form). On 503 same as login. Hint text says "Watify is single-user; only one account can be registered."
5. Confirm `npx tsc --noEmit` clean.

The dashboard tree at `/`, `/connect`, `/groups`, `/send`, `/history` is intentionally NOT touched in this iteration -- TKT-0027 (hero + `/dashboard` move), TKT-0028 (auth-aware TopNav), TKT-0029 (route guards) all ship later. Per AGENTS.md "one ticket at a time".

## Actions

1. Marked TKT-0026 status `inprogress`.
2. Read `frontend/src/lib/api.ts` end-to-end (212 lines) and `backend/app/routers/auth.py` (lines 1-230) to lock in the exact response shapes for each endpoint -- `AuthAck = {ok:true, username}`, `MeResponse = {username, created_at}`, and the flat error envelopes with `error` + `detail` (and `retry_after` on 429 locked_out).
3. Read `frontend/src/app/layout.tsx` to confirm `TopNav` is mounted globally; the `/login` and `/register` routes will inherit it (TKT-0028 will later make TopNav auth-aware).
4. Read `frontend/src/hooks/useHealth.ts` to copy the SWR conventions in use (refreshInterval+revalidateOnFocus, isError vs isLoading shape).
5. Extended `frontend/src/lib/api.ts`: added `app_fingerprint: string | null` to `Health` (the backend already returns it post TKT-0031), added `AuthAck` and `MeResponse` types and the `auth` helper bundle. apiFetch already centralizes `credentials: "include"` post TKT-0034, so every wrapper inherits it for free.
6. Wrote `frontend/src/hooks/useAuth.ts` -- SWR over `/api/auth/me` with the no-retry-on-401 fetcher pattern; mutator `logout()` POSTs `/api/auth/logout` (best-effort) then writes null into the SWR cache so consumers re-render immediately as logged-out.
7. Wrote `frontend/src/app/login/page.tsx` -- 152 lines, all Tailwind, no emojis, no icons. ErrorPanel component handles all four error kinds (invalid, locked, not_configured, validation/generic). `parseRetryAfter` extracts `retry_after` defensively from the flat detail envelope.
8. Wrote `frontend/src/app/register/page.tsx` -- 173 lines, mirrors login but with a confirm-password field and the 409 branch that replaces the entire form with the "App already registered" panel.
9. `npx --no-install tsc --noEmit`: first run reported one error at `src/app/register/page.tsx:131` -- after the early-return for `kind === "closed"`, TypeScript had already narrowed the type, so the trailing `err.kind !== "closed"` check was a tautology. Simplified to `{err && <ErrorPanel state={err} />}` and tightened the `ErrorPanel` prop type to `Exclude<NonNullable<ErrorState>, { kind: "closed" }>`. Re-ran -- exit 0.
10. Marked TKT-0026 status `resolved` with a detailed Resolution history entry.
11. Will update PIPELINE.md to phase=verification, agent=verification_agent, iteration=62, ticket counts open=13 resolved=1 verified=20.

## Outcome
TKT-0026 resolved. Login/register UI shipped with cookie flow inheriting credentials from apiFetch. Type-check clean across the whole frontend tree. The Next.js dev server (pid 42204) HMR-picks the new routes immediately. Awaits Verification Agent to drive the login flow in a browser (or via simulated cross-origin curl if Chrome MCP is still hijacked by the Strike SW).
