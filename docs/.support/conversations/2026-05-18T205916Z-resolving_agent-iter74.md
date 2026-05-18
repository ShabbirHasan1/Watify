# Iteration 74 -- Resolving Agent (TKT-0029)

- **Started**: 2026-05-18T20:59:16Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0029 (P2 frontend) -- route guards

## Plan
Ship the client-side `<RequireAuth>` path. Three substantive pieces:

1. **New `frontend/src/components/RequireAuth.tsx`** -- client component, uses `useAuth()` + `usePathname` + `useRouter` from `next/navigation`. Branches:
   - `isLoading` -> render a thin skeleton (small "Loading..." line in the page slot).
   - `!user` -> on mount/update, `router.replace("/login?next=" + encodeURIComponent(pathname))`. Render the same skeleton to avoid flashing the page content.
   - `user` -> render `{children}`.
2. **Wrap the five authed pages**. Each currently exports a default function like `DashboardPage()` that returns the page JSX. The minimal wrap is to rename that inner component (e.g. `DashboardInner`) and export a new default that returns `<RequireAuth><DashboardInner /></RequireAuth>`. Keeps the hooks inside the inner component so they only run when authed.
3. **Update `frontend/src/app/login/page.tsx`** to honor `?next=` post-success:
   - Read `useSearchParams()` -> `searchParams.get("next")`.
   - Validate: must start with `/`, must not start with `//` (prevents `//evil.com` open-redirect), must not contain a colon followed by `/` (prevents `/anything:...` payloads).
   - Default to `/dashboard` if invalid or missing.
   - `router.push(safeNext)` instead of `router.push("/dashboard")`.

`npx tsc --noEmit` exit 0.

Out of scope: server-side route-group migration (TKT-0029 spec accepts the client wrap as the immediate ship). No new follow-on ticket needed -- if anyone wants the route-group later, they can file one fresh.

## Actions

1. Marked TKT-0029 `inprogress`.
2. Wrote `frontend/src/components/RequireAuth.tsx` -- 38 lines, client component, effect-driven redirect to `/login?next=<encoded-pathname>` with a Loading skeleton fallback.
3. Wrapped five authed pages by extracting inner components (`DashboardInner`, `ConnectInner`, `GroupsInner`, `SendInner`, `HistoryInner`) and having the default export return `<RequireAuth>{inner}</RequireAuth>`. Each page's existing hooks moved into the inner component so they only fire when authed.
4. Added `useSearchParams` + `safeNextPath` helper to `frontend/src/app/login/page.tsx`. The helper rejects null/non-string, paths not starting with `/`, protocol-relative `//`, and anything containing `:`. Login now `router.push(safeNextPath(searchParams.get("next")))`.
5. `npx --no-install tsc --noEmit` -> exit 0.
6. Dev-server smoke: all five authed paths return 200 with the RequireAuth Loading skeleton (no cookie present in curl, so useAuth resolves null and the effect would redirect on a real browser; curl just sees the initial HTML). `/login?next=/dashboard` returns 200.
7. Marked TKT-0029 `resolved` with a detailed seven-file Resolution history.

## Outcome
TKT-0029 resolved. Unauthed visitors hitting `/dashboard` (or any other authed path) will now bounce to `/login?next=<encoded-pathname>` and land back on the original page after login. Open-redirect mitigations are in place (path-only, no protocol-relative, no scheme injection). Next: Verification Agent runs the six-proof browser-curl smoke and commits.
