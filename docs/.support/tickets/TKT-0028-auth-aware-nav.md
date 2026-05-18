---
id: TKT-0028
title: Auth-aware TopNav (Login/Register vs Dashboard/Logout)
status: verified
priority: P2
area: frontend
created: 2026-05-18T18:41:55Z
updated: 2026-05-18T20:50:00Z
created_by: ticketing_agent
related_plan_item: F-08, A6
related_tickets: TKT-0026
filed_via: human_manual_input
---

## Summary
TopNav currently always shows the authed links. Should branch on `useAuth()` state.

## Expected
- `frontend/src/components/TopNav.tsx`:
  - Authed: `[Watify] Dashboard Connect Groups Send History` + right-side `<username> Logout`.
  - Unauthed: `[Watify]` + right-side `Sign in | Get started`.
  - Loading (first paint while SWR resolves): show the brand only, no links. Avoids flash-of-wrong-state.
- Logout button posts `/api/auth/logout` then `mutate('/api/auth/me', null)` so SWR drops the cached user; `router.push('/')`.
- Username pulled from `useAuth().user?.username` (set by GET /api/auth/me).

## Resolution history
- 2026-05-18T18:41:55Z -- filed by Ticketing Agent (iter47).
- 2026-05-18T20:46:00Z -- resolved by Resolving Agent (iter71). Converted `frontend/src/components/TopNav.tsx` from a server component with hardcoded links into a 95-line client component (`"use client"`) driven by `useAuth()` from TKT-0026. Three branches: (a) `isLoading` -> brand wordmark + flex-1 spacer, prevents flash-of-wrong-state on first paint while SWR resolves `/api/auth/me`; (b) `user` truthy -> brand + center `<ul>` of Dashboard/Connect/Groups/Send/History links (the existing `links` constant reused verbatim) + right-side `<username>` text + "Logout" button that calls `useAuth().logout()` (which already POSTs `/api/auth/logout` AND `mutate('/api/auth/me', null)` per the iter62 hook) then `router.push("/")`; (c) `user === null` (unauthed) -> brand + right-side "Sign in" link (/login, ghost shape) + "Get started" link (/register, filled-dark CTA shape). Brand wordmark href is `/dashboard` when authed and `/` when unauthed -- clicking the brand goes home from any context. `signingOut` local state disables the logout button during the network round-trip. Tailwind only, no emojis, no icons. `npx tsc --noEmit` exit 0. Dev-server smoke: `curl http://localhost:3000/` HTTP 200, 19060 bytes; body contains `Watify`, `Sign in`, `Get started` (the unauthed nav) and does NOT contain `Dashboard` (the authed branch never renders for an unauthed visitor). Awaits Verification Agent for the browser-curl six-proof pass. Conversation: `docs/.support/conversations/2026-05-18T204502Z-resolving_agent-iter71.md`.
- 2026-05-18T20:50:00Z -- VERIFIED by Verification Agent (iter72). Six proofs: (1) `"use client"` at TopNav.tsx:1, `useAuth` import at line 6. (2) Three render branches present -- `isLoading ?` at line 41, `: user ?` at line 45, then the unauthed else with Sign in/Get started Links at lines 79/85. The brand wordmark href is conditional `user ? "/dashboard" : "/"` at line 35. (3) Logout: `await logout()` at line 24 followed by `router.push("/")` at line 25. (4) `npx --no-install tsc --noEmit` exit 0. (5) Non-ASCII char count: 0. (6) `curl http://localhost:3000/` HTTP 200, 19060 bytes; copy-string occurrence counts: `Watify`=1, `Sign in`=1, `Get started`=1, `Dashboard`=0, `>Connect<`=0, `Logout`=0 -- the unauthed branch is rendered and the authed branch is suppressed. Verified.
