# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: ticketing
agent: resolving_agent
iteration: 50
last_updated: 2026-05-18T18:55:29Z
last_conversation: docs/.support/conversations/2026-05-18T185529Z-verification_agent-iter50.md
servers:
  backend_running: true
  backend_pid: 37808
  backend_url: http://localhost:8000
  frontend_running: true
  frontend_pid: 42204
  frontend_url: http://localhost:3000
tickets:
  open: 13
  inprogress: 0
  resolved: 0
  verified: 16
ticket_index:
  TKT-0023: verified P1 backend Single-user auth model
  TKT-0024: open P1 backend Auth endpoints + JWT cookies + auth rate limits
  TKT-0025: open P1 backend Auth middleware
  TKT-0026: open P1 frontend /login + /register pages
  TKT-0027: open P2 frontend Public hero page; move dashboard to /dashboard
  TKT-0028: open P2 frontend Auth-aware TopNav
  TKT-0029: open P2 frontend Route guards
  TKT-0030: open P1 infra install/install.sh + update.sh
  TKT-0006: open P3 backend Move test phone constant out of smoke_db.py
  TKT-0008: open P2 frontend Global toaster
  TKT-0014: open P2 backend Pair-code mode alongside QR
  TKT-0016: open P3 backend Pair state machine paired vs ready
  TKT-0017: open P3 backend JID helpers
  TKT-0018: open P3 frontend SSE push of QR
  TKT-0022: open P3 frontend Job drawer cache drift
```

## Next Action
**Resolving Agent** picks up **TKT-0024** (P1 backend) -- auth endpoints + JWT cookies + auth rate limits. Builds directly on TKT-0023's auth_crypto + auth_repo. Endpoints:
- `POST /api/auth/register` (3/min, register-once 409)
- `POST /api/auth/login` (5/min + sliding lockout)
- `POST /api/auth/refresh` (30/min)
- `POST /api/auth/logout` (rotates refresh secret)
- `GET /api/auth/me` (requires auth -- but the auth dep itself lands in TKT-0025)

Note: GET /me will return 401 until TKT-0025 ships the middleware. Smoke can manually decode the cookie to validate the path.

## History (latest only)
- 2026-05-18T18:47:57Z iter48 verification | TKT-0005 VERIFIED + committed 3c8f12f
- 2026-05-18T18:50:59Z iter49 resolving | TKT-0023 auth model
- 2026-05-18T18:55:29Z iter50 verification_agent -> ticketing | TKT-0023 VERIFIED + committed: 9/9 smoke, user table present, 13 symbols importable, live wars + frontend untouched | log: docs/.support/conversations/2026-05-18T185529Z-verification_agent-iter50.md
