---
id: TKT-0038
title: Test connection button on /connect ReadyPanel
status: verified
priority: P3
area: frontend
created: 2026-05-18T22:50:00Z
updated: 2026-05-18T22:50:00Z
created_by: resolving_agent
related_plan_item: -
filed_via: user_direct_request_in_iter95
---

## Summary
Once WhatsApp is paired (state=`ready`) the operator had no way to verify end-to-end send works without going through the full /send flow. Add a "Test connection" button on the ReadyPanel that POSTs a small canary to `/api/wa/test/self`.

## Fix
Out-of-iteration edit during iter95:
- `frontend/src/lib/api.ts` -- new `WaSendResult` type + `wa.testSelf(text)` helper (POST `/api/wa/test/self`).
- `frontend/src/app/connect/page.tsx` -- imported `wa`; ReadyPanel now manages local `testing` + `testResult` state, renders a green "Test connection" button next to "Disconnect", sends `Watify test message at <ISO timestamp> UTC` to self via `wa.testSelf`, surfaces success/failure both inline (colored panel) and via the global toaster.
- Error mapping: 409 -> "WhatsApp is not Ready yet", 429 -> "Too many test sends, try again in a minute", 403 -> "CSRF check rejected the request", other -> `HTTP N`.

Backend endpoint `/api/wa/test/self` already existed (`backend/app/routers/whatsapp.py:105`, rate-limited via `settings.rate_limit_test_self = 15/minute`); no backend change needed.

`npx tsc --noEmit` exit 0. `curl /connect` HTTP 200.

## Resolution history
- 2026-05-18T22:50:00Z -- filed and resolved by Resolving Agent (iter95). Filed as a follow-on ticket so the Verification Agent can include the change in a properly-attributed commit.
