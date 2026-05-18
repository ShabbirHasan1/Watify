---
id: TKT-0029
title: Route guards on /dashboard, /connect, /groups, /send, /history
status: verified
priority: P2
area: frontend
created: 2026-05-18T18:41:55Z
updated: 2026-05-18T21:05:00Z
created_by: ticketing_agent
related_plan_item: F-08, A6
related_tickets: TKT-0026, TKT-0028
filed_via: human_manual_input
---

## Summary
The authed pages currently render whatever data they fetch. With auth enabled the API will 401; the UI should redirect to `/login` rather than show error toasts.

## Expected
Two layers:

1. **Server-side guard (preferred when feasible)** -- `app/(authed)/layout.tsx` reads the `watify_session` cookie in a Next.js Server Component, hits `/api/auth/me`, redirects to `/login` if 401. Routes that need auth move under that route group: `app/(authed)/dashboard/page.tsx` etc.
2. **Client-side guard fallback** -- `frontend/src/components/RequireAuth.tsx`: client component that calls `useAuth()`; while `isLoading` renders a thin skeleton; on `!user` calls `router.replace('/login?next=' + pathname)`. Wrap each authed page until the route group migration lands.

After login, the `?next=` param drives a redirect back. Sensible default: `/dashboard`.

## Resolution history
- 2026-05-18T18:41:55Z -- filed by Ticketing Agent (iter47).
- 2026-05-18T21:03:00Z -- resolved by Resolving Agent (iter74). Seven-file change set: (1) `frontend/src/components/RequireAuth.tsx` (new) -- client component, uses `useAuth()` + `usePathname` + `useRouter`; `useEffect` fires `router.replace("/login?next=" + encodeURIComponent(pathname))` when `!isLoading && !user` (deferred to effect to avoid React's "set state during render" warning); renders a `<div class="text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>` skeleton while loading OR unauthed so the page body never flashes. (2)-(6) Five authed pages (`dashboard`, `connect`, `groups`, `send`, `history`) each refactored to extract the inner component (`DashboardInner`, `ConnectInner`, `GroupsInner`, `SendInner`, `HistoryInner`) and have the default export return `<RequireAuth><FooInner /></RequireAuth>` -- this guarantees the page's own hooks (useGroups, useJobs, useWaState, etc.) ONLY run when authed, so a 401-driven redirect doesn't fire spurious data fetches. (7) `frontend/src/app/login/page.tsx` -- added `useSearchParams` import; new `safeNextPath(raw)` helper validates the `?next=` param against an open-redirect: must be a non-null string, must start with `/`, must NOT start with `//` (protocol-relative), must NOT contain `:` (would-be scheme). Fallback `/dashboard`. `router.push(safeNextPath(searchParams.get("next")))` replaces the hardcoded `router.push("/dashboard")`. `npx tsc --noEmit` exit 0. Dev-server smoke: `GET /dashboard|/connect|/groups|/send|/history` all 200 with the Loading skeleton in the page slot and the TopNav `flex-1` spacer (initial isLoading state); `GET /login?next=/dashboard` 200; the `useAuth` SWR then resolves null (no cookie), the RequireAuth effect fires, and the browser navigates to `/login?next=<encoded>`. Out of scope: server-side route-group migration (the spec accepted the client wrap as the immediate ship). Conversation: `docs/.support/conversations/2026-05-18T205916Z-resolving_agent-iter74.md`.
- 2026-05-18T21:05:00Z -- VERIFIED by Verification Agent (iter75). Seven proofs: (1) `frontend/src/components/RequireAuth.tsx` exists at 1200 bytes; lines 4-5 import `usePathname`/`useRouter` from `next/navigation` and `useAuth` from `@/hooks/useAuth`; lines 16-18 destructure the hook + router + pathname; line 23 calls `router.replace(\`/login?next=${next}\`)`. (2) `grep -l "<RequireAuth>" frontend/src/app/{dashboard,connect,groups,send,history}/page.tsx` returns 5 hits -- every authed page is wrapped. (3) `frontend/src/app/login/page.tsx:4` imports `useSearchParams`; `:12` defines `safeNextPath`; `:42` calls `useSearchParams()`; `:63` calls `router.push(safeNextPath(searchParams.get("next")))`. (4) `safeNextPath` extracted via node + tested with 9 inputs: `null`, `undefined`, `""`, `"/dashboard"`, `"/connect"`, `"//evil.com"`, `"javascript:alert(1)"`, `"http://evil.com"`, `"/a:b"`. Every safe path returned itself; every dangerous input fell through to `/dashboard`. All 9 assertions passed. (5) `npx --no-install tsc --noEmit` exit 0. (6) Non-ASCII char count in `RequireAuth.tsx` = 0. (7) `curl http://localhost:3000/dashboard|/connect|/groups|/send|/history` all 200 (sizes 14062/14048/14041/14027/14048 bytes); `grep -c Loading` on each body returns 1 -- the RequireAuth skeleton is rendered for an unauthed visitor. Verified.
