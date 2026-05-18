# Iteration 71 -- Resolving Agent (TKT-0028)

- **Started**: 2026-05-18T20:45:02Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0028 (P2 frontend) -- auth-aware TopNav

## Plan
Convert `frontend/src/components/TopNav.tsx` from a server component with hardcoded links to a client component driven by `useAuth()`. Three branches:

- `isLoading` -> render brand wordmark only. Prevents flash-of-wrong-state on first paint while SWR resolves `/api/auth/me`.
- `user === null` (unauthed) -> brand + right-side "Sign in" (link to /login) + "Get started" (filled CTA link to /register).
- `user` truthy (authed) -> brand + center nav (Dashboard / Connect / Groups / Send / History) + right-side `<username>` text + "Logout" button that calls `useAuth().logout()` then `router.push("/")`.

Implementation notes:
- Mark TopNav `"use client"`.
- `useRouter` from `next/navigation` for the post-logout redirect.
- Reuse the existing `links` constant from the prior file.
- Tailwind only, no emojis, no icons.
- `npx tsc --noEmit` must stay clean.

Out of scope: route guards on the dashboard-side pages (TKT-0029). The TopNav is the visible-state piece; the guard is the URL-bar piece.

## Actions

1. Marked TKT-0028 `inprogress`.
2. Rewrote `frontend/src/components/TopNav.tsx`:
   - Added `"use client"`.
   - Imported `useAuth` from `@/hooks/useAuth`, `useRouter` from `next/navigation`, `useState` for the signing-out disabled state.
   - Three render branches keyed on `(isLoading, user)`. Loading -> brand-only with a `flex-1` spacer so the height stays stable. Authed -> full nav + username + Logout button. Unauthed -> Sign in (ghost) + Get started (filled).
   - Brand wordmark href dynamically points at `/dashboard` when authed and `/` when unauthed.
   - Reused the existing `links` constant verbatim (5 entries: Dashboard, Connect, Groups, Send, History).
   - Tailwind only, no emojis, no icons.
3. `npx --no-install tsc --noEmit` -> exit 0.
4. Dev-server smoke (pid 42204): `curl http://localhost:3000/` HTTP 200, 19060 bytes; body contains `Watify`, `Sign in`, `Get started` and does NOT contain `Dashboard` -- the unauthed branch is rendering.
5. Marked TKT-0028 `resolved` with a detailed history entry.

## Outcome
TKT-0028 resolved. TopNav is now auth-aware: unauthed visitors at /, /login, /register see brand + Sign in + Get started; authed visitors on /dashboard, /connect, /groups, /send, /history see the full nav + their username + Logout. Loading paint shows the brand only. Next: Verification Agent runs the six-proof browser-curl smoke and commits.
