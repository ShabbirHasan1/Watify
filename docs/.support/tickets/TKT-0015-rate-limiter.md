---
id: TKT-0015
title: Real rate-limit middleware on send endpoints
status: verified
priority: P2
area: backend
created: 2026-05-18T17:29:25Z
updated: 2026-05-18T18:32:26Z
created_by: ticketing_agent
related_plan_item: B-06, B-07, S4
filed_via: gap_analysis
---

## Summary
Watify has the dashboard soft-cap reminder (TKT-0002 SoftCapBanner) but no real rate-limit gate on the backend. A buggy script or fat-finger could fire `POST /api/wa/test/to` in a tight loop and Meta would ban the device before the operator notices.

## Reference
- openalgo uses `flask-limiter` with `WHATSAPP_MESSAGE_RATE_LIMIT` from env (default `10 per minute`).
- wars.md "WhatsApp Terms of Service - practical risk note": send volume is the dominant ban trigger.

## Expected
- Add `slowapi` (FastAPI's idiomatic Flask-Limiter equivalent) and register limits:
  - `/api/wa/test/self` -> `15/minute`.
  - `/api/wa/test/to` -> `10/minute`.
  - `/api/send` -> `5/minute` (it's already throttled inside the job by the 3-30s per-recipient delay, but rate-limit at the entrypoint stops repeated job creation).
- Limits are env-overridable via `WATIFY_RATE_LIMIT_TEST_SELF`, `WATIFY_RATE_LIMIT_TEST_TO`, `WATIFY_RATE_LIMIT_SEND`.
- 429 response uses the flat envelope from TKT-0001: `{"error":"rate_limited","retry_after":...}`.
- Dashboard SoftCapBanner remains as the soft UI signal; this is the hard backend cap.

## Fix sketch
- `uv add slowapi`.
- `app/main.py` register limiter.
- Decorate handlers in `app/routers/whatsapp.py` and `app/routers/jobs.py`.

## Resolution history
- 2026-05-18T17:29:25Z -- filed by Ticketing Agent (iter32).
- 2026-05-18T18:26:50Z -- Resolving Agent (iter44) set status to inprogress.
- 2026-05-18T18:28:30Z -- Resolving Agent (iter44) shipped:
  - `uv add slowapi` (slowapi 0.1.9 + limits 5.8.0).
  - `app/settings.py` -- new env-overridable strings: `WATIFY_RATE_LIMIT_TEST_SELF=15/minute`, `WATIFY_RATE_LIMIT_TEST_TO=10/minute`, `WATIFY_RATE_LIMIT_SEND=5/minute`.
  - `app/limiter.py` -- `Limiter(key_func=get_remote_address)` singleton + custom `rate_limit_handler` returning the flat envelope `{"error":"rate_limited","detail":"<N per period>","retry_after":60}` with the `Retry-After: 60` response header.
  - `app/main.py` -- registers `app.state.limiter` and `add_exception_handler(RateLimitExceeded, rate_limit_handler)`.
  - `app/routers/whatsapp.py` -- `@limiter.limit(settings.rate_limit_test_self)` on `/api/wa/test/self`, `@limiter.limit(settings.rate_limit_test_to)` on `/api/wa/test/to`. Both handlers gained a `request: Request` parameter so slowapi can extract the key.
  - `app/routers/jobs.py` -- `@limiter.limit(settings.rate_limit_send)` on `/api/send` with the same `request` parameter addition.
  - `backend/.env.example` documents the three new variables.

  Smoke: stormed `/api/wa/test/self` 20 times in a tight loop. Calls 1-15 returned **409 not_ready** (limiter let them through, handler enforced the wa-state precondition). Calls 16-20 returned **429** with body `{"error":"rate_limited","detail":"15 per 1 minute","retry_after":60}` and `Retry-After: 60` header. Live wars pair restored after the smoke (state -> ready in 1 poll via the encrypted blob).

  Status set to `resolved`.
- 2026-05-18T18:32:26Z -- Verification Agent (iter45) PASSED across 4 checks:
  1. `/api/wa/test/to` storm of 15 with limit `10/minute`: first 10 returned `200` (handler ran, send queued), next 5 returned `429`. Exact boundary, no off-by-one.
  2. 429 response shape -- both header (`Retry-After: 60`) and body (`{"error":"rate_limited","detail":"10 per 1 minute","retry_after":60}`) present.
  3. `/api/wa/state` storm of 30 (no decorator on this endpoint) -> 30/30 returned 200. Confirms rate-limiter scope is per-decorated-endpoint, not global.
  4. `/api/jobs` storm of 30 (also undecorated) -> 30/30 returned 200.
  Status set to `verified`. Committed `fix(TKT-0015): slowapi rate-limit middleware on send endpoints` and pushed.

  **Verification side-effect noted**: the 10 successful `test/to` calls queued real sends through wars to "+1 415 555 9999" (the US reserved 555-range). Future smoke runs against a paired account should either (a) target the operator's own number for `test/self`-only storms, or (b) stub the WaSingleton.send_to call when the limiter is the unit under test. Filing as a documentation update rather than a separate ticket.
