---
id: TKT-0032
title: CSRF defense on state-changing endpoints (X-Requested-With + Origin check)
status: open
priority: P2
area: backend
created: 2026-05-18T19:01:30Z
updated: 2026-05-18T19:01:30Z
created_by: ticketing_agent
related_plan_item: A4
related_tickets: TKT-0024, TKT-0025
filed_via: security_audit_iter51
---

## Summary
Once cookie auth lands (TKT-0024 + TKT-0025), `SameSite=Lax` cookies block CSRF for cross-origin POSTs in modern browsers. That's good but not complete:

- A malicious site can still issue top-level GET navigations that the browser will send the cookie for. Watify's read endpoints are idempotent so this is mostly fine, but `GET` should never have side effects (audit existing routes).
- A malicious page on a flaw'd subdomain (or via XSS elsewhere) could attempt fetch with `credentials: "include"` -- the same-origin policy + CORS allowlist blocks the response read but the request itself fires.

Defense in depth: require a custom header `X-Requested-With: XMLHttpRequest` on all state-changing endpoints (`POST`, `PATCH`, `DELETE`). Simple HTML forms can't set custom headers; a fetch from our own frontend can. This is the same trick Django uses.

## Expected
- `app/main.py` adds a middleware that runs AFTER auth and BEFORE the rate-limit handler:
  - For methods in `{POST, PATCH, PUT, DELETE}` against `/api/*` (except `/api/auth/login` and `/api/auth/register` -- those start without auth state and need to work on first visit), require either `X-Requested-With: XMLHttpRequest` OR a same-origin `Origin` header matching `settings.cors_origin`.
  - Reject with 403 `{"error":"csrf_required","detail":"missing X-Requested-With or invalid Origin"}`.
- `frontend/src/lib/api.ts` adds `X-Requested-With: XMLHttpRequest` to every request alongside the existing Content-Type header.

## Acceptance
- curl POST without the header -> 403.
- curl POST with `-H "X-Requested-With: XMLHttpRequest"` -> works as before.
- Frontend keeps working (api.ts sets the header).
- Login + register still work (allowlisted).

## Resolution history
- 2026-05-18T19:01:30Z -- filed by Ticketing Agent (iter51, security audit defense-in-depth).
